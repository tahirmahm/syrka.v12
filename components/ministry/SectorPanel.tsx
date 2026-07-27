'use client'

import type { Sector, Skill } from '@/lib/types'

interface SectorPanelProps {
  sector: Sector
  skills: Skill[]
  accentColor: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function demandBadgeClasses(level: string | null): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500/10 text-red-400'
    case 'high':
      return 'bg-amber-500/10 text-amber-400'
    case 'medium':
      return 'bg-blue-500/10 text-blue-400'
    case 'low':
      return 'bg-slate-500/10 text-slate-400'
    default:
      return 'bg-slate-500/10 text-slate-400'
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SectorPanel({
  sector,
  skills,
  accentColor,
}: SectorPanelProps) {
  const gap = sector.target_workforce - sector.current_workforce
  const fillPercent = Math.min(
    100,
    Math.round((sector.current_workforce / sector.target_workforce) * 100)
  )

  return (
    <div className="rounded-xl bg-[#0D1117] p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-display text-lg text-slate-900">{sector.name}</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md leading-relaxed">
            {sector.description || ''}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 rounded"
          style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
        >
          Target {sector.target_year}
        </span>
      </div>

      {/* Priority Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Priority Score
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {(sector.priority_score ?? 0)} / 10
          </p>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((sector.priority_score ?? 0) / 10) * 100}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      </div>

      {/* Workforce Numbers */}
      <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-slate-100">
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
            Current
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(sector.current_workforce)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
            Target
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(sector.target_workforce)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
            Gap
          </p>
          <p className="text-lg font-semibold text-red-500">
            {formatNumber(Math.abs(gap))}
          </p>
        </div>
      </div>

      {/* Fill indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-500">Workforce Capacity</p>
          <p className="text-xs font-medium text-slate-700">{fillPercent}%</p>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${fillPercent}%`,
              backgroundColor:
                fillPercent >= 80
                  ? '#16A34A'
                  : fillPercent >= 50
                  ? '#F59E0B'
                  : '#EF4444',
            }}
          />
        </div>
      </div>

      {/* Top Skills with Gap Scores */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          Top Skills -- Gap Assessment
        </p>
        {skills.length === 0 && (
          <p className="text-sm text-slate-400 italic">
            No skills data available for this sector.
          </p>
        )}
        <div className="space-y-2.5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {skill.name}
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${demandBadgeClasses(
                      skill.criticality
                    )}`}
                  >
                    {skill.criticality}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(skill.gap_score ?? 0)}%`,
                        backgroundColor:
                          (skill.gap_score ?? 0) >= 70
                            ? '#EF4444'
                            : (skill.gap_score ?? 0) >= 40
                            ? '#F59E0B'
                            : accentColor,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                    {(skill.gap_score ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
