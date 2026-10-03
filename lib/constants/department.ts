import type { InterventionType, InterventionStatus } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  revise_assessment: 'Revise an assessment',
  add_evidence_project: 'Add an Evidence-producing project',
  increase_review_capacity: 'Increase Faculty review capacity',
  require_reviewer_calibration: 'Require calibration across reviewers',
  add_prerequisite_module: 'Add a prerequisite module',
  modify_course_capability_mapping: 'Modify course-to-Capability mapping',
  support_cohort: 'Support a student cohort',
  commission_curriculum_review: 'Commission a curriculum review',
  address_provenance_concern: 'Address an Evidence provenance concern',
  refresh_stale_evidence: 'Refresh stale Capability Evidence',
}

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  awaiting_evaluation: 'Awaiting evaluation',
  complete: 'Complete',
  discontinued: 'Discontinued',
}

export const INTERVENTION_STATUS_TONES: Record<InterventionStatus, BadgeTone> = {
  planned: 'neutral',
  active: 'blue',
  awaiting_evaluation: 'amber',
  complete: 'green',
  discontinued: 'neutral',
}
