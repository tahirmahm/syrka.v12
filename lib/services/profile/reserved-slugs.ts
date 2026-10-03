/**
 * Reserved-slug registry for syrka.co/[username] (Checkpoint §12). The
 * public Portfolio route must check a candidate slug against this list
 * before it's allowed to resolve to a PortfolioSlug lookup, so the dynamic
 * public route can never capture an existing application route.
 */
export const RESERVED_SLUGS = [
  'campus',
  'student',
  'faculty',
  'department',
  'university',
  'sign-in',
  'passport',
  'software',
  'academia',
  'employers',
  'government',
  'about',
  'api',
] as const

export type ReservedSlug = (typeof RESERVED_SLUGS)[number]

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase())
}

export type SlugValidationResult = { valid: true } | { valid: false; reason: string }

/** A slug must be non-empty, URL-safe, and not reserved. Does not check availability against already-claimed slugs — that's a lookup the caller performs separately. */
export function validateSlugFormat(slug: string): SlugValidationResult {
  if (!slug) return { valid: false, reason: 'A username is required.' }
  if (isReservedSlug(slug)) return { valid: false, reason: `"${slug}" is reserved and cannot be used as a username.` }
  if (!/^[a-z0-9-]{3,32}$/.test(slug.toLowerCase())) {
    return { valid: false, reason: 'Usernames must be 3-32 characters, lowercase letters, numbers, and hyphens only.' }
  }
  return { valid: true }
}
