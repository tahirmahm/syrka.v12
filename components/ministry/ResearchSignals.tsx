'use client'

import { useEffect, useState } from 'react'

interface SignalRow {
  module_code: string
  field_velocity: number
  paper_count: number
  top_paper?: string
}

export default function ResearchSignals({ accentColor }: { accentColor: string }) {
  const [signals, setSignals] = useState<SignalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/research/signals')
      .then(r => r.json())
      .then(data => setSignals(data.signals ?? []))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: accentColor }}>
            Research Signals — National Skills Heat
          </h3>
          <p className="text-xs text-[#484F58] mt-1">
            Live publication velocity across curriculum-mapped research fields
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#484F58]">
          papers/30 days
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[#484F58] text-sm">Loading research signals...</div>
      ) : signals.length === 0 ? (
        <div className="py-8 text-center text-[#484F58] text-sm">
          No research data yet. Run the nightly update cron to populate.
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map((s) => {
            const maxVelocity = Math.max(...signals.map(x => x.field_velocity), 1)
            const pct = Math.round((s.field_velocity / maxVelocity) * 100)
            const isHot = s.field_velocity > 5

            return (
              <div key={s.module_code} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#161B22]">
                <div className="w-16 shrink-0">
                  <span className="text-xs font-mono font-semibold" style={{ color: isHot ? accentColor : '#C9D1D9' }}>
                    {s.module_code}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isHot ? accentColor : '#484F58',
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right shrink-0">
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: isHot ? accentColor : '#C9D1D9' }}
                  >
                    {s.field_velocity}
                  </span>
                </div>
                {isHot && (
                  <span
                    className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                  >
                    HOT
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
