import { isLearningRenderer } from '@/lib/campus-types/learning-renderer'
import { selectRepresentationDeterministic } from '@/lib/services/learning/representation-router'
import { callLearningDeepSeek, LEARNING_PROVIDER_CONFIG } from './deepseek-call'
import {
  deterministicTutorReasoningProvider, deterministicAssessmentPlanningProvider, deterministicLearningPlanProvider,
} from './deterministic-fallbacks'
import type {
  TutorReasoningProvider, LearningPlanProvider, AssessmentPlanningProvider, RepresentationSelectionProvider,
  DiagnoseInput, DiagnoseResult, NextMoveInput, NextMoveResult, PlanResult, PlanStep, AssessmentDesignInput, AssessmentDesignResult,
  EvaluateInput, EvaluateResult, RepresentationInput, RepresentationResult,
} from './types'

/**
 * LEARN-002 §4 — deepseek-v4-pro, thinking-mode-appropriate operations:
 * diagnosis, planning, assessment design/evaluation, representation
 * comparison. Every method wraps its DeepSeek call in a try/catch that
 * falls back to the proven deterministic implementation on any error —
 * timeout, rate limit, or a malformed response. No method can return a
 * result claiming a model call succeeded when it actually fell back.
 * DeepSeek is never offered a generic node-edge graph renderer as a
 * choice — see lib/campus-types/learning-renderer.ts.
 */

/** Per-warm-instance cache only (see semanticVisualCache in semantic-visual-provider.ts for the same disclosure). */
const planCache = new Map<string, PlanStep[]>()

