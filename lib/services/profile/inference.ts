import { confidenceBandFor } from '@/lib/campus-types'
import type { ConfidenceScore, CapabilityInferenceBasis } from '@/lib/campus-types'

/**
 * Deterministic, explainable confidence from a CapabilityInference's basis
 * records — never an opaque model score. Primary bases count more than
 * supporting ones; more independent bases raise confidence, capped below
 * "Verified" (Stage A never claims institutional verification for an
 * inferred, unreviewed capability — see REASON-001 §5.7's own
 * "Verified: very strong, current, verified support" definition, which this
 * pipeline cannot satisfy on its own).
 */
export function computeInferenceConfidence(bases: CapabilityInferenceBasis[]): ConfidenceScore {
  const primaryCount = bases.filter((b) => b.weight === 'primary').length
  const supportingCount = bases.filter((b) => b.weight === 'supporting').length
  const score = Math.min(0.89, 0.3 + primaryCount * 0.25 + supportingCount * 0.1)
  return { score, band: confidenceBandFor(score).band, model: 'profile-inference-v1' }
}
