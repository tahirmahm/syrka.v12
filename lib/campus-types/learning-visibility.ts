import type { LearningObservationType } from './learning-observation'

/**
 * Not every LearningObservation is teacher-visible, and the instructional
 * system is not entirely invisible to the assigned teacher either —
 * visibility is modelled as four distinct tiers, each with an explicit
 * disclosure rule into the next, rather than a single private/public
 * toggle. No institutional dashboards are built against this in Stage A;
 * these types exist so a later Stage can't accidentally skip a tier.
 */
export type VisibilityTier = 'student_private' | 'student_and_teacher' | 'evidence_review' | 'department_university_aggregate'

/** Which observation kinds sit at which tier by default. */
export interface ObservationVisibilityPolicy {
  id: string
  observationType: LearningObservationType
  tier: VisibilityTier
  description: string
}

/**
 * One directed disclosure rule between tiers. Department/University
 * aggregate reporting is the only tier requiring de-identification and a
 * minimum cohort size — no individual Tutor transcript, raw misconception
 * history, or private observation ever crosses that boundary, in Stage A
 * or later.
 */
export interface InstructionalDisclosureRule {
  id: string
  fromTier: VisibilityTier
  toTier: VisibilityTier
  allowed: boolean
  requiresCoursePolicy?: boolean
  requiresDeidentification?: boolean
  requiresMinimumCohortSize?: number
  purposeLimitation?: string
}
