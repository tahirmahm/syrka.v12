'use client'

import { useState } from 'react'

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

const LEVER_LABEL: Record<Prescription['lever'], string> = {
  curriculum_reform:           'Curriculum Reform',
  immigration:                 'Immigration',
  employer_training:           'Employer Training',
  public_private_partnership:  'Public-Private Partnership',
  regulatory_change:           'Regulatory Change',
}

const TIMELINE_LABEL: Record<Prescription['timeline'], string> = {
  short:  '< 2 years',
  medium: '2–5 years',
  long:   '5+ years',
}

const STATUS_LABEL: Record<Prescription['status'], string> = {
  not_simulated: 'Not simulated',
  running:       'Running...',
  complete:      'Complete',
  compared:      'Compared',
}

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

  const confidencePct = Math.round(prescription.confidence_score * 100)
  const visibleSkills = prescription.esco_skill_codes.slice(0, 3)
  const extraSkillCount = prescription.esco_skill_codes.length - 3

  return (
    <article className="bg-surface-container-low ghost-border flex flex-col gap-5 p-6">

      {/* Top row: lever + status */}
      <div className="flex items-center justify-between gap-2">
        <span className="data-chip">{LEVER_LABEL[prescription.lever]}</span>
        <span className={prescription.status === 'not_simulated' ? 'status-active' : prescription.status === 'running' ? 'status-active' : 'status-active'}>
          {STATUS_LABEL[prescription.status]}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-headline font-bold text-primary leading-snug">
        <span className="text-outline mr-2">{index + 1}.</span>
        {prescription.title}
      </h4>

      {/* What to do */}
      <div>
        <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">What to do</p>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{prescription.what_to_do}</p>
      </div>

      {/* Why this closes the gap */}
      <div>
        <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Why this closes the gap</p>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{prescription.why_closes_gap}</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 py-4 border-y border-surface-container-high">
        <div>
          <span className="block font-headline text-2xl font-bold text-primary tabular-nums">
            {prescription.gap_closure_percent}%
          </span>
          <span className="font-label text-label-sm uppercase tracking-widest text-outline">Gap closure</span>
        </div>

        <div className="w-px h-8 bg-surface-container-high" />

        <div>
          <span className="block font-headline font-bold text-primary text-sm">{prescription.cost_estimate}</span>
          <span className="font-label text-label-sm uppercase tracking-widest text-outline">Est. cost</span>
        </div>

        <div className="w-px h-8 bg-surface-container-high" />

        <div>
          <span className="data-chip block mb-1">{TIMELINE_LABEL[prescription.timeline]}</span>
          <span className="font-label text-label-sm uppercase tracking-widest text-outline">Timeline</span>
        </div>
      </div>

      {/* Key risk */}
      <div className="bg-surface-container p-4" style={{ borderLeft: '2px solid rgba(255,180,171,0.4)' }}>
        <p className="font-label text-label-sm uppercase tracking-widest text-error mb-2">Key risk</p>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{prescription.key_risk}</p>
      </div>

      {/* ESCO skills */}
      <div>
        <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">ESCO Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map(code => (
            <span key={code} className="font-label text-[10px] uppercase tracking-wider bg-surface-container-highest text-on-surface-variant px-2 py-0.5">
              {code}
            </span>
          ))}
          {extraSkillCount > 0 && (
            <span className="font-label text-[10px] uppercase tracking-wider bg-surface-container text-outline px-2 py-0.5">
              +{extraSkillCount} more
            </span>
          )}
        </div>
      </div>

      {/* WEF alignment */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="data-chip">
          {prescription.wef_skill_alignment.aligned ? 'Globally aligned' : 'Country-specific'}
        </span>
        {prescription.wef_skill_alignment.global_rank !== null && (
          <span className="font-label text-label-sm uppercase tracking-widest text-outline">
            Rank #{prescription.wef_skill_alignment.global_rank}
          </span>
        )}
        <span className="font-label text-label-sm uppercase tracking-widest text-outline">
          {prescription.wef_skill_alignment.trend}
        </span>
      </div>

      {/* Ranking impact */}
      {prescription.ranking_impact && (
        <div className="flex items-center gap-3">
          <span className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Ranking impact</span>
          <span className="font-headline font-bold text-primary text-sm">
            {prescription.ranking_impact.indicator} {prescription.ranking_impact.projected_change}
          </span>
        </div>
      )}

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Confidence</span>
          <span className="font-label text-label-sm text-outline">{confidencePct}%</span>
        </div>
        <div className="h-px w-full bg-surface-container-high">
          <div className="h-px bg-primary transition-all duration-500" style={{ width: `${confidencePct}%` }} />
        </div>
      </div>

      {/* Simulation section */}
      <div className="relative mt-auto pt-2 space-y-2 ghost-border p-4 bg-surface-container">

        {isSimulating && (
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-3.5 border border-primary border-t-transparent animate-spin" />
            <span className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">
              Simulating 5 scenarios across 27 weighted outcomes...
            </span>
          </div>
        )}

        {simulationResult && prescription.status === 'complete' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-headline font-bold text-primary text-sm">
                {simulationResult.expectedValue}% expected
              </span>
              <span className="data-chip">{simulationResult.confidenceLevel} confidence</span>
            </div>
            <button
              type="button"
              onClick={onViewResults}
              className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              View Results
            </button>
          </div>
        )}

        {prescription.status === 'not_simulated' && !isSimulating && (
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => onRunSimulation?.(prescription)}
            className="btn-primary w-full">
            Run Deep Simulation
          </button>
        )}

        {prescription.status === 'complete' && !simulationResult && (
          <button type="button" disabled
            className="w-full font-label text-label-sm uppercase tracking-widest text-outline py-3 disabled:opacity-50"
            style={{ background: 'none', border: '1px solid rgba(71,71,71,0.4)', cursor: 'not-allowed' }}>
            Simulation Complete
          </button>
        )}

        {showTooltip && prescription.status === 'running' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-surface-container-highest px-3 py-1.5 font-label text-xs text-on-surface-variant ghost-border">
            Simulation in progress...
          </div>
        )}
      </div>
    </article>
  )
}
