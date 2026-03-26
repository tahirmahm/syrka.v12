'use client'

import type { Skill } from '@/lib/types'

interface SkillDemandSignalsProps {
  skills: Skill[]
  accentColor: string
}

const CRITICALITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  low: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
}

export default function SkillDemandSignals({ skills, accentColor }: SkillDemandSignalsProps) {
  const ranked = [...skills].sort((a, b) => (b.gap_score ?? 0) - (a.gap_score ?? 0))

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-slate-800 tracking-tight">
        Skill Demand Signals
      </h3>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_1fr_90px_90px] gap-3 px-5 py-3 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          <span>Skill</span>
          <span>Category</span>
          <span>Gap Score</span>
          <span>Criticality</span>
          <span className="text-right">Growth Rate</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {ranked.map((skill, idx) => {
            const gapScore = skill.gap_score ?? 0
            const maxGap = ranked[0]?.gap_score ?? 1
            const barWidth = maxGap > 0 ? (gapScore / maxGap) * 100 : 0
            const criticality = skill.criticality ?? 'low'
            const styles = CRITICALITY_STYLES[criticality] ?? CRITICALITY_STYLES.low
            const growth = skill.annual_growth_rate ?? 0

            return (
              <div
                key={skill.id}
                className="grid grid-cols-[1fr_100px_1fr_90px_90px] gap-3 px-5 py-3 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* Skill name with rank */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-slate-300 tabular-nums w-4 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-700 truncate">{skill.name}</span>
                </div>

                {/* Category */}
                <span className="text-xs text-slate-400 truncate">
                  {skill.category ?? '--'}
                </span>

                {/* Gap score bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: accentColor,
                        opacity: 0.7 + (barWidth / 100) * 0.3,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums w-8 text-right">
                    {gapScore.toFixed(1)}
                  </span>
                </div>

                {/* Criticality badge */}
                <span
                  className={`inline-flex justify-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-medium ${styles.bg} ${styles.text} ${styles.border}`}
                >
                  {criticality}
                </span>

                {/* Annual growth rate */}
                <span
                  className={`text-xs tabular-nums text-right ${
                    growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  {growth > 0 ? '+' : ''}
                  {(growth * 100).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>

        {ranked.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No skill demand data available
          </div>
        )}
      </div>
    </div>
  )
}
