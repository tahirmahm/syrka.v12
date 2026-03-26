'use client'

import { useMemo } from 'react'

interface HeatmapSkill {
  name: string
  gap_score: number
  criticality: 'critical' | 'high' | 'medium' | 'low' | null
  sector: string
}

interface SectorHeatmapProps {
  skills: HeatmapSkill[]
  accentColor: string
}

function getIntensityColor(gapScore: number, accentColor: string): string {
  const clamped = Math.max(0, Math.min(100, gapScore))
  const opacity = Math.round((clamped / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${accentColor}${opacity}`
}

function getTextColor(gapScore: number): string {
  return gapScore > 55 ? 'text-white' : 'text-white/80'
}

function getCriticalityBadge(criticality: HeatmapSkill['criticality']): string | null {
  switch (criticality) {
    case 'critical':
      return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'high':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'medium':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'low':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    default:
      return null
  }
}

export default function SectorHeatmap({ skills, accentColor }: SectorHeatmapProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, HeatmapSkill[]>()
    for (const skill of skills) {
      const sector = skill.sector || 'Other'
      if (!map.has(sector)) map.set(sector, [])
      map.get(sector)!.push(skill)
    }
    // Sort sectors by average gap_score descending
    return Array.from(map.entries())
      .map(([sector, items]) => ({
        sector,
        skills: items.sort((a, b) => b.gap_score - a.gap_score),
        avgGap: items.reduce((sum, s) => sum + s.gap_score, 0) / items.length,
      }))
      .sort((a, b) => b.avgGap - a.avgGap)
  }, [skills])

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No skill data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Scale legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Low gap</span>
        <div className="flex-1 mx-3 h-2 rounded-full overflow-hidden flex">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: getIntensityColor((i + 1) * 10, accentColor),
              }}
            />
          ))}
        </div>
        <span>High gap</span>
      </div>

      {/* Sector rows */}
      {grouped.map(({ sector, skills: sectorSkills }) => (
        <div key={sector}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {sector}
            </h4>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-mono">
              avg {Math.round(sectorSkills.reduce((s, sk) => s + sk.gap_score, 0) / sectorSkills.length)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {sectorSkills.map((skill) => {
              const badgeClass = getCriticalityBadge(skill.criticality)
              return (
                <div
                  key={`${sector}-${skill.name}`}
                  className="relative rounded-md px-3 py-2.5 group cursor-default transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: getIntensityColor(skill.gap_score, accentColor) }}
                >
                  <p className={`text-xs font-medium leading-tight truncate ${getTextColor(skill.gap_score)}`}>
                    {skill.name}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[10px] font-mono ${getTextColor(skill.gap_score)} opacity-70`}>
                      {skill.gap_score}
                    </span>
                    {badgeClass && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badgeClass}`}>
                        {skill.criticality}
                      </span>
                    )}
                  </div>

                  {/* Tooltip on hover */}
                  <div
                    className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-xl border border-white/10 text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: '#0A1628' }}
                  >
                    <p className="text-white font-medium">{skill.name}</p>
                    <p className="text-slate-400 mt-0.5">
                      Gap Score: <span className="text-white">{skill.gap_score}/100</span>
                    </p>
                    {skill.criticality && (
                      <p className="text-slate-400">
                        Criticality: <span className="text-white capitalize">{skill.criticality}</span>
                      </p>
                    )}
                    <p className="text-slate-400">
                      Sector: <span className="text-white">{skill.sector}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
