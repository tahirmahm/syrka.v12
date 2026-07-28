import { LEARNING_VISUAL_SPEC_SCHEMA_VERSION, type LearningVisualSpec } from '@/lib/campus-types/learning-visual-spec'
import { validateVisualSpec } from '@/lib/services/learning/visual-spec-validator'
import { selectRepresentationDeterministic } from '@/lib/services/learning/representation-router'
import { callLearningDeepSeek, LEARNING_PROVIDER_CONFIG } from './deepseek-call'
import {
  deterministicTutorReasoningProvider, deterministicAssessmentPlanningProvider,
  deterministicVisualPlanningProvider, deterministicLearningPlanProvider,
} from './deterministic-fallbacks'
import { LearningProviderError } from './types'
import type {
  TutorReasoningProvider, LearningPlanProvider, AssessmentPlanningProvider, VisualPlanningProvider, RepresentationSelectionProvider,
  DiagnoseInput, DiagnoseResult, NextMoveInput, NextMoveResult, PlanResult, PlanStep, AssessmentDesignInput, AssessmentDesignResult,
  EvaluateInput, EvaluateResult, VisualSpecInput, VisualSpecProposalResult, RepresentationInput, RepresentationResult,
} from './types'

/**
 * LEARN-002 §4 — deepseek-v4-pro, thinking-mode-appropriate operations:
 * diagnosis, planning, assessment design/evaluation, VisualSpec proposal,
 * representation comparison. Every method wraps its DeepSeek call in a
 * try/catch that falls back to the proven deterministic implementation on
 * any error — timeout, rate limit, or a response that fails
 * validateVisualSpec()/basic shape checks. No method can return a result
 * claiming a model call succeeded when it actually fell back.
 */

/** Per-warm-instance cache only (see semanticVisualCache in semantic-visual-provider.ts for the same disclosure). */
const planCache = new Map<string, PlanStep[]>()

export const DeepSeekV4ProTeachingProvider: TutorReasoningProvider & LearningPlanProvider & AssessmentPlanningProvider & VisualPlanningProvider & RepresentationSelectionProvider = {
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
      const system = 'You are Syrka\'s personalised-plan generator for an NCERT Class X student. Respond only with strict JSON: {"steps": [{"action": string, "reason": string, "expectedDurationMinutes": number, "plannedRepresentation": "mermaid"|"desmos"|"custom_react"|"structured_text", "assessmentPurpose": string, "permittedSupport": string, "expectedSignal": string, "replanningTrigger": string}]}. Return exactly one step per candidate, in the same order given. Ground every step in the candidate given — never invent a concept not listed.'
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
          plannedRepresentation: s.plannedRepresentation ?? 'mermaid',
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

  async proposeVisualSpec(input: VisualSpecInput): Promise<VisualSpecProposalResult> {
    const requestId = `lvp-${crypto.randomUUID()}`
    const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
    try {
      const system = `You propose a LearningVisualSpec (schemaVersion "${LEARNING_VISUAL_SPEC_SCHEMA_VERSION}") for an NCERT Class X concept map. Respond only with strict JSON matching this shape exactly: {"nodes": [{"id": string, "label": string}], "edges": [{"id": string, "fromNodeId": string, "toNodeId": string, "label": string}], "explanation": string, "altText": string, "structuredTextEquivalent": string}. Maximum 8 nodes, 10 edges. Ground every label in the given concept material only — never invent facts.`
      const user = JSON.stringify({ concept: input.view.title, description: input.view.description, keyTerms: input.view.keyTerms, citation: input.view.citation })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const proposed = raw as { nodes?: LearningVisualSpec['nodes']; edges?: LearningVisualSpec['edges']; explanation?: string; altText?: string; structuredTextEquivalent?: string }
      const citationText = `${input.view.citation.bookTitle}, p.${input.view.citation.page}`
      const spec: LearningVisualSpec = {
        id: `visualspec-${input.view.conceptId}-${Date.now().toString(36)}`,
        schemaVersion: LEARNING_VISUAL_SPEC_SCHEMA_VERSION,
        tenantId: input.tenantId,
        studentId: undefined,
        curriculumSource: citationText,
        spaceId: input.view.spaceId,
        chapterId: input.view.chapterId,
        conceptId: input.view.conceptId,
        title: input.view.title,
        learningObjective: input.view.description,
        pedagogicalPurpose: 'explain',
        visualIntent: input.intent,
        renderer: 'mermaid' as const,
        orientation: 'horizontal' as const,
        nodes: proposed.nodes ?? [],
        edges: proposed.edges ?? [],
        groups: [],
        stages: [],
        annotations: [],
        controls: { allowPause: true, allowReplay: true, allowStepThrough: false, allowManipulation: false },
        interactionRules: [],
        assessmentHooks: [],
        misconceptionTargets: [],
        scaffoldLevel: 'full_support' as const,
        explanation: proposed.explanation ?? input.view.explanation.slice(0, 1000),
        altText: proposed.altText ?? `A concept map for "${input.view.title}".`,
        structuredTextEquivalent: proposed.structuredTextEquivalent ?? input.view.title,
        sourceReferences: [{ citation: citationText }],
        generatedBy: 'deepseek_v4_pro' as const,
        validatedBy: 'schema_validator' as const,
        provenance: { generatedAt: new Date().toISOString(), generationSource: 'deepseek_v4_pro' as const },
      }
      const validation = validateVisualSpec(spec)
      if (!validation.valid) throw new Error(`invalid spec: ${validation.issues.join('; ')}`)
      return { generationSource: 'deepseek_v4_pro', spec, trace: { requestId, attemptedLiveCall: true } }
    } catch (error) {
      const fallbackReason = error instanceof LearningProviderError ? error.kind : keyConfigured ? 'unknown' : undefined
      const fallback = await deterministicVisualPlanningProvider.proposeVisualSpec(input)
      return { ...fallback, trace: { requestId, attemptedLiveCall: keyConfigured, fallbackReason } }
    }
  },

  async selectRepresentation(input: RepresentationInput): Promise<RepresentationResult> {
    try {
      const system = 'You choose the best renderer for teaching an NCERT Class X concept from this fixed set: mermaid, desmos, custom_react, structured_text. Respond only with strict JSON: {"renderer": string, "reason": string, "expectedLearnerSignal": string}.'
      const user = JSON.stringify({ subject: input.view.subject, concept: input.view.title, scaffoldLevel: input.scaffoldLevel, device: input.device, hintsUsed: input.sessionState.hintsUsedCount })
      const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
      const r = raw as { renderer?: string; reason?: string; expectedLearnerSignal?: string }
      const validRenderers = new Set(['mermaid', 'desmos', 'custom_react', 'custom_canvas', 'excalidraw', 'structured_text', 'static_accessible_fallback'])
      if (!r.renderer || !validRenderers.has(r.renderer) || !r.reason) throw new Error('malformed')
      const deterministic = selectRepresentationDeterministic(input)
      return {
        generationSource: 'deepseek_v4_pro',
        decision: {
          renderer: r.renderer as RepresentationResult['decision']['renderer'],
          reason: r.reason,
          alternativesConsidered: deterministic.alternativesConsidered,
          expectedLearnerSignal: r.expectedLearnerSignal ?? deterministic.expectedLearnerSignal,
        },
      }
    } catch {
      return { generationSource: 'deterministic_fallback', decision: selectRepresentationDeterministic(input) }
    }
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
