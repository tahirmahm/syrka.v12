'use client'

import { useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Prescription {
  title: string
  what_to_do: string
  why_closes_gap: string
  gap_closure_percent: number
  cost_estimate: string
  timeline: 'short' | 'medium' | 'long'
  key_risk: string
  esco_skill_codes: string[]
  wef_skill_alignment: { aligned: boolean; global_rank: number | null; trend: string }
  ranking_impact: { indicator: string; projected_change: string } | null
  confidence_score: number
  lever: 'curriculum_reform' | 'immigration' | 'employer_training' | 'public_private_partnership' | 'regulatory_change'
  status: 'not_simulated' | 'running' | 'complete' | 'compared'
}

interface PrescriptionCardProps {
  prescription: Prescription
  accentColor: string
  index: number
  onRunSimulation?: (prescription: Prescription) => void
  simulationResult?: { expectedValue: number; confidenceLevel: string } | null
  onViewResults?: () => void
  isSimulating?: boolean
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LEVER_CONFIG: Record<Prescription['lever'], { label: string; classes: string }> = {
  curriculum_reform:        { label: 'Curriculum Reform',          classes: 'bg-blue-500/10 text-blue-400' },
  immigration:              { label: 'Immigration',                classes: 'bg-purple-500/10 text-purple-400' },
  employer_training:        { label: 'Employer Training',          classes: 'bg-amber-500/10 text-amber-400' },
  public_private_partnership: { label: 'Public-Private Partnership', classes: 'bg-emerald-500/10 text-emerald-400' },
  regulatory_change:        { label: 'Regulatory Change',          classes: 'bg-rose-500/10 text-rose-400' },
}

const TIMELINE_CONFIG: Record<Prescription['timeline'], { label: string; classes: string }> = {
  short:  { label: '< 2 years',  classes: 'bg-emerald-500/10 text-emerald-400' },
  medium: { label: '2-5 years',  classes: 'bg-amber-500/10 text-amber-400' },
  long:   { label: '5+ years',   classes: 'bg-rose-500/10 text-rose-400' },
}

const STATUS_CONFIG: Record<Prescription['status'], { label: string; classes: string }> = {
  not_simulated: { label: 'Not simulated', classes: 'bg-slate-500/10 text-slate-400' },
  running:       { label: 'Running...',    classes: 'bg-amber-500/10 text-amber-400' },
  complete:      { label: 'Complete',      classes: 'bg-emerald-500/10 text-emerald-400' },
  compared:      { label: 'Compared',      classes: 'bg-blue-500/10 text-blue-400' },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PrescriptionCard({
  prescription,
  accentColor,
  index,
  onRunSimulation,
  simulationResult,
  onViewResults,
  isSimulating,
}: PrescriptionCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const lever = LEVER_CONFIG[prescription.lever]
  const timeline = TIMELINE_CONFIG[prescription.timeline]
  const status = STATUS_CONFIG[prescription.status]
  const confidencePct = Math.round(prescription.confidence_score * 100)

  const visibleSkills = prescription.esco_skill_codes.slice(0, 3)
  const extraSkillCount = prescription.esco_skill_codes.length - 3

  return (
    <article className="rounded-xl bg-[#0D1117] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
      {/* ---- Top row: lever badge + status badge ---- */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${lever.classes}`}>
          {lever.label}
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* ---- Title ---- */}
      <h4 className="font-display text-base font-semibold text-slate-900 leading-snug">
        <span className="text-slate-400 mr-1.5">{index + 1}.</span>
        {prescription.title}
      </h4>

      {/* ---- What to do ---- */}
      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
          What to do
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          {prescription.what_to_do}
        </p>
      </div>

      {/* ---- Why this closes the gap ---- */}
      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
          Why this closes the gap
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          {prescription.why_closes_gap}
        </p>
      </div>

      {/* ---- Stats row ---- */}
      <div className="flex items-center gap-4 py-3 border-y border-slate-100">
        <div className="text-center">
          <span
            className="block text-2xl font-bold"
            style={{ color: accentColor }}
          >
            {prescription.gap_closure_percent}%
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            Gap closure
          </span>
        </div>

        <div className="w-px h-8 bg-slate-100" />

        <div className="text-center">
          <span className="block text-sm font-semibold text-slate-700">
            {prescription.cost_estimate}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            Est. cost
          </span>
        </div>

        <div className="w-px h-8 bg-slate-100" />

        <div className="text-center">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${timeline.classes}`}>
            {timeline.label}
          </span>
          <span className="block text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
            Timeline
          </span>
        </div>
      </div>

      {/* ---- Key risk ---- */}
      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3.5 py-2.5">
        <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wide mb-0.5">
          Key risk
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          {prescription.key_risk}
        </p>
      </div>

      {/* ---- ESCO skills ---- */}
      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
          ESCO Skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((code) => (
            <span
              key={code}
              className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600"
            >
              {code}
            </span>
          ))}
          {extraSkillCount > 0 && (
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
              +{extraSkillCount} more
            </span>
          )}
        </div>
      </div>

      {/* ---- WEF alignment ---- */}
      <div className="flex items-center gap-2">
        {prescription.wef_skill_alignment.aligned ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
            Globally aligned
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
            Country-specific
          </span>
        )}
        {prescription.wef_skill_alignment.global_rank !== null && (
          <span className="text-[11px] text-slate-400">
            Rank #{prescription.wef_skill_alignment.global_rank}
          </span>
        )}
        <span className="text-[11px] text-slate-400">
          {prescription.wef_skill_alignment.trend}
        </span>
      </div>

      {/* ---- Ranking impact ---- */}
      {prescription.ranking_impact && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Ranking impact
          </span>
          <span className="text-sm font-semibold" style={{ color: accentColor }}>
            {prescription.ranking_impact.indicator} {prescription.ranking_impact.projected_change}
          </span>
        </div>
      )}

      {/* ---- Confidence bar ---- */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Confidence
          </span>
          <span className="text-[11px] text-slate-400">{confidencePct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${confidencePct}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      </div>

      {/* ---- Simulation section ---- */}
      <div className="relative mt-auto pt-2 space-y-2">
        {/* Simulating progress */}
        {isSimulating && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
            <div
              className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
            />
            <span className="text-xs text-amber-700">
              Simulating 5 scenarios across 27 weighted outcomes...
            </span>
          </div>
        )}

        {/* Simulation result summary */}
        {simulationResult && prescription.status === 'complete' && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-700">
                {simulationResult.expectedValue}% expected
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                simulationResult.confidenceLevel === 'high'
                  ? 'bg-emerald-100 text-emerald-700'
                  : simulationResult.confidenceLevel === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {simulationResult.confidenceLevel} confidence
              </span>
            </div>
            <button
              type="button"
              onClick={onViewResults}
              className="text-xs font-medium hover:underline"
              style={{ color: accentColor }}
            >
              View Results
            </button>
          </div>
        )}

        {/* Run / View button */}
        {prescription.status === 'not_simulated' && !isSimulating && (
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => onRunSimulation?.(prescription)}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Run Deep Simulation
          </button>
        )}

        {prescription.status === 'complete' && !simulationResult && (
          <button
            type="button"
            disabled
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            Simulation Complete
          </button>
        )}

        {showTooltip && prescription.status === 'running' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg">
            Simulation in progress...
          </div>
        )}
      </div>
    </article>
  )
}
