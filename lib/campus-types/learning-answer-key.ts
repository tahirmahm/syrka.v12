import type { TutorMode } from './learning-interaction'
import type { AssessmentAuthority } from './learning-assessment'

/**
 * Answer material is stored separately from ordinary Tutor retrieval
 * context — excluded from Socratic/Practice context by default, available
 * only for validation, later feedback, or a permitted reveal (hint level
 * 7). Every access is logged with when and why; behaviour respects the
 * active Tutor mode and supports a teacher override. Domain and policy
 * types only in Stage A — no answer content lives in ordinary fixtures
 * (see lib/mock-data/learning-seed.ts's separation).
 */

export interface AnswerKeyEntry {
  id: string
  questionId: string
  version: number
  /** The actual answer material. Deliberately never referenced from a LearningQuestion directly (learning-content.ts) — only via answerKeyEntryId, so ordinary content fixtures never carry it inline. */
  content: string
}

export type AnswerKeyAccessReason = 'validation' | 'feedback' | 'permitted_reveal' | 'teacher_override'

export interface AnswerKeyAccessLog {
  id: string
  answerKeyEntryId: string
  sessionId: string
  accessedAt: string
  reason: AnswerKeyAccessReason
  revealLevel: number
  teacherOverrideBy?: string
}

/** Mode- and assessment-authority-aware access rule — the structural guarantee that the Tutor cannot accidentally retrieve a full answer mid-diagnosis. */
export interface AnswerKeyAccessPolicy {
  id: string
  tutorMode: TutorMode
  assessmentAuthority?: AssessmentAuthority
  allowedReasons: AnswerKeyAccessReason[]
  minimumHintLevelForReveal: number
}
