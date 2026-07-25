/**
 * Evidence review status — aligned with DB-001 evidence.evidence_items.review_status
 * and DESIGN-001's Evidence Card states (pending, verified, disputed, revoked).
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

export interface EvidenceItem {
  id: string
  title: string
  sourceType: EvidenceSourceType
  status: EvidenceStatus
  studentId: string
  courseId?: string
  capabilityIds: string[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerNote?: string
  /** Short provenance description shown in evidence-first UI (DESIGN-001 §2). */
  provenance: string
}
