'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  VisionAlignmentDotPlot,
  SalaryVsSkillGapScatter,
  SkillTrajectoryLine,
  StudentProfileForm,
} from './ObservablePlotCharts'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface Career {
  title: string
  sector: string
  vision_priority: 'high' | 'medium'
  gap_years: number
  median_salary_usd: number
  open_roles: number
}

interface StudentObservableSectionProps {
  country: string
  accentColor: string
}

export default function StudentObservableSection({
  country,
  accentColor,
}: StudentObservableSectionProps) {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/students/careers/${country}`)
      .then(r => r.json())
      .then(data => setCareers(data.careers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [country])

  const handleProfile = useCallback((_study: string, sector: string) => {
    setSelectedSector(sector)
    // Save profile
    fetch('/api/students/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, sector_interest: sector }),
    }).catch(() => {})
  }, [country])

  const filteredCareers = selectedSector
    ? careers.filter(c => c.sector === selectedSector || c.vision_priority === 'high')
    : careers

  // Sector demand heatmap data
  const sectors = Array.from(new Set(careers.map(c => c.sector)))
  const years = [2025, 2027, 2029, 2031, 2033, 2035]
  const heatmapData: [number, number, number][] = []
  sectors.forEach((sector, yi) => {
    years.forEach((year, xi) => {
      const sectorCareers = careers.filter(c => c.sector === sector)
      const baseRoles = sectorCareers.reduce((sum, c) => sum + c.open_roles, 0)
      const growth = sector === 'Technology' || sector === 'Digital' ? 1.12 : sector === 'Energy' || sector === 'Green' ? 1.08 : 1.03
      const demand = Math.round(baseRoles * Math.pow(growth, (year - 2025) / 2))
      heatmapData.push([xi, yi, demand])
    })
  })

  const maxDemand = Math.max(...heatmapData.map(d => d[2]))

  const heatmapOption = {
    tooltip: {
      position: 'top' as const,
      formatter: (p: { data: [number, number, number] }) =>
        `${sectors[p.data[1]]} (${years[p.data[0]]}): ${p.data[2].toLocaleString()} roles`,
    },
    grid: { left: 120, right: 20, top: 10, bottom: 40 },
    xAxis: { type: 'category' as const, data: years.map(String), axisLabel: { color: '#64748B', fontSize: 11 } },
    yAxis: { type: 'category' as const, data: sectors, axisLabel: { color: '#64748B', fontSize: 11 } },
    visualMap: {
      min: 0, max: maxDemand,
      calculable: true,
      orient: 'horizontal' as const,
      left: 'center', bottom: 0,
      inRange: { color: ['#0D1117', accentColor] },
      textStyle: { color: '#64748B', fontSize: 10 },
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
    }],
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[#161B22] rounded w-48" />
        <div className="h-64 bg-[#161B22] rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile form */}
      <StudentProfileForm
        country={country}
        accentColor={accentColor}
        onSubmit={handleProfile}
      />

      {selectedSector && (
        <p className="text-sm text-slate-500">
          Showing careers for <span className="font-medium text-slate-700">{selectedSector}</span> and all high-priority sectors.
        </p>
      )}

      {/* Chart 1 — Dot Plot */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Vision Alignment</h3>
        <p className="text-sm text-[#C9D1D9] mb-4">
          Years of study needed to close the skill gap for each Vision-aligned career
        </p>
        <VisionAlignmentDotPlot careers={filteredCareers} accentColor={accentColor} />
      </div>

      {/* Chart 2 — Salary Scatter */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Salary vs Skill Gap</h3>
        <p className="text-sm text-[#C9D1D9] mb-4">
          Estimated years to close skill gap vs median salary. Bubble size = open roles.
        </p>
        <SalaryVsSkillGapScatter careers={filteredCareers} accentColor={accentColor} />
      </div>

      {/* Chart 3 — Trajectory */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Skill Development Trajectory</h3>
        <p className="text-sm text-[#C9D1D9] mb-4">
          Projected skill score: current education path vs Vision-aligned courses over 10 years
        </p>
        <SkillTrajectoryLine accentColor={accentColor} />
      </div>

      {/* Chart 4 — Sector Demand Heatmap (ECharts) */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Sector Demand Forecast</h3>
        <p className="text-sm text-[#C9D1D9] mb-4">
          Projected demand by Vision-priority sector, 2025-2035
        </p>
        <div className="h-[300px]">
          <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
