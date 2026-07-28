import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import type { ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'
import type { LearningVisualSpec, LearningVisualIntent, LearningVisualRenderer } from '@/lib/campus-types/learning-visual-spec'

/**
 * LEARN-002 §3/§4 — every user-visible result carries the model that
 * actually produced it. No call site may claim a model ran when the
 * deterministic fallback actually did.
 */
export type LearningGenerationSource = 'deepseek_v4_pro' | 'deepseek_v4_flash' | 'deterministic_fallback'

export type LearningProviderErrorKind = 'unavailable' | 'timeout' | 'rate_limited' | 'malformed_response' | 'unknown'

export class LearningProviderError extends Error {
  constructor(public kind: LearningProviderErrorKind, message: string) {
    super(message)
    this.name = 'LearningProviderError'
  }
}

export interface ConceptContext {
  view: NcertConceptWorkbenchView
  sessionState: ConceptTutorSessionState
}

// --- TutorReasoningProvider -------------------------------------------------

export interface DiagnoseInput extends ConceptContext {
  responseText: string
}
export interface DiagnoseResult {
  generationSource: LearningGenerationSource
  diagnosis: string
  likelyMisconception?: string
  recommendedNextMove: 'reteach' | 'smaller_hint' | 'change_representation' | 'proceed_to_test' | 'proceed_to_transfer'
}

export interface NextMoveInput extends ConceptContext {}
export interface NextMoveResult {
  generationSource: LearningGenerationSource
  nextMove: string
  reason: string
}

export interface TutorReasoningProvider {
  diagnoseResponse(input: DiagnoseInput): Promise<DiagnoseResult>
  decideNextMove(input: NextMoveInput): Promise<NextMoveResult>
}

// --- LearningPlanProvider ----------------------------------------------------

export interface PlanStepInput {
  subject: string
  chapterTitle: string
  conceptTitle: string
  reasonSignal: string
}
export interface PlanStep {
  subject: string
  chapterTitle: string
  conceptTitle: string
  action: string
  reason: string
  expectedDurationMinutes: number
  plannedRepresentation: LearningVisualRenderer
  assessmentPurpose: string
  permittedSupport: string
  expectedSignal: string
  replanningTrigger: string
}
export interface PlanResult {
  generationSource: LearningGenerationSource
  steps: PlanStep[]
}
export interface LearningPlanProvider {
  generatePlan(input: { horizon: 'interaction' | 'session' | 'week' | 'chapter' | 'term'; candidates: PlanStepInput[] }): Promise<PlanResult>
}

// --- AssessmentPlanningProvider ----------------------------------------------

export interface AssessmentDesignInput extends ConceptContext {
  purpose: 'near_neighbour' | 'transfer'
}
export interface AssessmentDesignResult {
  generationSource: LearningGenerationSource
  prompt: string
}
export interface EvaluateInput extends ConceptContext {
  responseText: string
}
export interface EvaluateResult {
  generationSource: LearningGenerationSource
  sufficient: boolean
  rationale: string
}
export interface AssessmentPlanningProvider {
  designAssessment(input: AssessmentDesignInput): Promise<AssessmentDesignResult>
  evaluateResponse(input: EvaluateInput): Promise<EvaluateResult>
}

// --- VisualPlanningProvider ---------------------------------------------------

export interface VisualSpecInput extends ConceptContext {
  intent: LearningVisualIntent
  tenantId: string
}
export interface VisualSpecProposalResult {
  generationSource: LearningGenerationSource
  spec: LearningVisualSpec
}
export interface VisualPlanningProvider {
  proposeVisualSpec(input: VisualSpecInput): Promise<VisualSpecProposalResult>
}

// --- RepresentationSelectionProvider ------------------------------------------

export interface RepresentationInput extends ConceptContext {
  device: 'desktop' | 'mobile'
  scaffoldLevel: 'full_support' | 'partial_support' | 'independent'
}
export interface RepresentationDecision {
  renderer: LearningVisualRenderer
  reason: string
  alternativesConsidered: { renderer: LearningVisualRenderer; rejectedBecause: string }[]
  expectedLearnerSignal: string
}
export interface RepresentationResult {
  generationSource: LearningGenerationSource
  decision: RepresentationDecision
}
export interface RepresentationSelectionProvider {
  selectRepresentation(input: RepresentationInput): Promise<RepresentationResult>
}
