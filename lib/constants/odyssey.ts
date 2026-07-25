import type { OdysseyMilestoneStatus, OdysseyMilestoneType, OdysseyRecommendationFactorType } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

export const MILESTONE_STATUS_LABELS: Record<OdysseyMilestoneStatus, string> = {
  recommended: 'Recommended',
  accepted: 'Accepted',
  planned: 'Planned',
  in_progress: 'In progress',
  evidence_pending: 'Evidence pending',
  under_review: 'Under review',
  completed: 'Completed',
  verified: 'Verified',
  deferred: 'Deferred',
  blocked: 'Blocked',
  superseded: 'Superseded',
  no_longer_relevant: 'No longer relevant',
}

export const MILESTONE_STATUS_TONES: Record<OdysseyMilestoneStatus, BadgeTone> = {
  recommended: 'blue',
  accepted: 'blue',
  planned: 'neutral',
  in_progress: 'blue',
  evidence_pending: 'amber',
  under_review: 'amber',
  completed: 'green',
  verified: 'green',
  deferred: 'neutral',
  blocked: 'red',
  superseded: 'neutral',
  no_longer_relevant: 'neutral',
}

export const MILESTONE_TYPE_LABELS: Record<OdysseyMilestoneType, string> = {
  goal: 'Goal',
  capability_target: 'Capability target',
  capability_gap: 'Capability gap',
  course: 'Course',
  module: 'Module',
  project: 'Project',
  assessment: 'Assessment',
  research_opportunity: 'Research opportunity',
  internship: 'Internship',
  competition: 'Competition',
  credential: 'Credential',
  career_milestone: 'Career milestone',
  human_review: 'Human review',
}

export const REASONING_FACTOR_LABELS: Record<OdysseyRecommendationFactorType, string> = {
  intent: 'Your intent',
  programme_context: 'Programme context',
  capability_claim: 'Current capability',
  maturity_gap: 'Maturity gap',
  confidence_gap: 'Confidence gap',
  evidence_gap: 'Evidence gap',
  prerequisite: 'Prerequisite',
  completed_work: 'Completed work',
  institutional_constraint: 'Institutional constraint',
  workload_constraint: 'Workload constraint',
  time_constraint: 'Time constraint',
  student_preference: 'Your preference',
  uncertainty: 'Uncertainty',
}
