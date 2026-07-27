import type { ConflictRecord, DuplicateResolution } from '@/lib/campus-types'

/** A ConflictRecord is resolved once a DuplicateResolution references it — surfaced, never silently auto-merged (Checkpoint §7). */
export function isConflictResolved(conflict: ConflictRecord, resolutions: DuplicateResolution[]): boolean {
  return resolutions.some((r) => r.conflictRecordId === conflict.id)
}

/** A merge must preserve every original assertion id it drew from — "why does this claim exist" must never lose its trail. */
export function mergePreservesProvenance(resolution: DuplicateResolution): boolean {
  if (resolution.action !== 'merge') return true
  return resolution.mergedFromAssertionIds.length >= 2
}

export function resolutionFor(conflict: ConflictRecord, resolutions: DuplicateResolution[]): DuplicateResolution | undefined {
  return resolutions.find((r) => r.conflictRecordId === conflict.id)
}
