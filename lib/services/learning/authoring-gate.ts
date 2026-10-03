/**
 * Central, server-only feature gate for Syrka Learning authoring
 * (Stage B). This branch has been manually promoted to the production
 * domain while the Learning API surface still has no real authentication,
 * tenancy, or durable storage — see the Learning Persistence and Tenancy
 * Architecture Checkpoint. Until that work lands, production must never
 * serve Learning authoring traffic.
 *
 * Fails closed: any missing, malformed, or ambiguous configuration in
 * production resolves to disabled. Never import this from a client
 * component and never forward its result verbatim to the client beyond
 * "available" / "not available".
 */

const ENABLED_VALUE = 'true'

export interface AuthoringGateEnv {
  NODE_ENV?: string
  LEARNING_AUTHORING_ENABLED?: string
}

/**
 * Pure decision logic taking an explicit env source — this is what makes
 * it possible to test production-mode behaviour deterministically
 * without ever mutating the real process.env of a running server
 * (isLearningAuthoringEnabled/isProductionRuntime below are the only
 * callers that reach for the real process.env; everything else should
 * call this directly with a literal env object).
 */
export function resolveAuthoringGate(env: AuthoringGateEnv): boolean {
  const raw = env.LEARNING_AUTHORING_ENABLED
  const isProduction = env.NODE_ENV === 'production'

  if (isProduction) {
    return raw === ENABLED_VALUE
  }

  if (raw === undefined) return true
  return raw === ENABLED_VALUE
}

/**
 * Development/test may default to enabled (so existing local workflows,
 * the deterministic fixtures, and this repo's own verification passes
 * keep working) unless explicitly turned off. Production defaults to
 * disabled and requires the exact string "true" — anything else
 * (undefined, "TRUE", "1", "yes", whitespace, a typo) fails closed.
 */
export function isLearningAuthoringEnabled(): boolean {
  return resolveAuthoringGate({ NODE_ENV: process.env.NODE_ENV, LEARNING_AUTHORING_ENABLED: process.env.LEARNING_AUTHORING_ENABLED })
}

/** Used by the repository-selection guard (see learning-ingestion-repository.ts) — never itself a source of authorization. */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}
