/* ------------------------------------------------------------------ */
/*  27-Scenario Weighted Framework                                     */
/* ------------------------------------------------------------------ */

export interface ScenarioDimension {
  label: string
  description: string
  prob: number
}

export interface Scenario {
  id: string
  dimensions: {
    implementation: ScenarioDimension
    stakeholder: ScenarioDimension
    external: ScenarioDimension
  }
  weight: number
  isAnchor: boolean
  gap_closure_percent?: number
}

export const SCENARIO_DIMENSIONS = {
  implementation: [
    { label: 'High fidelity', description: 'Full funding, on-time launch', prob: 0.3 },
    { label: 'Medium fidelity', description: '60% scope, 18-month delay', prob: 0.45 },
    { label: 'Low fidelity', description: '30% scope, restructured year two', prob: 0.25 },
  ],
  stakeholder: [
    { label: 'Cooperative', description: 'Universities, employers, students align', prob: 0.35 },
    { label: 'Resistant', description: 'Universities push back, employers do not participate', prob: 0.3 },
    { label: 'Fragmented', description: 'Partial sector engagement', prob: 0.35 },
  ],
  external: [
    { label: 'Favourable', description: 'GDP growth above trend, FDI inflows', prob: 0.3 },
    { label: 'Neutral', description: 'Baseline IMF projections hold', prob: 0.45 },
    { label: 'Adverse', description: 'Regional shock, reduced employer demand', prob: 0.25 },
  ],
} as const

const ANCHOR_IDS = [
  'High fidelity-Cooperative-Favourable',
  'Low fidelity-Resistant-Adverse',
  'Medium fidelity-Fragmented-Neutral',
  'High fidelity-Resistant-Neutral',
  'Low fidelity-Cooperative-Favourable',
]

export function buildScenarios(): Scenario[] {
  const scenarios: Scenario[] = []

  for (const impl of SCENARIO_DIMENSIONS.implementation) {
    for (const stake of SCENARIO_DIMENSIONS.stakeholder) {
      for (const ext of SCENARIO_DIMENSIONS.external) {
        const id = `${impl.label}-${stake.label}-${ext.label}`
        scenarios.push({
          id,
          dimensions: { implementation: impl, stakeholder: stake, external: ext },
          weight: impl.prob * stake.prob * ext.prob,
          isAnchor: ANCHOR_IDS.includes(id),
        })
      }
    }
  }

  return scenarios
}

/* ------------------------------------------------------------------ */
/*  Interpolation and statistics                                       */
/* ------------------------------------------------------------------ */

function dimensionDistance(a: Scenario, b: Scenario): number {
  const implDist = a.dimensions.implementation.label === b.dimensions.implementation.label ? 0 : 1
  const stakeDist = a.dimensions.stakeholder.label === b.dimensions.stakeholder.label ? 0 : 1
  const extDist = a.dimensions.external.label === b.dimensions.external.label ? 0 : 1
  return implDist + stakeDist + extDist
}

export function interpolateFromAnchors(
  scenario: Scenario,
  anchorResults: Record<string, number>,
  allScenarios: Scenario[]
): number {
  const anchors = allScenarios.filter((s) => s.isAnchor && anchorResults[s.id] !== undefined)
  if (anchors.length === 0) return 0

  let totalWeight = 0
  let weightedSum = 0

  for (const anchor of anchors) {
    const dist = dimensionDistance(scenario, anchor)
    const w = 1 / (dist + 0.1) // avoid division by zero
    weightedSum += w * anchorResults[anchor.id]
    totalWeight += w
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

function weightedPercentile(sorted: Scenario[], p: number): number {
  const totalWeight = sorted.reduce((sum, s) => sum + s.weight, 0)
  const target = totalWeight * p
  let cumulative = 0

  for (const s of sorted) {
    cumulative += s.weight
    if (cumulative >= target) {
      return s.gap_closure_percent ?? 0
    }
  }

  return sorted[sorted.length - 1]?.gap_closure_percent ?? 0
}

export interface OutputStats {
  expectedValue: number
  pessimisticBound: number
  optimisticBound: number
  confidenceLevel: 'low' | 'medium' | 'high'
}

export function computeOutputStats(
  anchorResults: Record<string, number>,
  allScenarios: Scenario[]
): OutputStats {
  // Fill in non-anchor scenarios via interpolation
  for (const s of allScenarios) {
    if (s.isAnchor) {
      s.gap_closure_percent = anchorResults[s.id] ?? 0
    } else {
      s.gap_closure_percent = interpolateFromAnchors(s, anchorResults, allScenarios)
    }
  }

  const expectedValue = allScenarios.reduce(
    (sum, s) => sum + (s.gap_closure_percent ?? 0) * s.weight,
    0
  )

  const sorted = [...allScenarios].sort(
    (a, b) => (a.gap_closure_percent ?? 0) - (b.gap_closure_percent ?? 0)
  )

  const pessimisticBound = weightedPercentile(sorted, 0.1)
  const optimisticBound = weightedPercentile(sorted, 0.9)
  const spread = optimisticBound - pessimisticBound

  const confidenceLevel: 'low' | 'medium' | 'high' =
    spread > 25 ? 'low' : spread > 15 ? 'medium' : 'high'

  return {
    expectedValue: Math.round(expectedValue * 10) / 10,
    pessimisticBound: Math.round(pessimisticBound * 10) / 10,
    optimisticBound: Math.round(optimisticBound * 10) / 10,
    confidenceLevel,
  }
}
