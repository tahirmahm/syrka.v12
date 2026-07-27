import type { DisclosurePermission, DisclosureAudience } from '@/lib/campus-types'

/**
 * The single question every Passport/Portfolio projection must ask before
 * showing a record: is there an explicit DisclosurePermission allowing it
 * for this audience? There is no implicit "public unless marked private"
 * default anywhere in this model (Checkpoint §11) — a record with no
 * matching permission row is never visible.
 */
export function isVisibleToAudience(permissions: DisclosurePermission[], recordId: string, audience: DisclosureAudience): boolean {
  const permission = permissions.find((p) => p.recordId === recordId && p.audience === audience)
  return Boolean(permission?.allowed)
}

/** Every record id in `recordIds` that is NOT visible to the given audience — used to assert nothing private leaks into a projection. */
export function recordsHiddenFromAudience(permissions: DisclosurePermission[], recordIds: string[], audience: DisclosureAudience): string[] {
  return recordIds.filter((id) => !isVisibleToAudience(permissions, id, audience))
}
