import { evaluateConceptResponse } from '@/lib/services/learning/concept-tutor-engine'
import { selectRepresentationDeterministic } from '@/lib/services/learning/representation-router'
import type {
  TutorReasoningProvider, LearningPlanProvider, AssessmentPlanningProvider, RepresentationSelectionProvider,
  DiagnoseInput, DiagnoseResult, NextMoveInput, NextMoveResult, PlanStep, PlanResult, AssessmentDesignInput, AssessmentDesignResult,
  EvaluateInput, EvaluateResult, RepresentationInput, RepresentationResult,
} from './types'

/**
 * LEARN-002 §3 — the "good, honest, rule-based" floor every provider
 * degrades to when DeepSeek is unavailable, rate-limited, or returns
 * invalid JSON. Reuses the exact evaluation logic concept-tutor-engine.ts
 * already proved out in CLASSX-001 rather than inventing a second scoring
 * system.
 */
export const deterministicTutorReasoningProvider: TutorReasoningProvider = {
  async diagnoseResponse(input: DiagnoseInput): Promise<DiagnoseResult> {
    const evaluation = evaluateConceptResponse(input.responseText, input.view.keyTerms)
    return {
      generationSource: 'deterministic_fallback',
      diagnosis: evaluation.sufficient
        ? `Your response covers ${evaluation.coveredTerms.length} of ${input.view.keyTerms.length} key ideas — enough to proceed.`
        : `Your response covers ${evaluation.coveredTerms.length} of ${input.view.keyTerms.length} key ideas. Missing: ${evaluation.missingTerms.join(', ')}.`,
      likelyMisconception: evaluation.missingTerms[0] ? `Has not yet connected the response to "${evaluation.missingTerms[0]}".` : undefined,
      recommendedNextMove: evaluation.sufficient
        ? 'proceed_to_test'
        : input.sessionState.hintsUsedCount > 0
          ? 'change_representation'
          : 'smaller_hint',
      trace: { requestId: `tr-${crypto.randomUUID()}`, attemptedLiveCall: false },
    }
  },
  async decideNextMove(input: NextMoveInput): Promise<NextMoveResult> {
    const { sessionState } = input
    if (sessionState.attemptsCount === 0) {
      return { generationSource: 'deterministic_fallback', nextMove: 'Start with the smallest useful hint.', reason: 'No attempt has been made yet.' }
    }
    if (sessionState.hintsUsedCount >= 2) {
      return { generationSource: 'deterministic_fallback', nextMove: 'Change representation.', reason: 'Two hints have not resolved the difficulty — the explanation format itself may be the obstacle, not the content.' }
    }
    return { generationSource: 'deterministic_fallback', nextMove: 'Offer the smallest useful hint.', reason: 'A single guided nudge is the smallest intervention that has not yet been tried.' }
  },
}

export const deterministicAssessmentPlanningProvider: AssessmentPlanningProvider = {
  async designAssessment(input: AssessmentDesignInput): Promise<AssessmentDesignResult> {
    return {
      generationSource: 'deterministic_fallback',
      prompt: input.purpose === 'transfer' ? input.view.transferPrompt : input.view.tryPrompt,
    }
  },
  async evaluateResponse(input: EvaluateInput): Promise<EvaluateResult> {
    const evaluation = evaluateConceptResponse(input.responseText, input.view.keyTerms)
    return {
      generationSource: 'deterministic_fallback',
      sufficient: evaluation.sufficient,
      rationale: evaluation.sufficient
        ? `Covers ${evaluation.coveredTerms.length} of ${input.view.keyTerms.length} key ideas.`
        : `Missing: ${evaluation.missingTerms.join(', ')}.`,
    }
  },
}

export const deterministicRepresentationSelectionProvider: RepresentationSelectionProvider = {
  async selectRepresentation(input: RepresentationInput): Promise<RepresentationResult> {
    const decision = selectRepresentationDeterministic(input)
    return { generationSource: 'deterministic_fallback', decision }
  },
}

export const deterministicLearningPlanProvider: LearningPlanProvider = {
  async generatePlan(input): Promise<PlanResult> {
    const steps: PlanStep[] = input.candidates.map((c) => ({
      subject: c.subject,
      chapterTitle: c.chapterTitle,
      conceptTitle: c.conceptTitle,
      conceptHref: c.conceptHref,
      action: `Continue "${c.conceptTitle}"`,
      reason: c.reasonSignal,
      previousObservation: c.previousObservation,
      expectedDurationMinutes: 12,
      plannedRepresentation: 'syrka_visual',
      assessmentPurpose: 'Check whether the concept transfers to a new, unpractised scenario.',
      permittedSupport: 'Smallest useful hint, on request only.',
      expectedSignal: 'Independent transfer without hints.',
      replanningTrigger: 'A second hint is needed, or the transfer attempt fails.',
      evidenceImplication: c.evidenceImplication,
      odysseyImplication: c.odysseyImplication,
    }))
    return { generationSource: 'deterministic_fallback', steps, trace: { requestId: `lp-${crypto.randomUUID()}`, attemptedLiveCall: false } }
  },
}
