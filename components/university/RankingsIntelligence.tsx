'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface RankingRecord {
  institution_name: string
  ranking_system: string
  year: number
  overall_rank: string
  overall_score: number | null
  ar_score: number | null
  er_score: number | null
  fsr_score: number | null
  cpf_score: number | null
  ifr_score: number | null
  isr_score: number | null
  isd_score: number | null
  irn_score: number | null
  eo_score: number | null
  sus_score: number | null
  country: string | null
}

interface RankingsIntelligenceProps {
  institutionName: string
  accentColor: string
  country: string
}

function parseRank(rank: string): number {
  if (!rank) return 9999
  const cleaned = rank.replace('=', '').replace('+', '')
  const match = cleaned.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 9999
}

const PILLAR_LABELS: Record<string, string> = {
  ar_score: 'Academic Reputation',
  er_score: 'Employer Reputation',
  fsr_score: 'Faculty/Student Ratio',
  cpf_score: 'Citations per Faculty',
  ifr_score: 'International Faculty',
  isr_score: 'International Students',
  isd_score: 'Intl. Research Network',
  irn_score: 'Intl. Research Network',
  eo_score: 'Employment Outcomes',
  sus_score: 'Sustainability',
}

export default function RankingsIntelligence({ institutionName, accentColor, country }: RankingsIntelligenceProps) {
  const [rankings, setRankings] = useState<RankingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/rankings/${encodeURIComponent(institutionName)}`)
      if (!res.ok) throw new Error('Failed to fetch rankings')
      const json = await res.json()
      setRankings(json.rankings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }, [institutionName])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || rankings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628]">Rankings Intelligence</h3>
        <p className="text-sm text-slate-500 mt-2">
          {error || `No QS/THE ranking data found for ${institutionName}. Use the seed endpoint to import rankings data.`}
        </p>
      </div>
    )
  }

  const sortedByYear = [...rankings].sort((a, b) => a.year - b.year)
  const latestYear = sortedByYear[sortedByYear.length - 1]
  const years = Array.from(new Set(sortedByYear.map(r => r.year))).sort()

  // Panel 1: Rank trajectory
  const rankTrajectoryOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#0A1628',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
        const p = params[0]
        return `<div style="font-family:monospace">${p.name}<br/><span style="color:${accentColor}">Rank: ${p.value}</span></div>`
      },
    },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: years.map(String),
      axisLine: { lineStyle: { color: '#E2E5EB' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      inverse: true,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    series: [{
      type: 'line',
      data: years.map(y => {
        const rec = sortedByYear.find(r => r.year === y)
        return rec ? parseRank(rec.overall_rank) : null
      }),
      smooth: true,
      lineStyle: { color: accentColor, width: 3 },
      itemStyle: { color: accentColor },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${accentColor}30` },
            { offset: 1, color: `${accentColor}05` },
          ],
        },
      },
      symbol: 'circle',
      symbolSize: 8,
    }],
  }

  // Panel 2: Pillar breakdown radar for latest year
  const pillars = ['ar_score', 'er_score', 'fsr_score', 'cpf_score', 'ifr_score', 'isr_score']
  const pillarRadarOption = {
    tooltip: {
      backgroundColor: '#0A1628',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    radar: {
      indicator: pillars.map(p => ({
        name: PILLAR_LABELS[p] || p,
        max: 100,
      })),
      shape: 'polygon' as const,
      splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9'] } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisName: { color: '#64748B', fontSize: 10 },
    },
    series: [{
      type: 'radar',
      data: [{
        value: pillars.map(p => {
          const key = p as keyof RankingRecord
          const val = latestYear[key]
          return typeof val === 'number' ? val : 0
        }),
        name: `${latestYear.year}`,
        lineStyle: { color: accentColor, width: 2 },
        areaStyle: { color: `${accentColor}30` },
        itemStyle: { color: accentColor },
      },
      ...(sortedByYear.length > 1 ? [{
        value: pillars.map(p => {
          const key = p as keyof RankingRecord
          const prev = sortedByYear[sortedByYear.length - 2]
          const val = prev[key]
          return typeof val === 'number' ? val : 0
        }),
        name: `${sortedByYear[sortedByYear.length - 2].year}`,
        lineStyle: { color: '#94A3B8', width: 1, type: 'dashed' as const },
        areaStyle: { color: 'rgba(148,163,184,0.1)' },
        itemStyle: { color: '#94A3B8' },
      }] : []),
      ],
    }],
  }

  // Panel 3: ISR trajectory highlight (for Malta)
  const isrData = sortedByYear.filter(r => r.isr_score !== null)
  const isrTrajectoryOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#0A1628',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: isrData.map(r => String(r.year)),
      axisLine: { lineStyle: { color: '#E2E5EB' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: isrData.map(r => ({
        value: r.isr_score,
        itemStyle: { color: r.isr_score && r.isr_score > 30 ? accentColor : '#94A3B8' },
      })),
      barWidth: '40%',
      label: {
        show: true,
        position: 'top' as const,
        color: '#64748B',
        fontSize: 11,
        formatter: (params: { value: number }) => params.value?.toFixed(1),
      },
    }],
  }

  // Compute deltas
  const prevYear = sortedByYear.length > 1 ? sortedByYear[sortedByYear.length - 2] : null
  const rankDelta = prevYear
    ? parseRank(prevYear.overall_rank) - parseRank(latestYear.overall_rank)
    : 0

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">QS Rank {latestYear.year}</p>
          <p className="font-display text-2xl mt-1" style={{ color: accentColor }}>
            {latestYear.overall_rank}
          </p>
          {rankDelta !== 0 && (
            <p className={`text-xs mt-1 ${rankDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {rankDelta > 0 ? `+${rankDelta} places` : `${rankDelta} places`}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Overall Score</p>
          <p className="font-display text-2xl mt-1">{latestYear.overall_score?.toFixed(1) || '—'}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Academic Rep.</p>
          <p className="font-display text-2xl mt-1">{latestYear.ar_score?.toFixed(1) || '—'}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Intl. Students</p>
          <p className="font-display text-2xl mt-1">
            {latestYear.isr_score?.toFixed(1) || '—'}
          </p>
          {country === 'malta' && latestYear.isr_score && latestYear.isr_score > 40 && (
            <p className="text-xs text-emerald-600 mt-1">Breakthrough trajectory</p>
          )}
        </div>
      </div>

      {/* Panel 1: Rank Trajectory */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-4">Rank Trajectory</h3>
        <div className="h-[280px]">
          <ReactECharts option={rankTrajectoryOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Panel 2: Pillar Breakdown Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
          <h3 className="font-display text-lg text-[#0A1628] mb-1">Pillar Breakdown</h3>
          <p className="text-xs text-[#8B95A8] mb-4">
            {latestYear.year} vs {prevYear?.year || 'N/A'}
          </p>
          <div className="h-[320px]">
            <ReactECharts option={pillarRadarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Panel 3: ISR Trajectory (highlight for Malta) */}
        <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
          <h3 className="font-display text-lg text-[#0A1628] mb-1">
            International Students Ratio
          </h3>
          <p className="text-xs text-[#8B95A8] mb-4">
            ISR pillar score across ranking years
            {country === 'malta' && ' — University of Malta reference case'}
          </p>
          <div className="h-[320px]">
            <ReactECharts option={isrTrajectoryOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Pillar scores table */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-4">Detailed Pillar Scores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E5EB]">
                <th className="text-left py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">Pillar</th>
                {years.map(y => (
                  <th key={y} className="text-right py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">{y}</th>
                ))}
                <th className="text-right py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                const values = years.map(y => {
                  const rec = sortedByYear.find(r => r.year === y)
                  const val = rec ? (rec[key as keyof RankingRecord] as number | null) : null
                  return val
                })
                const first = values.find(v => v !== null)
                const last = [...values].reverse().find(v => v !== null)
                const delta = first !== null && first !== undefined && last !== null && last !== undefined ? last - first : null

                return (
                  <tr key={key} className="border-b border-[#E2E5EB]/50 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-[#0A1628]">{label}</td>
                    {values.map((v, i) => (
                      <td key={years[i]} className="py-2.5 px-3 text-right font-mono text-[#5A6478]">
                        {v !== null && v !== undefined ? v.toFixed(1) : '—'}
                      </td>
                    ))}
                    <td className={`py-2.5 px-3 text-right font-mono ${delta !== null && delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
