/**
 * Confidence bands — verbatim from REASON-001 §5.7 "Thresholds".
 * Do not add, rename, or reorder bands; the ranges are constitutional.
 */
export type ConfidenceBand = 'Unsupported' | 'Emerging' | 'Supported' | 'Strong' | 'Verified'

export interface ConfidenceBandDefinition {
  band: ConfidenceBand
  min: number
  max: number
  meaning: string
  permittedUse: string
}

export const CONFIDENCE_BANDS: ConfidenceBandDefinition[] = [
  { band: 'Unsupported', min: 0.0, max: 0.39, meaning: 'Not enough evidence.', permittedUse: 'No capability claim; may guide data collection.' },
  { band: 'Emerging', min: 0.4, max: 0.59, meaning: 'Early support.', permittedUse: 'Learning recommendations only.' },
  { band: 'Supported', min: 0.6, max: 0.74, meaning: 'Meaningful support.', permittedUse: 'Dashboards with caveats.' },
  { band: 'Strong', min: 0.75, max: 0.89, meaning: 'Strong evidence.', permittedUse: 'Passport candidate claim after policy checks.' },
  { band: 'Verified', min: 0.9, max: 1.0, meaning: 'Very strong, current, verified support.', permittedUse: 'High-impact claims where allowed.' },
]

export function confidenceBandFor(score: number): ConfidenceBandDefinition {
  const found = CONFIDENCE_BANDS.find((b) => score >= b.min && score <= b.max)
  return found ?? CONFIDENCE_BANDS[0]
}

export interface ConfidenceScore {
  /** 0–1 calibrated confidence score. */
  score: number
  band: ConfidenceBand
  /** Inference model/run identifier, per REASON-001 explanation schema. */
  model?: string
}
