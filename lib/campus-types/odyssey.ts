import type { ConfidenceScore } from './confidence'
import type { CapabilityMaturity } from './capability'

/**
 * Odyssey — the growth/progression and navigation layer (UX-001, ADR-002 §3).
 * Sequence: Evidence -> Capability -> Odyssey -> Academic Passport.
 */
export type OdysseyMilestoneStatus =
  | 'not_started'
  | 'available'
  | 'in_progress'
  | 'blocked'
  | 'awaiting_evidence'
  | 'awaiting_review'
  | 'complete'
  | 'no_longer_relevant'

/** A capability precondition for a milestone — references the canonical capability, not a duplicate definition. */
export interface OdysseyMilestoneRequirement {
  capabilityId: string
  minimumMaturity: CapabilityMaturity
}

export interface OdysseyMilestone {
  id: string
  order: number
  title: string
  /** What the milestone represents. */
  description: string
  /** Why it matters for the goal. */
  rationale: string
  status: OdysseyMilestoneStatus
  requirements: OdysseyMilestoneRequirement[]
  /** Evidence that would satisfy or has satisfied this milestone. */
  requiredEvidenceIds: string[]
  /** Present only when status is 'blocked'. */
  blockedReason?: string
  /** The concrete next action a student can take right now. */
  recommendedAction?: string
  /** What completing this milestone would change. */
  completionImpact: string
}

export type OdysseyReasoningFactorType =
  | 'intent'
  | 'programme_context'
  | 'capability_claim'
  | 'maturity_gap'
  | 'confidence_gap'
  | 'evidence_gap'
  | 'prerequisite'
  | 'completed_work'
  | 'institutional_constraint'
  | 'uncertainty'

/** One inspectable input to the "why this path" explanation — REASON-001 explanation schema, translated to UI language. */
export interface OdysseyReasoningFactor {
  id: string
  type: OdysseyReasoningFactorType
  summary: string
  relatedCapabilityId?: string
}

export interface OdysseyRecommendation {
  id: string
  title: string
  reason: string
  confidence: ConfidenceScore
  evidenceIds: string[]
  capabilityId: string
  /** Present when the recommendation rests on limited or weak evidence — never hidden. */
  uncertaintyNote?: string
}

export interface OdysseyAlternative {
  id: string
  title: string
  description: string
  tradeoff: string
}

export interface OdysseyPlan {
  id: string
  studentId: string
  targetOutcome: string
  /** Declared or inferred student intent behind the target outcome. */
  intentSummary: string
  currentStage: string
  currentPositionSummary: string
  milestones: OdysseyMilestone[]
  reasoningFactors: OdysseyReasoningFactor[]
  recommendations: OdysseyRecommendation[]
  alternatives: OdysseyAlternative[]
}
