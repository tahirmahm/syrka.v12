'use client'

import type { Employer, Skill } from '@/lib/types'

interface TalentPipelineHealthProps {
  employers: Employer[]
  skills: Skill[]
  accentColor: string
}

const DEMAND_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100 border-red-200', text: 'text-red-700' },
  high: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700' },
  medium: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700' },
  low: { bg: 'bg-[#161B22] border-[#21262D]', text: 'text-[#8B949E]' },
}

interface SectorAggregation {
  sectorName: string
  totalOpenRoles: number
  avgTimeToFill: number
  avgSatisfaction: number
  topSkills: { name: string; demandLevel: string }[]
  hasNationalShortage: boolean
  hasVisionPartner: boolean
}

function aggregateBySector(employers: Employer[], skills: Skill[]): SectorAggregation[] {
  const sectorMap = new Map<string, Employer[]>()

  for (const emp of employers) {
    const sectorName = emp.sectors?.name ?? 'Unclassified'
    const existing = sectorMap.get(sectorName) ?? []
    existing.push(emp)
    sectorMap.set(sectorName, existing)
  }

  const sectorSkillMap = new Map<string, Skill[]>()
  for (const skill of skills) {
    const sectorId = skill.sector_id
    const sector = employers.find((e) => e.sector_id === sectorId)?.sectors?.name ?? 'Unclassified'
    const existing = sectorSkillMap.get(sector) ?? []
    existing.push(skill)
    sectorSkillMap.set(sector, existing)
  }

  return Array.from(sectorMap.entries()).map(([sectorName, emps]) => {
    const openRoles = emps.reduce((sum, e) => sum + (e.open_roles ?? 0), 0)
    const fillDays = emps.filter((e) => e.avg_time_to_fill_days !== null)
    const avgFill =
      fillDays.length > 0
        ? fillDays.reduce((sum, e) => sum + (e.avg_time_to_fill_days ?? 0), 0) / fillDays.length
        : 0
    const satScores = emps.filter((e) => e.graduate_satisfaction_score !== null)
    const avgSat =
      satScores.length > 0
        ? satScores.reduce((sum, e) => sum + (e.graduate_satisfaction_score ?? 0), 0) /
          satScores.length
        : 0

    const sectorSkills = sectorSkillMap.get(sectorName) ?? []
    const criticalityOrder = ['critical', 'high', 'medium', 'low']
    const sorted = [...sectorSkills].sort((a, b) => {
      const aIdx = criticalityOrder.indexOf(a.criticality ?? 'low')
      const bIdx = criticalityOrder.indexOf(b.criticality ?? 'low')
      return aIdx - bIdx
    })
    const topSkills = sorted.slice(0, 3).map((s) => ({
      name: s.name,
      demandLevel: s.criticality ?? 'low',
    }))

    const hasNationalShortage = sectorSkills.some((s) => s.criticality === 'critical')
    const hasVisionPartner = emps.some((e) => e.is_vision_partner)

    return {
      sectorName,
      totalOpenRoles: openRoles,
      avgTimeToFill: Math.round(avgFill),
      avgSatisfaction: Math.round(avgSat * 10) / 10,
      topSkills,
      hasNationalShortage,
      hasVisionPartner,
    }
  })
}

export default function TalentPipelineHealth({
  employers,
  skills,
  accentColor,
}: TalentPipelineHealthProps) {
  const sectors = aggregateBySector(employers, skills)

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-slate-800 tracking-tight">
        Talent Pipeline Health
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sectors.map((sector) => (
          <div
            key={sector.sectorName}
            className="bg-[#0D1117] rounded-lg border border-slate-200 p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-medium text-slate-800">
                {sector.sectorName}
              </h4>
              {sector.hasVisionPartner && (
                <span
                  className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded border"
                  style={{
                    color: '#C9A84C',
                    borderColor: '#C9A84C40',
                    backgroundColor: '#C9A84C0A',
                  }}
                >
                  Vision Partner
                </span>
              )}
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: accentColor }}
                >
                  {sector.totalOpenRoles.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Open Roles</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-700 tabular-nums">
                  {sector.avgTimeToFill}
                  <span className="text-sm font-normal text-slate-400 ml-0.5">d</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Avg Time to Fill</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-700 tabular-nums">
                  {sector.avgSatisfaction}
                  <span className="text-sm font-normal text-slate-400 ml-0.5">/10</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Grad Satisfaction</p>
              </div>
            </div>

            {/* Skill demand signals */}
            {sector.topSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                  Top Skill Demands
                </p>
                <div className="space-y-1.5">
                  {sector.topSkills.map((skill) => {
                    const colors = DEMAND_COLORS[skill.demandLevel] ?? DEMAND_COLORS.low
                    return (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600 truncate mr-2">{skill.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-medium flex-shrink-0 ${colors.bg} ${colors.text}`}
                        >
                          {skill.demandLevel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* National shortage alert */}
            {sector.hasNationalShortage && (
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-50 border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                <p className="text-[11px] text-red-700 font-medium">
                  National shortage alert -- critical skill gap identified
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
