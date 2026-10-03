import type { GovernancePolicyArea, GovernancePolicyState, InstitutionalInterventionType, InstitutionalInterventionStatus } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

export const GOVERNANCE_AREA_LABELS: Record<GovernancePolicyArea, string> = {
  capability_taxonomy: 'Capability taxonomy',
  programme_capability_mapping: 'Programme-Capability mapping',
  evidence_standards: 'Evidence standards',
  review_criteria: 'Review criteria',
  review_calibration: 'Review calibration',
  evidence_provenance: 'Evidence provenance',
  passport_issuance: 'Passport issuance policy',
  disclosure_policy: 'Disclosure policy',
  odyssey_recommendation_authority: 'Odyssey recommendation authority',
  ai_authority_boundaries: 'AI authority boundaries',
  data_access_purpose: 'Data-access purpose',
  role_boundaries: 'Role boundaries',
  versioning: 'Versioning',
}

export const GOVERNANCE_STATE_LABELS: Record<GovernancePolicyState, string> = {
  active_policy: 'Active policy',
  proposed_policy: 'Proposed policy',
  demo_configuration: 'Demo configuration',
  requires_backend_integration: 'Requires backend integration',
}

export const GOVERNANCE_STATE_TONES: Record<GovernancePolicyState, BadgeTone> = {
  active_policy: 'green',
  proposed_policy: 'blue',
  demo_configuration: 'purple',
  requires_backend_integration: 'amber',
}

export const INSTITUTIONAL_INTERVENTION_TYPE_LABELS: Record<InstitutionalInterventionType, string> = {
  institution_wide_calibration: 'Institution-wide review calibration',
  cross_department_curriculum_review: 'Cross-department curriculum review',
  evidence_project_framework: 'New Evidence-producing project framework',
  shared_research_opportunity: 'Shared research opportunity',
  central_review_capacity_programme: 'Central review-capacity programme',
  capability_taxonomy_revision: 'Capability taxonomy revision',
  passport_readiness_initiative: 'Passport-readiness initiative',
  odyssey_resource_expansion: 'Odyssey resource expansion',
  evidence_provenance_audit: 'Evidence provenance audit',
  stale_evidence_refresh_programme: 'Stale-Evidence refresh programme',
}

export const INSTITUTIONAL_INTERVENTION_STATUS_LABELS: Record<InstitutionalInterventionStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  awaiting_evaluation: 'Awaiting evaluation',
  complete: 'Complete',
  discontinued: 'Discontinued',
}

export const INSTITUTIONAL_INTERVENTION_STATUS_TONES: Record<InstitutionalInterventionStatus, BadgeTone> = {
  planned: 'neutral',
  active: 'blue',
  awaiting_evaluation: 'amber',
  complete: 'green',
  discontinued: 'neutral',
}
