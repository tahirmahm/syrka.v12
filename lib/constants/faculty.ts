import type { ReviewDecisionType, EvidenceLimitationTag, ProvenanceConcernType } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

export const DECISION_TYPE_LABELS: Record<ReviewDecisionType, string> = {
  approve: 'Approve',
  request_revision: 'Request revision',
  request_clarification: 'Request clarification',
  dispute_attribution: 'Dispute attribution',
  revoke: 'Revoke',
  confirm_supersession: 'Confirm supersession',
}

export const DECISION_TYPE_TONES: Record<ReviewDecisionType, BadgeTone> = {
  approve: 'green',
  request_revision: 'amber',
  request_clarification: 'amber',
  dispute_attribution: 'red',
  revoke: 'red',
  confirm_supersession: 'neutral',
}

export const LIMITATION_TAG_LABELS: Record<EvidenceLimitationTag, string> = {
  single_context: 'Single context only',
  stale_context: 'Context has decayed since submission',
  insufficient_detail: 'Insufficient detail',
  unclear_attribution: 'Unclear attribution',
  partial_capability_coverage: 'Only partially covers the claimed capability',
}

export const PROVENANCE_CONCERN_LABELS: Record<ProvenanceConcernType, string> = {
  unclear_authorship: 'Unclear authorship',
  unverifiable_source: 'Unverifiable source',
  possible_duplication: 'Possible duplication',
  external_credential_unverified: 'External credential unverified',
}
