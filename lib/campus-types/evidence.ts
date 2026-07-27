/**
 * Evidence review status — aligned with DB-001 evidence.evidence_items.review_status
 * and DESIGN-001's Evidence Card states (pending, verified, disputed, revoked).
 * "needs revision" (product-facing) maps to the 'disputed' status.
 */
export type EvidenceStatus = 'pending' | 'verified' | 'disputed' | 'revoked'

export type EvidenceSourceType =
  | 'assignment'
  | 'assessment'
  | 'project'
  | 'research'
  | 'presentation'
  | 'internship'
  | 'extracurricular'
  | 'faculty_review'
  | 'external_credential'

/**
 * The evidence artifact itself — kept separate from its review outcome
 * (EvidenceReview below) so the record and the review it received are
 * two distinct entities, not one collapsed object.
 */
export interface EvidenceRecord {
  id: string
  title: string
  sourceType: EvidenceSourceType
  studentId: string
  courseId?: string
  capabilityIds: string[]
  submittedAt: string
  /** Short provenance description shown in evidence-first UI (DESIGN-001 §2). */
  provenance: string
  /** Set when this record corrects or replaces an earlier one (REASON-001 EvidenceCorrected). */
  supersedesEvidenceId?: string
}

/**
 * The outcome of reviewing an evidence record — one per EvidenceRecord.
 * status is 'pending' until a reviewer acts; reviewedAt/reviewedBy/
 * rationale are only present once a review decision has been made.
 */
export interface EvidenceReview {
  id: string
  evidenceId: string
  status: EvidenceStatus
  reviewedAt?: string
  reviewedBy?: string
  rationale?: string
}
