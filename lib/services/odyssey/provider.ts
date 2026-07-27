import type { OdysseyGenerationRequest, OdysseyReplanningRequest, OdysseyGenerationResult } from '@/lib/campus-types'
import { resolveDeepSeekModel } from '@/lib/deepseek'
import { validateDeepSeekModelResolution } from '@/lib/validation/validate-deepseek-model'

/**
 * The only contract the generation service and API routes depend on.
 * Swapping DeepSeek for another provider later means writing a new adapter
 * against this interface — nothing else in Odyssey needs to change.
 */
export interface OdysseyGenerationProvider {
  generatePlan(request: OdysseyGenerationRequest): Promise<OdysseyGenerationResult>
  replan(request: OdysseyReplanningRequest): Promise<OdysseyGenerationResult>
}

export interface OdysseyProviderConfig {
  model: string
  temperature: number
  maxOutputTokens: number
  timeoutMs: number
  maxRetries: number
}

/**
 * Single server-side location for provider configuration. Reads the model
 * name from an env var so it is never hardcoded across the codebase, and
 * resolves it through resolveDeepSeekModel (lib/deepseek.ts) so a stale
 * legacy alias in an old deployment's env vars normalises to the current
 * V4 default instead of hitting a retired model.
 */
export const ODYSSEY_PROVIDER_CONFIG: OdysseyProviderConfig = {
  model: resolveDeepSeekModel(process.env.ODYSSEY_DEEPSEEK_MODEL).model,
  temperature: 0.2,
  maxOutputTokens: 4000,
  timeoutMs: 25000,
  maxRetries: 1,
}

// Runs unconditionally, mirroring lib/mock-data/seed.ts's validateSeedData
// pattern — never gated behind NODE_ENV, since a production build always
// sets it and a dev-only guard would mean this never executes in a real build.
const deepSeekModelResolutionErrors = validateDeepSeekModelResolution()
if (deepSeekModelResolutionErrors.length > 0) {
  throw new Error(`DeepSeek model resolution check failed:\n${deepSeekModelResolutionErrors.join('\n')}`)
}
