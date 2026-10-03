import type { TutorMode } from './learning-interaction'
import type { SourceReference } from './learning-source'

/**
 * Syrka Learning — observation domain (what Syrka records about the
 * learning process). Kept entirely separate from EvidenceRecord,
 * EvidenceReview, CapabilityClaim, CapabilityInference (Passport
 * Intelligence Stage A), OdysseyMilestone, and PassportClaim — Learning
 * activity is not automatically Evidence.
 */

export type IndependenceLevel = 'fully_guided' | 'substantially_guided' | 'partially_guided' | 'independent'

export type LearningObservationType =
  | 'attempt'
  | 'misconception'
  | 'hint_used'
  | 'concept_demonstrated'
  | 'transfer_demonstrated'
  | 'revision_needed'
  | 'independent_solution'
  | 'guided_solution'

export interface LearningObservation {
  id: string
  studentId: string
  courseId: string
  lessonId: string
  conceptId: string
  observationType: LearningObservationType
  tutorMode: TutorMode
  independenceLevel: IndependenceLevel
  sourceReferences: SourceReference[]
  attemptId?: string
  misconceptionIds?: string[]
  hintLevel?: number
  /**
   * True only when an independently correct response followed a
   * materially different problem after a complete-solution reveal —
   * reading a solution never counts as demonstrating understanding on
   * its own (see the hint-ladder policy, §7 of the checkpoint).
   */
  followsMaterializedTransferAfterReveal?: boolean
  recordedAt: string
}

/**
 * A private-by-default LearningObservation is far too granular for a
 * teacher or Odyssey to consume directly. This is the aggregated,
 * course-scoped view that ObservationVisibilityPolicy (learning-
 * visibility.ts) actually authorises to be shared — never raw transcripts,
 * hint-by-hint history, or misconception detail beyond what's summarised
 * here.
 */
export interface LearningObservationSummary {
  id: string
  studentId: string
  courseId: string
  conceptsNeedingAttention: string[]
  assessmentStatusSummary: string
  hintDependenceLevel: 'low' | 'moderate' | 'high'
  independentTransferAchieved: boolean
  safetyInterruptionOccurred: boolean
  teacherActionRequired: boolean
  summarisedAt: string
}
