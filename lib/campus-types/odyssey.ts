import type { ConfidenceScore } from './confidence'

/**
 * Odyssey — the growth/progression and navigation layer (UX-001, ADR-002 §3).
 * Sequence: Evidence -> Capability -> Odyssey -> Academic Passport.
 */
export type OdysseyMilestoneStatus = 'completed' | 'current' | 'upcoming'

export interface OdysseyMilestone {
  id: string
  title: string
  description: string
  status: OdysseyMilestoneStatus
  targetDate?: string
  requiredEvidenceIds: string[]
  requiredCapabilityIds: string[]
}

export interface OdysseyRecommendation {
  id: string
  title: string
  reason: string
  confidence: ConfidenceScore
  evidenceIds: string[]
  capabilityId: string
}

export interface OdysseyPlan {
  id: string
  studentId: string
  targetOutcome: string
  currentPositionSummary: string
  milestones: OdysseyMilestone[]
  recommendations: OdysseyRecommendation[]
  alternatives: string[]
}
