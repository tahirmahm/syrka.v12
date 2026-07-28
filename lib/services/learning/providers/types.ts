import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import type { ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'
import type { LearningRenderer } from '@/lib/campus-types/learning-renderer'

/**
 * LEARN-002 §3/§4 — every user-visible result carries the model that
 * actually produced it. No call site may claim a model ran when the
 * deterministic fallback actually did.
 */
export type LearningGenerationSource = 'deepseek_v4_pro' | 'deepseek_v4_flash' | 'deterministic_fallback'

/**
 * The 4 diagnostic states tracked internally (server logs, Preview-only
 * diagnostics, Faculty/admin surfaces) for every DeepSeek-backed result.
 * The ordinary Student lesson never shows this level of detail — see the
 * restrained 3-label scheme each component derives from this category.
 */
export type LearningResultCategory = 'deepseek_live' | 'deepseek_cached' | 'deterministic_unavailable' | 'deterministic_not_configured'

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

/**
 * A safe-to-display trace of what actually happened on this call — never
 * the API key, never the raw provider error text, only a request id and a
 * typed error kind — so "a live call was attempted and failed" is
 * distinguishable from "no key configured" without exposing secrets.
 */
export interface ProviderTrace {
  requestId: string
  attemptedLiveCall: boolean
  fallbackReason?: LearningProviderErrorKind
  keyConfigured?: boolean
  resultCategory?: LearningResultCategory
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
  trace: ProviderTrace
}

export type NextMoveInput = ConceptContext
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
  conceptHref: string
  reasonSignal: string
  previousObservation: string
  evidenceImplication: string
  odysseyImplication: string
}
export interface PlanStep {
  subject: string
  chapterTitle: string
  conceptTitle: string
  conceptHref: string
  action: string
  reason: string
  previousObservation: string
  expectedDurationMinutes: number
  plannedRepresentation: LearningRenderer
  assessmentPurpose: string
  permittedSupport: string
  expectedSignal: string
  replanningTrigger: string
  evidenceImplication: string
  odysseyImplication: string
}
export interface PlanResult {
  generationSource: LearningGenerationSource
  steps: PlanStep[]
  trace: ProviderTrace
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

// --- RepresentationSelectionProvider ------------------------------------------

export interface RepresentationInput extends ConceptContext {
  device: 'desktop' | 'mobile'
  scaffoldLevel: 'full_support' | 'partial_support' | 'independent'
}
export interface RepresentationDecision {
  renderer: LearningRenderer
  reason: string
  alternativesConsidered: { renderer: LearningRenderer; rejectedBecause: string }[]
  expectedLearnerSignal: string
  /**
   * true means this renderer is a hard, code-owned constraint (an authored
   * 3D scene, a graphable relationship, a required independent-assessment
   * text-only path, a specific concept's composed infographic) that no
   * provider — live or deterministic — may override. A live DeepSeek call
   * is never even consulted for the renderer field when this is true; see
   * selectRepresentation() in deepseek-teaching-provider.ts.
   */
  mandatory: boolean
}
export interface RepresentationResult {
  generationSource: LearningGenerationSource
  decision: RepresentationDecision
}
export interface RepresentationSelectionProvider {
  selectRepresentation(input: RepresentationInput): Promise<RepresentationResult>
}
