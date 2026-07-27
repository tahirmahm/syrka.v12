/**
 * Syrka Learning — curriculum governance domain ("Create a Learning
 * Space"). AI-generated curriculum structure never becomes live without
 * teacher approval — the same non-negotiable gate as Odyssey's
 * replanning boundary, applied here to curriculum instead of a plan.
 *
 * Stage A ownership model (per the approved checkpoint correction): one
 * primary teacher/institutional owner, optional contributor ids, no
 * real-time co-authoring, no Department template library, no
 * University-wide inheritance. The domain stays extensible for that
 * later work without implementing it now.
 */

export type CurriculumLifecycleState = 'draft' | 'in_review' | 'approved' | 'published' | 'withdrawn' | 'superseded'

export interface CurriculumOwner {
  id: string
  learningSpaceId: string
  primaryOwnerId: string
  /** Optional co-authors — present in the type for future extensibility; Stage A doesn't implement real-time co-authoring. */
  contributorIds: string[]
}

export interface LearningSpace {
  id: string
  title: string
  curriculumId: string
  ownerId: string
  currentVersionId?: string
  lifecycleState: CurriculumLifecycleState
}

export interface LearningSpaceVersion {
  id: string
  learningSpaceId: string
  version: number
  createdAt: string
  supersedesVersionId?: string
}

export interface CurriculumReview {
  id: string
  learningSpaceVersionId: string
  reviewerId: string
  decision: 'approved' | 'rejected' | 'changes_requested'
  note: string
  reviewedAt: string
}

export interface CurriculumPublication {
  id: string
  learningSpaceVersionId: string
  publishedAt?: string
  withdrawnAt?: string
}
