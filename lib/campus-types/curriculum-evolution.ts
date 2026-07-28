/**
 * IAU-001 completion pass §6 — the governed curriculum-evolution
 * workflow. A CurriculumProposal is always born from an aggregate
 * condition (never a single student's data) and always stops at Faculty's
 * desk — nothing here can auto-publish. Faculty review actions
 * (approve/reject/request revision) are simulated client-side exactly
 * like components/faculty/InterventionActions.tsx: real, visible,
 * non-persisted state, never a dead button.
 */

export type CurriculumProposalStatus = 'awaiting_faculty_review' | 'revision_requested' | 'approved' | 'rejected'

export interface CurriculumProposalReviewEntry {
  id: string
  proposalId: string
  reviewerId: string
  action: 'inspected_signals' | 'edited' | 'approved' | 'rejected' | 'requested_revision'
  note: string
  occurredAt: string
}

export interface CurriculumProposalSupportingSignal {
  id: string
  description: string
  /** How many cohort members this signal was observed across — never a single-student inference. */
  observedAcrossStudentCount: number
  sourceEventIds: string[]
}

export interface CurriculumProposal {
  id: string
  trigger: string
  affectedSpaceId: string
  affectedChapterId: string
  affectedConceptId: string
  supportingSignalIds: string[]
  proposedChange: string
  expectedBenefit: string
  uncertainty: 'low' | 'moderate' | 'high'
  potentialRisk: string
  sourceReferenceLabel: string
  proposerId: string
  proposerLabel: string
  status: CurriculumProposalStatus
  currentCurriculumVersion: string
  proposedCurriculumVersion: string
  createdAt: string
  reviewHistory: CurriculumProposalReviewEntry[]
  /** Plain-language description of what actually changes between current and proposed version — the "compare" action renders this, not a diff engine. */
  currentVersionSummary: string
  proposedVersionSummary: string
}
