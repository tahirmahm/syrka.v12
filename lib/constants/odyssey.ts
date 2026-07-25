import type { OdysseyMilestoneStatus, OdysseyReasoningFactorType } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

export const MILESTONE_STATUS_LABELS: Record<OdysseyMilestoneStatus, string> = {
  not_started: 'Not started',
  available: 'Available',
  in_progress: 'In progress',
  blocked: 'Blocked',
  awaiting_evidence: 'Awaiting evidence',
  awaiting_review: 'Awaiting review',
  complete: 'Complete',
  no_longer_relevant: 'No longer relevant',
}

export const MILESTONE_STATUS_TONES: Record<OdysseyMilestoneStatus, BadgeTone> = {
  not_started: 'neutral',
  available: 'blue',
  in_progress: 'blue',
  blocked: 'red',
  awaiting_evidence: 'amber',
  awaiting_review: 'amber',
  complete: 'green',
  no_longer_relevant: 'neutral',
}

export const REASONING_FACTOR_LABELS: Record<OdysseyReasoningFactorType, string> = {
  intent: 'Your intent',
  programme_context: 'Programme context',
  capability_claim: 'Current capability',
  maturity_gap: 'Maturity gap',
  confidence_gap: 'Confidence gap',
  evidence_gap: 'Evidence gap',
  prerequisite: 'Prerequisite',
  completed_work: 'Completed work',
  institutional_constraint: 'Institutional constraint',
  uncertainty: 'Uncertainty',
}
