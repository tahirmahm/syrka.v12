import type { OdysseyGenerationResult } from '@/lib/campus-types'

/**
 * The generate/replan API routes return the domain OdysseyGenerationResult
 * plus a small transport-only `meta` block — safe, non-sensitive provenance
 * (which provider actually produced this, how long it took, why a fallback
 * happened) that lets the UI label results honestly instead of merely
 * inferring status from `result.status`.
 */
export interface OdysseyGenerationApiResponse extends OdysseyGenerationResult {
  meta?: {
    generationSource: 'deepseek' | 'fallback'
    requestDurationMs: number
    fallbackReasonCategory?: string
  }
}
