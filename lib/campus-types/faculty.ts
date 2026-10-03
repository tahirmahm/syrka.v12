import type { CapabilityMaturity } from './capability'
import type { ConfidenceBand } from './confidence'
import type { EvidenceStatus, EvidenceSourceType } from './evidence'

/**
 * Faculty — the review/teaching-context layer (UX-001, ADR-002 §3).
 * Central causal chain this domain exists to make legible:
 * Evidence -> Faculty review -> review decision -> Capability confidence
 * change -> Odyssey update -> Academic Passport readiness change.
 *
 * Kept deliberately separate from EvidenceRecord/EvidenceReview (the
 * artifact and its outcome) and from CapabilityClaim/PassportClaim/
 * OdysseyMilestone (downstream, system-computed effects) — Faculty act on
 * Evidence, they never directly edit those downstream truths.
 */

export interface FacultyProfile {
  id: string
  name: string
  title?: string
  departmentId: string
  institutionId: string
}

export type FacultyCourseRole = 'instructor' | 'co_instructor' | 'reviewer'

export interface FacultyCourseAssignment {
  id: string
  facultyId: string
  courseId: string
  role: FacultyCourseRole
  term: string
}

/**
 * What a Faculty member actually does to an Evidence submission. Maps onto
 * the existing EvidenceStatus vocabulary rather than introducing a
 * conflicting one: approve -> verified, request_revision/dispute_attribution
 * -> disputed ("needs revision" per evidence.ts), revoke -> revoked.
 * request_clarification and confirm_supersession do not change status.
 */
export type ReviewDecisionType =
  | 'approve'
  | 'request_revision'
  | 'request_clarification'
  | 'dispute_attribution'
  | 'revoke'
  | 'confirm_supersession'

export type ProvenanceConcernType =
  | 'unclear_authorship'
  | 'unverifiable_source'
  | 'possible_duplication'
  | 'external_credential_unverified'

export type EvidenceLimitationTag =
  | 'single_context'
  | 'stale_context'
  | 'insufficient_detail'
  | 'unclear_attribution'
  | 'partial_capability_coverage'

/** One Faculty review action — the input a reviewer submits, and the durable record of having submitted it. */
export interface FacultyReviewDecision {
  id: string
  evidenceId: string
  decisionType: ReviewDecisionType
  /** Always required — no decision may be recorded without one. */
  rationale: string
  limitations: EvidenceLimitationTag[]
  /** Capability ids this Evidence is judged to support. */
  supportedCapabilityIds: string[]
  /** Capability ids a claimed relationship does NOT actually support. */
  unsupportedCapabilityIds: string[]
  provenanceConcern?: ProvenanceConcernType
  decidedBy: string
  decidedAt: string
}

/** A review decision in the context of which Evidence version it applied to — the timeline unit shown in the UI. */
export interface ReviewHistoryEntry {
  decision: FacultyReviewDecision
  evidenceVersionId: string
}

/** A course's stated review rubric for one capability — what Faculty are actually looking for. */
export interface ReviewCriteria {
  id: string
  courseId: string
  capabilityId: string
  description: string
  expectedMaturity?: CapabilityMaturity
}

/**
 * Non-authoritative, computed-on-demand projection of what a pending
 * decision would likely do — never persisted, never a guarantee. The
 * Faculty decision and this system inference stay visibly separate.
 */
export interface ReviewImpactPreview {
  evidenceId: string
  decisionType: ReviewDecisionType
  likelyAffectedCapabilities: {
    capabilityId: string
    capabilityName: string
    currentMaturity: CapabilityMaturity
    currentConfidence: ConfidenceBand
    likelyDirection: 'increase' | 'no_change' | 'decrease'
    rationale: string
  }[]
  newlyEligibleForPassportCapabilityNames: string[]
  odysseyMilestonesLikelyUnblocked: string[]
  remainingEvidenceGaps: string[]
  /** Always true — surfaced so callers never accidentally treat this as a final result. */
  isPreview: true
}

/** How a course contributes to capability development — intended vs. actually observed. */
export interface CourseCapabilityCoverage {
  courseId: string
  capabilityId: string
  capabilityName: string
  intended: boolean
  evidenceRequirementDescription: string
  expectedMaturityRange?: [CapabilityMaturity, CapabilityMaturity]
  evidenceProducedCount: number
  studentsWithInsufficientEvidence: number
  claimsAwaitingReview: number
}

export interface FacultyWorkloadSummary {
  facultyId: string
  pendingReviewCount: number
  overdueReviewCount: number
  averageTurnaroundDays: number
  reviewsCompletedLast30Days: number
  coursesTaught: number
}

/**
 * The deliberately restricted view a Faculty member is shown of a student —
 * only what is academically/institutionally relevant to courses they
 * actually teach, never the full Student dashboard.
 */
export interface FacultyVisibleStudentContext {
  studentId: string
  studentName: string
  programmeName: string
  relevantCourseIds: string[]
  evidenceSubmittedCount: number
  pendingEvidenceCount: number
  evidenceNeedingRevisionCount: number
  capabilityClaimsInFacultyCourses: {
    capabilityId: string
    capabilityName: string
    maturity: CapabilityMaturity
    confidence: ConfidenceBand
  }[]
  odysseyMilestoneTitlesLinkedToFacultyCourses: string[]
  passportShareableClaimCount?: number
}

/** A denormalized, read-only queue row — built by the repository, never stored as its own entity. */
export interface ReviewQueueEntry {
  evidenceId: string
  title: string
  studentId: string
  studentName: string
  courseId?: string
  courseLabel?: string
  sourceType: EvidenceSourceType
  submittedAt: string
  status: EvidenceStatus
  ageDays: number
  linkedCapabilityNames: string[]
  /** Qualitative, never a fabricated numeric score. */
  likelyImpactSummary: string
  hasRevisionHistory: boolean
  provenanceSummary: string
}

export interface FacultyAnalyticsSummary {
  reviewVolumeLast30Days: number
  reviewsCompletedLast30Days: number
  averageTurnaroundDays: number
  agingSubmissionsOver7Days: number
  revisionRate: number
  statusDistribution: Record<EvidenceStatus, number>
  evidenceTypeDistribution: Record<EvidenceSourceType, number>
  courseCoverage: { courseId: string; courseLabel: string; capabilitiesCovered: number; evidenceGaps: number }[]
  studentsAwaitingReviewCount: number
}
