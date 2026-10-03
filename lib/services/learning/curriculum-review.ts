import type { CurriculumLifecycleState } from '@/lib/campus-types'

/**
 * The full Stage B governance graph. 'in_review'/'published' are Stage A's
 * pre-existing states, kept reachable so the existing lg-space-1 fixture
 * stays valid; Stage B's own pipeline runs draft -> ... -> approved and
 * never reaches 'published' itself (no student-facing route exists yet).
 */
const ALLOWED_TRANSITIONS: Record<CurriculumLifecycleState, CurriculumLifecycleState[]> = {
  draft: ['extracting', 'withdrawn'],
  extracting: ['extraction_review', 'failed', 'withdrawn'],
  extraction_review: ['structure_review', 'corrections_required', 'failed', 'withdrawn'],
  corrections_required: ['extraction_review', 'structure_review', 'withdrawn'],
  structure_review: ['ready_for_approval', 'corrections_required', 'withdrawn'],
  ready_for_approval: ['approved', 'corrections_required', 'withdrawn'],
  approved: ['published', 'withdrawn', 'superseded'],
  in_review: ['approved', 'corrections_required', 'withdrawn'],
  published: ['withdrawn', 'superseded'],
  withdrawn: [],
  superseded: [],
  failed: ['draft', 'withdrawn'],
}

export function isTransitionAllowed(from: CurriculumLifecycleState, to: CurriculumLifecycleState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function validateTransition(from: CurriculumLifecycleState, to: CurriculumLifecycleState): string[] {
  if (!isTransitionAllowed(from, to)) {
    return [`Illegal Learning Space transition: "${from}" -> "${to}" is not permitted.`]
  }
  return []
}

/** Stage B may reach 'approved' but must never itself mark a space 'published' — that requires later, separately authorised student-facing work. */
export function isStageBTerminalState(state: CurriculumLifecycleState): boolean {
  return state === 'approved' || state === 'withdrawn' || state === 'failed'
}

/** A review is stale once a correction lands after it was recorded — its basis no longer reflects the current source. */
export function isReviewStale(reviewedAt: string, latestCorrectionAt?: string): boolean {
  if (!latestCorrectionAt) return false
  return new Date(latestCorrectionAt).getTime() > new Date(reviewedAt).getTime()
}
