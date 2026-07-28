import { evaluateConceptResponse } from '@/lib/services/learning/concept-tutor-engine'
import { LEARNING_VISUAL_SPEC_SCHEMA_VERSION, type LearningVisualSpec } from '@/lib/campus-types/learning-visual-spec'
import { selectRepresentationDeterministic } from '@/lib/services/learning/representation-router'
import type {
  TutorReasoningProvider, LearningPlanProvider, AssessmentPlanningProvider, VisualPlanningProvider, RepresentationSelectionProvider,
  DiagnoseInput, DiagnoseResult, NextMoveInput, NextMoveResult, PlanStep, PlanResult, AssessmentDesignInput, AssessmentDesignResult,
  EvaluateInput, EvaluateResult, VisualSpecInput, VisualSpecProposalResult, RepresentationInput, RepresentationResult,
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

export const deterministicVisualPlanningProvider: VisualPlanningProvider = {
  async proposeVisualSpec(input: VisualSpecInput): Promise<VisualSpecProposalResult> {
    const { view, intent, tenantId } = input
    const nodeCount = Math.min(view.keyTerms.length || 3, 6)
    const nodes = (view.keyTerms.length ? view.keyTerms : [view.title]).slice(0, nodeCount).map((term, i) => ({
      id: `n${i}`,
      label: term,
    }))
    const edges = nodes.slice(1).map((n, i) => ({ id: `e${i}`, fromNodeId: nodes[0].id, toNodeId: n.id, label: 'relates to' }))
    const citationText = `${view.citation.bookTitle}, p.${view.citation.page}`

    const spec: LearningVisualSpec = {
      id: `visualspec-${view.conceptId}-${Date.now().toString(36)}`,
      schemaVersion: LEARNING_VISUAL_SPEC_SCHEMA_VERSION,
      tenantId,
      studentId: undefined,
      curriculumSource: citationText,
      spaceId: view.spaceId,
      chapterId: view.chapterId,
      conceptId: view.conceptId,
      title: view.title,
      learningObjective: view.description,
      pedagogicalPurpose: 'explain',
      visualIntent: intent,
      renderer: 'mermaid',
      orientation: 'horizontal',
      nodes,
      edges,
      groups: [],
      stages: [{ id: 's0', order: 0, label: 'Overview', visibleNodeIds: nodes.map((n) => n.id), visibleEdgeIds: edges.map((e) => e.id), narration: view.explanation.slice(0, 300) }],
      annotations: [],
      controls: { allowPause: true, allowReplay: true, allowStepThrough: false, allowManipulation: false },
      interactionRules: [],
      assessmentHooks: [],
      misconceptionTargets: [],
      scaffoldLevel: 'full_support',
      explanation: view.explanation.slice(0, 1000),
      altText: `A concept map for "${view.title}" showing the relationship between ${nodes.map((n) => n.label).join(', ')}.`,
      structuredTextEquivalent: `${view.title}: ${nodes.map((n) => n.label).join(' → ')}.`,
      sourceReferences: [{ citation: citationText }],
      generatedBy: 'deterministic',
      validatedBy: 'schema_validator',
      provenance: { generatedAt: new Date().toISOString(), generationSource: 'deterministic' },
    }
    return { generationSource: 'deterministic_fallback', spec, trace: { requestId: `lvp-${crypto.randomUUID()}`, attemptedLiveCall: false } }
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
      plannedRepresentation: 'mermaid',
      assessmentPurpose: 'Check whether the concept transfers to a new, unpractised scenario.',
      permittedSupport: 'Smallest useful hint, on request only.',
      expectedSignal: 'Independent transfer without hints.',
      replanningTrigger: 'A second hint is needed, or the transfer attempt fails.',
      evidenceImplication: c.evidenceImplication,
      odysseyImplication: c.odysseyImplication,
    }))
    return { generationSource: 'deterministic_fallback', steps }
  },
}
