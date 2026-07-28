'use client'

import { useState } from 'react'

type FarmingType = 'primitive_subsistence' | 'intensive_subsistence' | 'commercial'

interface ComparisonRow {
  label: string
  values: Record<FarmingType, string>
}

const FARMING_TYPE_LABEL: Record<FarmingType, string> = {
  primitive_subsistence: 'Primitive subsistence',
  intensive_subsistence: 'Intensive subsistence',
  commercial: 'Commercial farming',
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Purpose',
    values: {
      primitive_subsistence: 'Feed the farming family — little or no surplus intended for sale.',
      intensive_subsistence: 'Feed the family from a small holding under heavy population pressure — surplus is incidental, not the goal.',
      commercial: 'Produce for sale in the market — output is planned around demand and profit.',
    },
  },
  {
    label: 'Technology',
    values: {
      primitive_subsistence: 'Simple traditional tools (hoe, dao, digging stick); depends on monsoon rainfall and soil fertility.',
      intensive_subsistence: 'HYV seeds, chemical fertilisers, and irrigation used intensively on a small plot.',
      commercial: 'Machinery, HYV seeds, fertilisers, and irrigation, applied at scale for maximum yield.',
    },
  },
  {
    label: 'Labour intensity',
    values: {
      primitive_subsistence: 'Entirely family labour; shifting cultivation with long fallow periods.',
      intensive_subsistence: 'Very high — the same small plot is farmed intensively, often more than once a year.',
      commercial: 'Hired labour, often seasonal migrant labour at harvest time.',
    },
  },
  {
    label: 'Scale',
    values: {
      primitive_subsistence: 'Small, often shifting patches of land ("slash and burn").',
      intensive_subsistence: 'Small holdings, fixed and permanently cultivated.',
      commercial: 'Large landholdings, sometimes plantation-sized.',
    },
  },
  {
    label: 'Market orientation',
    values: {
      primitive_subsistence: 'None — production and consumption happen within the same household or community.',
      intensive_subsistence: 'Low — any surplus is sold locally, but that is not the reason farming happens.',
      commercial: 'High — a single cash crop is often grown specifically to sell.',
    },
  },
  {
    label: 'Typical production pattern',
    values: {
      primitive_subsistence: 'Mixed food crops for direct household consumption (e.g. shifting cultivation regions of the north-east).',
      intensive_subsistence: 'Rice in high-rainfall areas, wheat elsewhere — dominant pattern across much of densely populated India.',
      commercial: 'A single crop grown at scale for sale — e.g. cotton, sugarcane, or tea on a plantation.',
    },
  },
]

interface Scenario {
  id: string
  prompt: string
  answer: FarmingType
  feedback: Record<FarmingType, string>
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    prompt: 'A household in a hilly, forested region clears a small patch of land, grows a mix of food crops using a digging stick, and moves to a new patch after a few seasons once the soil is exhausted.',
    answer: 'primitive_subsistence',
    feedback: {
      primitive_subsistence: 'Correct — shifting cultivation with simple tools and no market orientation is the defining pattern of primitive subsistence farming.',
      intensive_subsistence: 'Not quite — this plot is not fixed or intensively re-farmed each season; the household moves on, which is the hallmark of primitive, not intensive, subsistence farming.',
      commercial: 'Not quite — there is no market orientation here at all, and the technology (a digging stick, no irrigation) is the opposite of commercial farming\'s machinery and inputs.',
    },
  },
  {
    id: 's2',
    prompt: 'A farmer with a small, fixed plot in a densely populated plain grows rice twice a year using high-yielding seeds, fertiliser, and irrigation, mainly to feed a large family with little land to divide further.',
    answer: 'intensive_subsistence',
    feedback: {
      primitive_subsistence: 'Not quite — primitive subsistence uses simple traditional tools and rain-fed land, not HYV seeds, fertiliser, and irrigation.',
      intensive_subsistence: 'Correct — a small, fixed holding farmed intensively to feed the family under population pressure is intensive subsistence farming.',
      commercial: 'Not quite — the purpose here is feeding the family, not producing for sale, even though modern inputs are used.',
    },
  },
  {
    id: 's3',
    prompt: 'A large landholding grows cotton on hundreds of acres using tractors and hired seasonal labour, with the entire harvest sold to textile mills.',
    answer: 'commercial',
    feedback: {
      primitive_subsistence: 'Not quite — there is no shifting cultivation or family-only labour here; this is large-scale, mechanised, and entirely sold rather than consumed.',
      intensive_subsistence: 'Not quite — the scale (hundreds of acres), hired labour, and single cash crop sold to mills are the mark of commercial, not subsistence, farming.',
      commercial: 'Correct — a large scale, a single crop grown specifically for sale, hired labour, and mechanisation are all hallmarks of commercial farming.',
    },
  },
]

/**
 * LEARN-002 — a real comparison/classification interactive for Geography
 * "Types of farming" (ncert-concept-geo-4-2), replacing what the founder
 * rejected in Preview: a Mermaid flowchart reducing this concept to a
 * single "distinction" node fanning out to four keyword rectangles. The
 * comparison table and the classify-a-scenario exercise are both built
 * from real, grounded criteria — never an isolated-keyword graph.
 */
export function FarmingClassificationInteractive() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [selected, setSelected] = useState<Record<string, FarmingType>>({})
  const scenario = SCENARIOS[scenarioIndex]
  const chosen = selected[scenario.id]

  return (
    <div className="flex flex-col gap-5 rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Interactive — comparison and classification</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-28 border-b border-campus-border pb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Criterion</th>
              {(Object.keys(FARMING_TYPE_LABEL) as FarmingType[]).map((type) => (
                <th key={type} className="border-b border-campus-border pb-2 pl-4 font-campus-sans text-campus-sm font-medium text-campus-text">
                  {FARMING_TYPE_LABEL[type]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="border-b border-campus-border py-2 pr-2 align-top font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{row.label}</th>
                {(Object.keys(FARMING_TYPE_LABEL) as FarmingType[]).map((type) => (
                  <td key={type} className="border-b border-campus-border py-2 pl-4 align-top font-campus-sans text-campus-xs text-campus-text">{row.values[type]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-campus-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Classify this scenario ({scenarioIndex + 1} of {SCENARIOS.length})</p>
          {chosen && scenarioIndex < SCENARIOS.length - 1 && (
            <button type="button" onClick={() => setScenarioIndex((i) => i + 1)} className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
              Next scenario →
            </button>
          )}
        </div>
        <p className="mt-2 font-campus-sans text-campus-sm text-campus-text">{scenario.prompt}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(FARMING_TYPE_LABEL) as FarmingType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected((s) => ({ ...s, [scenario.id]: type }))}
              aria-pressed={chosen === type}
              className={`rounded-campus-sm border px-3 py-1.5 font-campus-sans text-campus-sm ${
                chosen === type
                  ? type === scenario.answer
                    ? 'border-campus-green-600 bg-campus-green-600/10 text-campus-text'
                    : 'border-campus-amber-600 bg-campus-amber-600/10 text-campus-text'
                  : 'border-campus-border text-campus-text hover:bg-campus-surface-raised'
              }`}
            >
              {FARMING_TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        {chosen && (
          <p className="mt-3 font-campus-sans text-campus-sm text-campus-text">{scenario.feedback[chosen]}</p>
        )}

        {chosen && (
          <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
            This exploratory interactive is not connected to the concept&rsquo;s own Evidence chain — complete the Test step below for a transfer attempt that counts toward Evidence.
          </p>
        )}
      </div>
    </div>
  )
}
