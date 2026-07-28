import { DeepSeekV4ProTeachingProvider, DeepSeekV4FlashTransformationProvider } from './deepseek-teaching-provider'

/**
 * LEARN-002 §4 — the single set of provider instances every server-side
 * call site (Tutor actions, the plan API, the "Visualise this" flow)
 * imports. Each method on DeepSeekV4ProTeachingProvider already contains
 * its own try/catch-to-deterministic-fallback, so importing this object
 * is sufficient — no separate feature-flag factory is needed. Never
 * import this from a client component; every consumer must be a server
 * route or a server-only service module.
 */
export const learningProviders = {
  tutorReasoning: DeepSeekV4ProTeachingProvider,
  learningPlan: DeepSeekV4ProTeachingProvider,
  assessmentPlanning: DeepSeekV4ProTeachingProvider,
  representationSelection: DeepSeekV4ProTeachingProvider,
  flashTransformation: DeepSeekV4FlashTransformationProvider,
}

export * from './types'