export const DeepSeekV4ProTeachingProvider: TutorReasoningProvider & LearningPlanProvider & AssessmentPlanningProvider & RepresentationSelectionProvider = {
  async diagnoseResponse(input: DiagnoseInput): Promise<DiagnoseResult> {
    const requestId = `tr-${crypto.randomUUID()}`
    const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
    if (!keyConfigured) {
      const fallback = await deterministicTutorReasoningProvider.diagnoseResponse(input)
      return { ...fallback, trace: { requestId, attemptedLiveCall: false, keyConfigured, resultCategory: 'deterministic_not_configured' } }
    }
    try {
      const system = 'You are Syrka\'s deterministic-first pedagogical diagnostician for an NCERT Class X student. Respond only with strict JSON: {"diagnosis": string, "likelyMisconception": string | null, "recommendedNextMove": "reteach" | "smaller_hint" | "change_representation" | "proceed_to_test" | "proceed_to_transfer"}. Never invent curriculum facts beyond what is given.'
      const user = JSON.stringify({
        concept: input.view.title,
        keyTerms: input.view.keyTerms,
        studentResponse: input.responseText,
        hintsUsedSoFar: input.sessionState.hintsUsedCount,
        attemptsSoFar: input.sessionState.attemptsCount,
      })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as Partial<DiagnoseResult>
      if (!r.diagnosis || !r.recommendedNextMove) throw new Error('malformed')
      console.info('[learning:tutor] diagnoseResponse', JSON.stringify({ keyConfigured, resultCategory: 'deepseek_live', requestId }))
      return {
        generationSource: 'deepseek_v4_pro',
        diagnosis: r.diagnosis,
        likelyMisconception: r.likelyMisconception ?? undefined,
        recommendedNextMove: r.recommendedNextMove,
        trace: { requestId, attemptedLiveCall: true, keyConfigured, resultCategory: 'deepseek_live' },
      }
    } catch {
      console.info('[learning:tutor] diagnoseResponse', JSON.stringify({ keyConfigured, resultCategory: 'deterministic_unavailable', requestId }))
      const fallback = await deterministicTutorReasoningProvider.diagnoseResponse(input)
      return { ...fallback, trace: { requestId, attemptedLiveCall: true, keyConfigured, resultCategory: 'deterministic_unavailable' } }
    }
  },

  async decideNextMove(input: NextMoveInput): Promise<NextMoveResult> {
    try {
      const system = 'You are Syrka\'s pedagogical strategist. Respond only with strict JSON: {"nextMove": string, "reason": string}.'
      const user = JSON.stringify({ concept: input.view.title, sessionState: input.sessionState })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as Partial<NextMoveResult>
      if (!r.nextMove || !r.reason) throw new Error('malformed')
      return { generationSource: 'deepseek_v4_pro', nextMove: r.nextMove, reason: r.reason }
    } catch {
      return deterministicTutorReasoningProvider.decideNextMove(input)
    }
  },

  async generatePlan(input): Promise<PlanResult> {
    const requestId = `lp-${crypto.randomUUID()}`
    const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
    const cacheKey = `${input.horizon}:${input.candidates.map((c) => c.conceptHref).join(',')}`

    if (!keyConfigured) {
      const fallback = await deterministicLearningPlanProvider.generatePlan(input)
      return { ...fallback, trace: { requestId, attemptedLiveCall: false, keyConfigured, resultCategory: 'deterministic_not_configured' } }
    }

    const cached = planCache.get(cacheKey)
    if (cached) {
      return { generationSource: 'deepseek_v4_pro', steps: cached, trace: { requestId, attemptedLiveCall: false, keyConfigured, resultCategory: 'deepseek_cached' } }
    }

    try {
      // Only the narrative/pedagogical fields are asked of DeepSeek — routing
      // facts (conceptHref, previousObservation, evidenceImplication,
      // odysseyImplication) come from our own data below, never from the model.
      // plannedRepresentation is restricted to Syrka's own real renderer set —
      // never a generic node-edge graph engine.
      const system = 'You are Syrka\'s personalised-plan generator for an NCERT Class X student. Respond only with strict JSON: {"steps": [{"action": string, "reason": string, "expectedDurationMinutes": number, "plannedRepresentation": "syrka_visual"|"custom_interactive"|"desmos"|"three_scene"|"excalidraw"|"structured_text", "assessmentPurpose": string, "permittedSupport": string, "expectedSignal": string, "replanningTrigger": string}]}. Return exactly one step per candidate, in the same order given. Ground every step in the candidate given — never invent a concept not listed.'
      const user = JSON.stringify(input.candidates.map((c) => ({ subject: c.subject, chapterTitle: c.chapterTitle, conceptTitle: c.conceptTitle, reasonSignal: c.reasonSignal })))
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as { steps?: Partial<PlanStep>[] }
      if (!Array.isArray(r.steps) || r.steps.length !== input.candidates.length) throw new Error('malformed')
      const steps: PlanStep[] = r.steps.map((s, i) => {
        const c = input.candidates[i]
        if (!s.action || !s.reason || !s.assessmentPurpose) throw new Error('malformed step')
        return {
          subject: c.subject,
          chapterTitle: c.chapterTitle,
          conceptTitle: c.conceptTitle,
          conceptHref: c.conceptHref,
          action: s.action,
          reason: s.reason,
          previousObservation: c.previousObservation,
          expectedDurationMinutes: s.expectedDurationMinutes ?? 12,
          plannedRepresentation: isLearningRenderer(s.plannedRepresentation) ? s.plannedRepresentation : 'syrka_visual',
          assessmentPurpose: s.assessmentPurpose,
          permittedSupport: s.permittedSupport ?? 'Smallest useful hint, on request only.',
          expectedSignal: s.expectedSignal ?? 'Independent transfer without hints.',
          replanningTrigger: s.replanningTrigger ?? 'A second hint is needed, or the transfer attempt fails.',
          evidenceImplication: c.evidenceImplication,
          odysseyImplication: c.odysseyImplication,
        }
      })
      planCache.set(cacheKey, steps)
      console.info('[learning:plan] generatePlan', JSON.stringify({ keyConfigured, resultCategory: 'deepseek_live', requestId }))
      return { generationSource: 'deepseek_v4_pro', steps, trace: { requestId, attemptedLiveCall: true, keyConfigured, resultCategory: 'deepseek_live' } }
    } catch {
      console.info('[learning:plan] generatePlan', JSON.stringify({ keyConfigured, resultCategory: 'deterministic_unavailable', requestId }))
      const fallback = await deterministicLearningPlanProvider.generatePlan(input)
      return { ...fallback, trace: { requestId, attemptedLiveCall: true, keyConfigured, resultCategory: 'deterministic_unavailable' } }
    }
  },

  async designAssessment(input: AssessmentDesignInput): Promise<AssessmentDesignResult> {
    try {
      const system = 'You design one assessment prompt for an NCERT Class X concept, grounded only in the given material. Respond only with strict JSON: {"prompt": string}.'
      const user = JSON.stringify({ concept: input.view.title, description: input.view.description, purpose: input.purpose, existingPrompt: input.purpose === 'transfer' ? input.view.transferPrompt : input.view.tryPrompt })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as Partial<AssessmentDesignResult>
      if (!r.prompt) throw new Error('malformed')
      return { generationSource: 'deepseek_v4_pro', prompt: r.prompt }
    } catch {
      return deterministicAssessmentPlanningProvider.designAssessment(input)
    }
  },

  async evaluateResponse(input: EvaluateInput): Promise<EvaluateResult> {
    try {
      const system = 'You evaluate a Class X student response for coverage of the given key ideas only — never introduce outside facts. Respond only with strict JSON: {"sufficient": boolean, "rationale": string}.'
      const user = JSON.stringify({ concept: input.view.title, keyTerms: input.view.keyTerms, responseText: input.responseText })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as Partial<EvaluateResult>
      if (typeof r.sufficient !== 'boolean' || !r.rationale) throw new Error('malformed')
      return { generationSource: 'deepseek_v4_pro', sufficient: r.sufficient, rationale: r.rationale }
    } catch {
      return deterministicAssessmentPlanningProvider.evaluateResponse(input)
    }
  },

  async selectRepresentation(input: RepresentationInput): Promise<RepresentationResult> {
    // Renderer eligibility is decided in code, never by a model call. An
    // authored 3D scene, a graphable relationship, a required
    // independent-assessment text-only path, and a specific concept's
    // composed infographic are all mandatory decisions from
    // selectRepresentationDeterministic() — no live or deterministic
    // provider may override them. A live model was previously found able
    // to replace the authored Geography 3D terrain scene (and, before
    // that, this router's generic-graph-avoidance choices) simply because
    // its prompt still offered a renderer list to choose from; DeepSeek
    // is no longer consulted for this field at all.
    return { generationSource: 'deterministic_fallback', decision: selectRepresentationDeterministic(input) }
  },
}

