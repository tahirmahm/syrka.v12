import type { TutorMode } from './learning-interaction'

/**
 * Tutor mode and assessment authority are separate axes (approved
 * checkpoint correction). Selecting Exam mode does not by itself create a
 * summative assessment; a Tutor-generated question is non-authoritative
 * by default; only a governed assessment policy may create an
 * institutional grade; institutional authority must never be inferred
 * from UI mode alone.
 */

export type AssessmentPurpose = 'diagnostic' | 'practice' | 'formative' | 'summative'

export type AssessmentAuthority = 'tutor_generated' | 'teacher_authored' | 'institution_authored' | 'governed_external'

export interface AssessmentPolicy {
  purpose: AssessmentPurpose
  authority: AssessmentAuthority
  hintsAllowed: boolean
  answerRevealAllowed: boolean
  retriesAllowed: number | null
  timeLimitMinutes?: number
  teacherReviewRequired: boolean
  /** Whether a well-formed attempt against this policy is even eligible to become an EvidenceCandidate — independence and explicit submission (learning-evidence.ts) still gate it further. */
  mayProduceEvidenceCandidate: boolean
  mayProduceInstitutionalGrade: boolean
  accommodations?: string[]
}

export interface LearningAssessment {
  id: string
  lessonId: string
  title: string
  questionIds: string[]
  policy: AssessmentPolicy
}

/**
 * An attempt snapshots the policy it ran under — a later policy edit must
 * never retroactively change what an already-submitted attempt was
 * allowed to do.
 */
export interface AssessmentAttempt {
  id: string
  assessmentId: string
  studentId: string
  policySnapshot: AssessmentPolicy
  tutorMode: TutorMode
  startedAt: string
  submittedAt?: string
}
