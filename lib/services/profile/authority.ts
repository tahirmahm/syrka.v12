import type { AuthorityClass, CorroboratingSource } from '@/lib/campus-types'

/**
 * Authority and derivation are two separate axes (Checkpoint §5): authority
 * describes how much an assertion should be trusted, derivation describes
 * how it was produced. Authority is never upgraded by mere repetition —
 * a CV employment entry and a LinkedIn employment entry for the same role
 * do not become externally_verified just because two sources say the same
 * thing; both are self-reported by the same student. Only an independent
 * corroborating source (an employer verification, an institutional record,
 * a verified credential issuer, publication metadata, a merged/reviewed
 * GitHub PR, an independently attributable project outcome) can raise
 * authority.
 */
export function deriveAuthorityClass(baseAuthority: AuthorityClass, corroboratingSources: CorroboratingSource[]): AuthorityClass {
  if (baseAuthority === 'institutionally_reviewed') return baseAuthority
  const hasIndependentCorroboration = corroboratingSources.some((source) => source.independent)
  return hasIndependentCorroboration ? 'externally_verified' : baseAuthority
}

/** True only when at least one corroborating source is independent of the student's own self-reports. */
export function hasIndependentCorroboration(corroboratingSources: CorroboratingSource[]): boolean {
  return corroboratingSources.some((source) => source.independent)
}
