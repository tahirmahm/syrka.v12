import type { OdysseyGenerationRequest, OdysseyReplanningRequest, OdysseyGenerationResult } from '@/lib/campus-types'

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
 * name from an env var so it is never hardcoded across the codebase; falls
 * back to the model already used by the existing legacy DeepSeek routes.
 */
export const ODYSSEY_PROVIDER_CONFIG: OdysseyProviderConfig = {
  model: process.env.ODYSSEY_DEEPSEEK_MODEL || 'deepseek-chat',
  temperature: 0.2,
  maxOutputTokens: 4000,
  timeoutMs: 25000,
  maxRetries: 1,
}