/**
 * deepseek-v4-flash — low-risk transformations only (simplify, shorten,
 * regenerate alt text, nearby example). Deliberately narrow surface: this
 * pass wires it to the Tutor's "Simplify" and "Add detail" visual
 * actions, not to anything that decides curriculum content or Evidence
 * status.
 */
export const DeepSeekV4FlashTransformationProvider = {
  async transformText(kind: 'simplify' | 'expand' | 'shorten' | 'regenerate_alt_text', text: string, conceptTitle: string): Promise<{ generationSource: 'deepseek_v4_flash' | 'deterministic_fallback'; text: string }> {
    try {
      const instruction: Record<typeof kind, string> = {
        simplify: 'Rewrite this explanation in simpler language for a Class X student, same facts, no new claims.',
        expand: 'Add one clarifying sentence to this explanation, same facts, no new claims.',
        shorten: 'Shorten this explanation to at most two sentences, same facts, no new claims.',
        regenerate_alt_text: 'Write concise, accurate alt text (under 40 words) describing this visual\'s content.',
      }
      const system = `${instruction[kind]} Respond only with strict JSON: {"text": string}. Never introduce a fact not present in the input.`
      const user = JSON.stringify({ conceptTitle, text })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.flash, system, user)
      const r = raw as { text?: string }
      if (!r.text) throw new Error('malformed')
      return { generationSource: 'deepseek_v4_flash', text: r.text }
    } catch {
      return { generationSource: 'deterministic_fallback', text }
    }
  },
}
