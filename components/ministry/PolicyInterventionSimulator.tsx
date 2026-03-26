'use client'

import { useState, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SectorInfo {
  name: string
  target_year: number
  current_workforce: number
  target_workforce: number
}

interface TrajectoryPoint {
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

interface SimulationResult {
  gap_closure_percent: number
  verdict: 'green' | 'amber' | 'red'
  minister_summary: string
  cost_estimate: string
  roi: string
  trajectory: TrajectoryPoint[]
}

interface PolicyInterventionSimulatorProps {
  sector: SectorInfo
  accentColor: string
  visionId: string
  onSimulationResult?: (trajectory: TrajectoryPoint[]) => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INTERVENTION_TYPES = [
  { value: 'national_bootcamp', label: 'National Bootcamp Programme' },
  { value: 'university_reform', label: 'University Curriculum Reform' },
  { value: 'immigration_fasttrack', label: 'Skilled Immigration Fast-Track' },
  { value: 'industry_upskilling', label: 'Industry Upskilling Grants' },
] as const

type InterventionType = (typeof INTERVENTION_TYPES)[number]['value']

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function verdictColor(verdict: SimulationResult['verdict']): {
  bg: string
  text: string
  label: string
} {
  switch (verdict) {
    case 'green':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Target Achievable' }
    case 'amber':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Partial Closure' }
    case 'red':
      return { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Insufficient Impact' }
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PolicyInterventionSimulator({
  sector,
  accentColor,
  visionId,
  onSimulationResult,
}: PolicyInterventionSimulatorProps) {
  const currentYear = new Date().getFullYear()

  /* Form state */
  const [interventionType, setInterventionType] = useState<InterventionType>('national_bootcamp')
  const [annualOutput, setAnnualOutput] = useState(1000)
  const [startYear, setStartYear] = useState(currentYear + 1)
  const [duration, setDuration] = useState(5)

  /* Request state */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  /* ------ Run Simulation ------ */
  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)

    try {
      const res = await fetch('/api/ai/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          sector_name: sector.name,
          current_workforce: sector.current_workforce,
          target_workforce: sector.target_workforce,
          target_year: sector.target_year,
          intervention_type: interventionType,
          annual_output: annualOutput,
          start_year: startYear,
          duration,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const data: SimulationResult = await res.json()
      setResult(data)

      if (data.trajectory && onSimulationResult) {
        onSimulationResult(data.trajectory)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [
    visionId,
    sector,
    interventionType,
    annualOutput,
    startYear,
    duration,
    onSimulationResult,
  ])

  /* ------ Save Scenario ------ */
  const saveScenario = useCallback(async () => {
    if (!result) return
    setSaving(true)
    try {
      await fetch('/api/ai/scenario/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          sector_name: sector.name,
          intervention_type: interventionType,
          annual_output: annualOutput,
          start_year: startYear,
          duration,
          result,
        }),
      })
      setSaved(true)
    } catch {
      /* silently fail -- non-critical */
    } finally {
      setSaving(false)
    }
  }, [result, visionId, sector.name, interventionType, annualOutput, startYear, duration])

  /* ------ Derived values ------ */
  const minStartYear = currentYear + 1
  const maxStartYear = sector.target_year - 1

  return (
    <aside className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <h3 className="font-display text-lg text-slate-900 mb-1">
        Policy Intervention Simulator
      </h3>
      <p className="text-xs text-slate-400 mb-6">
        Model the impact of workforce development interventions on the {sector.name} gap trajectory.
      </p>

      {/* ------ Intervention Type ------ */}
      <fieldset className="mb-6">
        <legend className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-3">
          Intervention Type
        </legend>
        <div className="space-y-2">
          {INTERVENTION_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 cursor-pointer border transition-colors ${
                interventionType === type.value
                  ? 'border-current bg-slate-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
              style={
                interventionType === type.value
                  ? { borderColor: accentColor, backgroundColor: `${accentColor}08` }
                  : undefined
              }
            >
              <input
                type="radio"
                name="intervention-type"
                value={type.value}
                checked={interventionType === type.value}
                onChange={() => setInterventionType(type.value)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  interventionType === type.value ? '' : 'border-slate-300'
                }`}
                style={
                  interventionType === type.value
                    ? { borderColor: accentColor }
                    : undefined
                }
              >
                {interventionType === type.value && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  interventionType === type.value ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ------ Sliders ------ */}
      <div className="space-y-5 mb-6">
        {/* Annual Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Annual Output
            </label>
            <span className="text-sm font-semibold text-slate-800">
              {annualOutput.toLocaleString()} workers
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={annualOutput}
            onChange={(e) => setAnnualOutput(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{
              // @ts-expect-error -- CSS custom property for accent
              '--range-thumb-bg': accentColor,
              WebkitAppearance: 'none',
            }}
            ref={(el) => {
              if (el) {
                el.style.setProperty('--tw-range-thumb', accentColor)
                // Apply accent color to thumb via inline
                const style = document.createElement('style')
                style.textContent = `
                  input[type=range]#slider-annual::-webkit-slider-thumb { background-color: ${accentColor}; }
                  input[type=range]#slider-annual::-moz-range-thumb { background-color: ${accentColor}; }
                `
                if (!document.querySelector('[data-slider-annual-style]')) {
                  style.setAttribute('data-slider-annual-style', '')
                  document.head.appendChild(style)
                }
              }
            }}
            id="slider-annual"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>100</span>
            <span>5,000</span>
          </div>
        </div>

        {/* Start Year */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Start Year
            </label>
            <span className="text-sm font-semibold text-slate-800">{startYear}</span>
          </div>
          <input
            type="range"
            min={minStartYear}
            max={maxStartYear}
            step={1}
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            id="slider-start-year"
            ref={(el) => {
              if (el) {
                const style = document.createElement('style')
                style.textContent = `
                  input[type=range]#slider-start-year::-webkit-slider-thumb { background-color: ${accentColor}; }
                  input[type=range]#slider-start-year::-moz-range-thumb { background-color: ${accentColor}; }
                `
                if (!document.querySelector('[data-slider-start-year-style]')) {
                  style.setAttribute('data-slider-start-year-style', '')
                  document.head.appendChild(style)
                }
              }
            }}
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{minStartYear}</span>
            <span>{maxStartYear}</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Duration
            </label>
            <span className="text-sm font-semibold text-slate-800">
              {duration} {duration === 1 ? 'year' : 'years'}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            id="slider-duration"
            ref={(el) => {
              if (el) {
                const style = document.createElement('style')
                style.textContent = `
                  input[type=range]#slider-duration::-webkit-slider-thumb { background-color: ${accentColor}; }
                  input[type=range]#slider-duration::-moz-range-thumb { background-color: ${accentColor}; }
                `
                if (!document.querySelector('[data-slider-duration-style]')) {
                  style.setAttribute('data-slider-duration-style', '')
                  document.head.appendChild(style)
                }
              }
            }}
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 year</span>
            <span>10 years</span>
          </div>
        </div>
      </div>

      {/* ------ Run Simulation Button ------ */}
      <button
        onClick={runSimulation}
        disabled={loading}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Running Simulation...
          </span>
        ) : (
          'Run Simulation'
        )}
      </button>

      {/* ------ Loading Pulse ------ */}
      {loading && (
        <div className="mt-4 space-y-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 rounded bg-slate-100 animate-pulse w-3/4" />
          <div className="h-4 rounded bg-slate-100 animate-pulse w-1/2" />
        </div>
      )}

      {/* ------ Error ------ */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm font-medium text-red-700">Simulation Error</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      )}

      {/* ------ Result Card ------ */}
      {result && !loading && (
        <div className="mt-6 space-y-4">
          <div
            className="rounded-xl px-5 py-5 space-y-4"
            style={{ backgroundColor: '#0A1628' }}
          >
            {/* Gap Closure + Verdict */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">
                  Gap Closure
                </p>
                <p className="font-display text-2xl text-white">
                  {result.gap_closure_percent}%
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  verdictColor(result.verdict).bg
                } ${verdictColor(result.verdict).text}`}
              >
                {verdictColor(result.verdict).label}
              </span>
            </div>

            {/* Minister Summary */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-2">
                Minister Summary
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                {result.minister_summary}
              </p>
            </div>

            {/* Cost + ROI */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
              <div>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">
                  Estimated Cost
                </p>
                <p className="text-sm font-semibold text-white">{result.cost_estimate}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">
                  Return on Investment
                </p>
                <p className="text-sm font-semibold text-white">{result.roi}</p>
              </div>
            </div>
          </div>

          {/* Save Scenario */}
          <button
            onClick={saveScenario}
            disabled={saving || saved}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors ${
              saved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {saving
              ? 'Saving...'
              : saved
              ? 'Scenario Saved'
              : 'Save Scenario'}
          </button>
        </div>
      )}
    </aside>
  )
}
