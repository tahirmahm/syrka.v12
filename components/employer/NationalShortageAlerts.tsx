'use client'

import type { Skill } from '@/lib/types'

interface NationalShortageAlertsProps {
  skills: Skill[]
  accentColor: string
}

export default function NationalShortageAlerts({ skills, accentColor }: NationalShortageAlertsProps) {
  const criticalSkills = skills.filter((s) => s.criticality === 'critical')

  if (criticalSkills.length === 0) {
    return null
  }

  const sorted = [...criticalSkills].sort(
    (a, b) => (b.gap_score ?? 0) - (a.gap_score ?? 0)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg text-slate-800 tracking-tight">
          National Shortage Alerts
        </h3>
        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
          {criticalSkills.length} Critical
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((skill) => {
          const supply = skill.current_supply
          const demand = skill.projected_demand_target_year
          const gap = demand - supply
          const supplyRatio = demand > 0 ? (supply / demand) * 100 : 0

          return (
            <div
              key={skill.id}
              className="bg-white rounded-lg border border-red-100 p-5 space-y-4 relative overflow-hidden"
            >
              {/* Urgency indicator stripe */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-800">{skill.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {skill.category ?? 'Uncategorised'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-red-600">
                    Critical
                  </span>
                </div>
              </div>

              {/* Supply vs Demand bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Supply vs Demand</span>
                  <span className="text-slate-500 tabular-nums">
                    {supplyRatio.toFixed(0)}% covered
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(supplyRatio, 100)}%`,
                      backgroundColor: supplyRatio < 50 ? '#EF4444' : supplyRatio < 75 ? '#F59E0B' : accentColor,
                    }}
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-700 tabular-nums">
                    {supply.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">Current Supply</p>
                </div>
                <div>
                  <p
                    className="text-lg font-semibold tabular-nums"
                    style={{ color: accentColor }}
                  >
                    {demand.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">Projected Demand</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-600 tabular-nums">
                    {gap > 0 ? '-' : ''}
                    {Math.abs(gap).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">Gap</p>
                </div>
              </div>

              {/* Growth rate note */}
              {skill.annual_growth_rate !== null && (
                <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  Demand growing at{' '}
                  <span className="text-red-600 font-medium">
                    {((skill.annual_growth_rate ?? 0) * 100).toFixed(1)}% per year
                  </span>
                  {' '}-- immediate intervention recommended
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
