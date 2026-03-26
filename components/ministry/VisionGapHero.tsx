'use client'

import { useState } from 'react'
import GapTrajectoryChart from '@/components/charts/GapTrajectoryChart'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

import type { Sector } from '@/lib/types'

interface TrajectoryPoint {
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

interface VisionGapHeroProps {
  sectors: Sector[]
  trajectoryData: Record<string, TrajectoryPoint[]>
  accentColor: string
  country: string
  selectedSectorId?: string
  onSectorChange?: (id: string) => void
  simulationTrajectory?: TrajectoryPoint[] | null
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VisionGapHero({
  sectors,
  trajectoryData,
  accentColor,
  country,
  selectedSectorId: externalSectorId,
  onSectorChange,
  simulationTrajectory,
}: VisionGapHeroProps) {
  const [internalSectorId, setInternalSectorId] = useState<string>(
    sectors[0]?.id ?? ''
  )
  const selectedSectorId = externalSectorId || internalSectorId
  const interventionData = simulationTrajectory || null

  const sector = sectors.find((s) => s.id === selectedSectorId) ?? sectors[0]
  if (!sector) return null

  const gap = sector.target_workforce - sector.current_workforce
  const currentYear = new Date().getFullYear()
  const yearsToTarget = Math.max(0, sector.target_year - currentYear)

  /* Determine on-track: is projected trajectory within 10 % of target at target_year? */
  const sectorTrajectory = trajectoryData[sector.name] ?? []
  const targetYearPoint = sectorTrajectory.find(
    (p) => p.year === sector.target_year
  )
  const projectedAtTarget = targetYearPoint?.current_trajectory ?? 0
  const onTrack =
    projectedAtTarget >= sector.target_workforce * 0.9

  /* Merge intervention overlay into chart data */
  const chartData: TrajectoryPoint[] = sectorTrajectory.map((point) => {
    if (!interventionData) return point
    const overlay = interventionData.find((ip) => ip.year === point.year)
    return {
      ...point,
      with_intervention: overlay?.with_intervention ?? point.with_intervention,
    }
  })

  return (
    <section>
      {/* ---------- Country header ---------- */}
      <p
        className="text-xs font-medium tracking-[0.15em] uppercase mb-6"
        style={{ color: accentColor }}
      >
        {country} -- Workforce Vision Gap
      </p>

      {/* ---------- Stat cards ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Current Gap */}
        <div
          className="rounded-xl px-6 py-5"
          style={{ backgroundColor: '#0A1628' }}
        >
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-1">
            Current Gap
          </p>
          <p className="font-display text-3xl text-white leading-tight">
            {formatNumber(Math.abs(gap))}
          </p>
          <p className="text-xs text-white/40 mt-1">
            workers below target in {sector.name}
          </p>
        </div>

        {/* Years to Target */}
        <div
          className="rounded-xl px-6 py-5"
          style={{ backgroundColor: '#0A1628' }}
        >
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-1">
            Years to Target
          </p>
          <p className="font-display text-3xl text-white leading-tight">
            {yearsToTarget}
          </p>
          <p className="text-xs text-white/40 mt-1">
            target year {sector.target_year}
          </p>
        </div>

        {/* On-Track Status */}
        <div
          className="rounded-xl px-6 py-5"
          style={{ backgroundColor: '#0A1628' }}
        >
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-1">
            On-Track Status
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                onTrack
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {onTrack ? 'On Track' : 'Off Track'}
            </span>
            <span className="text-xs text-white/30">
              {onTrack
                ? 'Projected to meet vision target'
                : 'Intervention required to close gap'}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Trajectory chart ---------- */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: '#0A1628' }}
      >
        <h2 className="font-display text-lg text-white mb-4">
          {sector.name} -- Workforce Trajectory
        </h2>
        <GapTrajectoryChart
          data={chartData}
          accentColor={accentColor}
          targetYear={sector.target_year}
        />
      </div>

      {/* ---------- Sector selector tabs ---------- */}
      <div className="flex flex-wrap gap-2">
        {sectors.map((s) => {
          const isActive = s.id === selectedSectorId
          return (
            <button
              key={s.id}
              onClick={() => {
                setInternalSectorId(s.id)
                onSectorChange?.(s.id)
              }}
              className={`
                inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                transition-colors duration-150 border
                ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-white/40 border-white/8 hover:text-white/70 hover:border-white/15 bg-transparent'
                }
              `}
              style={
                isActive
                  ? { backgroundColor: `${accentColor}20`, borderColor: accentColor, color: accentColor }
                  : undefined
              }
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.name}</span>
            </button>
          )
        })}
      </div>

      {/* Parent wires handleInterventionResult to PolicyInterventionSimulator via onInterventionCallbackReady */}
    </section>
  )
}
