'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  the_teaching: number | null
  the_research_quality: number | null
  the_industry: number | null
  the_international_outlook: number | null
  country: string | null
}

interface RankingsIntelligenceProps {
  institutionName: string
  accentColor: string
  country: string
}

function parseRank(rank: string): number {
  if (!rank || rank === 'Reporter') return 9999
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
}

const PRESCRIPTION_INDICATOR_MAP: Record<string, {
  qs: string[]
  the: string[]
  rationale: string
}> = {
  curriculum_reform: {
    qs: ['ar_score', 'er_score'],
    the: ['the_teaching', 'the_research_quality'],
    rationale: 'Curriculum reform historically improves Academic and Employer Reputation scores within 3-5 years',
  },
  industry_partnership: {
    qs: ['er_score'],
    the: ['the_industry'],
    rationale: 'Industry partnerships directly drive Employer Reputation and Industry Income scores',
  },
  international_programme: {
    qs: ['isr_score', 'ifr_score'],
    the: ['the_international_outlook'],
    rationale: 'International programmes improve International Student and Faculty ratios within 2-3 years',
  },
  research_investment: {
    qs: ['cpf_score', 'irn_score'],
    the: ['the_research_quality'],
    rationale: 'Research investment improves Citations per Faculty and Research Network scores over 5+ years',
  },
}

export default function RankingsIntelligence({ institutionName, accentColor, country }: RankingsIntelligenceProps) {
  const [rankings, setRankings] = useState<RankingRecord[]>([])
  const [peers, setPeers] = useState<RankingRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/rankings/${encodeURIComponent(institutionName)}`)
      if (!res.ok) {
        setRankings([])
        setPeers([])
        return
      }
      const json = await res.json()
      setRankings(json.rankings || [])
      setPeers(json.peers || [])
    } catch {
      setRankings([])
    } finally {
      setLoading(false)
    }
  }, [institutionName])

  useEffect(() => { loadData() }, [loadData])

  // Check for KAUST
  const isKaust = institutionName.toLowerCase().includes('kaust') ||
    institutionName.toLowerCase().includes('king abdullah university')
  const isReporter = rankings.some(r => r.overall_rank === 'Reporter')

  // QS rankings only
  const qsRankings = useMemo(() =>
    [...rankings].filter(r => r.ranking_system === 'QS').sort((a, b) => a.year - b.year),
  [rankings])

  const theRankings = useMemo(() =>
    [...rankings].filter(r => r.ranking_system === 'THE').sort((a, b) => a.year - b.year),
  [rankings])

  // Peer medians (latest year, QS only)
  const peerMedians = useMemo(() => {
    const qsPeers = peers.filter(p => p.ranking_system === 'QS')
    if (qsPeers.length === 0) return null
    const latestYear = Math.max(...qsPeers.map(p => p.year))
    const latestPeers = qsPeers.filter(p => p.year === latestYear)
    const medians: Record<string, number> = {}
    for (const key of Object.keys(PILLAR_LABELS)) {
      const values = latestPeers
        .map(p => p[key as keyof RankingRecord] as number | null)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)
      if (values.length > 0) {
        medians[key] = values[Math.floor(values.length / 2)]
      }
    }
    return medians
  }, [peers])

  if (loading) {
    return (
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  // KAUST special case
  if (isKaust || isReporter) {
    return (
      <div className="space-y-6">
        <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
          <h3 className="font-display text-lg text-[#E6EDF3] mb-3">Rankings Intelligence</h3>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-sm font-medium text-blue-800 mb-2">Rankings data pending</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              KAUST participates in THE&apos;s data collection but has not yet met the threshold for a
              ranked position. This is common for young research-intensive institutions — KAUST was
              founded in 2009. Curriculum intelligence above is based on ESCO skill mapping, not
              ranking scores. KAUST is expected to appear in future rankings as its research output scales.
            </p>
          </div>
        </div>
        <CompetitiveBadge />
      </div>
    )
  }

  if (qsRankings.length === 0 && theRankings.length === 0) {
    return (
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3]">Rankings Intelligence</h3>
        <p className="text-sm text-slate-500 mt-2">
          No QS/THE ranking data found for {institutionName}. Rankings data will appear once seeded.
        </p>
      </div>
    )
  }

  const latestQS = qsRankings[qsRankings.length - 1]
  const years = Array.from(new Set(qsRankings.map(r => r.year))).sort()
  const prevYear = qsRankings.length > 1 ? qsRankings[qsRankings.length - 2] : null
  const rankDelta = prevYear ? parseRank(prevYear.overall_rank) - parseRank(latestQS.overall_rank) : 0

  // Pillar radar with peer median overlay
  const pillars = Object.keys(PILLAR_LABELS)
  const radarOption = {
    tooltip: { backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#E6EDF3', fontSize: 12 } },
    legend: { data: [String(latestQS.year), 'Peer Median'], bottom: 0, textStyle: { fontSize: 11, color: '#64748B' } },
    radar: {
      indicator: pillars.map(p => ({ name: PILLAR_LABELS[p], max: 100 })),
      shape: 'polygon' as const,
      splitArea: { areaStyle: { color: ['#0D1117', '#f1f5f9'] } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisName: { color: '#64748B', fontSize: 10 },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: pillars.map(p => {
            const val = latestQS[p as keyof RankingRecord]
            return typeof val === 'number' ? val : 0
          }),
          name: String(latestQS.year),
          lineStyle: { color: accentColor, width: 2 },
          areaStyle: { color: `${accentColor}30` },
          itemStyle: { color: accentColor },
        },
        ...(peerMedians ? [{
          value: pillars.map(p => peerMedians[p] ?? 0),
          name: 'Peer Median',
          lineStyle: { color: '#94A3B8', width: 1.5, type: 'dashed' as const },
          areaStyle: { color: 'rgba(148,163,184,0.08)' },
          itemStyle: { color: '#94A3B8' },
        }] : []),
      ],
    }],
  }

  // Rank trajectory with peer lines
  const peerLatest = peers.filter(p => p.ranking_system === 'QS')
  const peerNames = Array.from(new Set(peerLatest.map(p => p.institution_name)))
  const trajectoryOption = {
    tooltip: { trigger: 'axis' as const, backgroundColor: '#161B22', textStyle: { color: '#E6EDF3', fontSize: 12 } },
    legend: { data: [institutionName.split(' ').slice(0, 3).join(' '), ...peerNames.map(n => n.split(' ').slice(0, 3).join(' '))], bottom: 0, textStyle: { fontSize: 10, color: '#64748B' } },
    grid: { left: 60, right: 20, top: 20, bottom: 60 },
    xAxis: { type: 'category' as const, data: years.map(String), axisLabel: { color: '#64748B', fontSize: 11 } },
    yAxis: { type: 'value' as const, inverse: true, axisLabel: { color: '#64748B', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      {
        name: institutionName.split(' ').slice(0, 3).join(' '),
        type: 'line',
        data: years.map(y => { const r = qsRankings.find(r => r.year === y); return r ? parseRank(r.overall_rank) : null }),
        smooth: true, lineStyle: { color: accentColor, width: 3 }, itemStyle: { color: accentColor },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${accentColor}30` }, { offset: 1, color: `${accentColor}05` }] } },
      },
      ...peerNames.map((name, i) => {
        const colors = ['#94A3B8', '#64748B', '#475569', '#334155', '#1e293b']
        const peerData = peerLatest.filter(p => p.institution_name === name)
        return {
          name: name.split(' ').slice(0, 3).join(' '),
          type: 'line' as const,
          data: years.map(y => { const r = peerData.find(r => r.year === y); return r ? parseRank(r.overall_rank) : null }),
          lineStyle: { color: colors[i % colors.length], width: 1.5, type: 'dashed' as const },
          itemStyle: { color: colors[i % colors.length] },
          symbol: 'circle' as const, symbolSize: 5,
        }
      }),
    ],
  }

  // ISR trajectory
  const isrData = qsRankings.filter(r => r.isr_score !== null)
  const isrAnnotation = country === 'malta' && isrData.length >= 2
    ? `International Students score: ${isrData.map(d => d.isr_score?.toFixed(1)).join(' → ')} — fastest improving indicator`
    : null

  const isrOption = {
    tooltip: { trigger: 'axis' as const, backgroundColor: '#161B22', textStyle: { color: '#E6EDF3', fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: isrData.map(r => String(r.year)), axisLabel: { color: '#64748B', fontSize: 11 } },
    yAxis: { type: 'value' as const, min: 0, max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
    series: [{ type: 'bar', data: isrData.map(r => ({ value: r.isr_score, itemStyle: { color: r.isr_score && r.isr_score > 30 ? accentColor : '#94A3B8' } })), barWidth: '40%', label: { show: true, position: 'top' as const, color: '#64748B', fontSize: 11, formatter: (p: { value: number }) => p.value?.toFixed(1) } }],
  }

  // Impact projector cards
  const impactCards = Object.entries(PRESCRIPTION_INDICATOR_MAP).map(([type, config]) => {
    const qsIndicators = config.qs.map(ind => {
      const current = latestQS[ind as keyof RankingRecord] as number | null
      const peerMedian = peerMedians?.[ind] ?? null
      const improvement = peerMedian && current ? (peerMedian - current) * 0.4 : 3
      return {
        label: PILLAR_LABELS[ind] || ind,
        current,
        projectedLow: current ? Math.round((current + improvement) * 10) / 10 : null,
        projectedHigh: current ? Math.round((current + improvement * 1.8) * 10) / 10 : null,
      }
    })
    return { type, ...config, qsIndicators }
  })

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-5">
          <p className="text-[#8B949E] text-xs uppercase tracking-wider">QS Rank {latestQS.year}</p>
          <p className="font-display text-2xl mt-1" style={{ color: accentColor }}>{latestQS.overall_rank}</p>
          {rankDelta !== 0 && <p className={`text-xs mt-1 ${rankDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{rankDelta > 0 ? `+${rankDelta} places` : `${rankDelta} places`}</p>}
        </div>
        <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-5">
          <p className="text-[#8B949E] text-xs uppercase tracking-wider">Overall Score</p>
          <p className="font-display text-2xl mt-1">{latestQS.overall_score?.toFixed(1) || '—'}</p>
        </div>
        <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-5">
          <p className="text-[#8B949E] text-xs uppercase tracking-wider">Academic Rep.</p>
          <p className="font-display text-2xl mt-1">{latestQS.ar_score?.toFixed(1) || '—'}</p>
        </div>
        <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-5">
          <p className="text-[#8B949E] text-xs uppercase tracking-wider">Intl. Students</p>
          <p className="font-display text-2xl mt-1">{latestQS.isr_score?.toFixed(1) || '—'}</p>
          {country === 'malta' && latestQS.isr_score && latestQS.isr_score > 40 && <p className="text-xs text-emerald-600 mt-1">Breakthrough trajectory</p>}
        </div>
      </div>

      {/* Indicator delta cards */}
      {peerMedians && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {pillars.map(p => {
            const val = latestQS[p as keyof RankingRecord] as number | null
            const median = peerMedians[p]
            const delta = val !== null && median !== undefined ? val - median : null
            return (
              <div key={p} className="bg-[#0D1117] rounded-lg border border-[#21262D] p-3 text-center">
                <p className="text-[9px] text-[#8B949E] uppercase tracking-wider">{PILLAR_LABELS[p]}</p>
                <p className="font-display text-lg mt-0.5">{val?.toFixed(1) ?? '—'}</p>
                {delta !== null && (
                  <p className={`text-[10px] font-medium mt-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs peers
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Radar + Trajectory */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
          <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Current Standing</h3>
          <p className="text-xs text-[#8B949E] mb-4">QS indicator radar — institution vs peer median</p>
          <div className="h-[340px]">
            <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
        <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
          <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Ranking Trajectory</h3>
          <p className="text-xs text-[#8B949E] mb-4">Rank over time (lower = better)</p>
          <div className="h-[340px]">
            <ReactECharts option={trajectoryOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ISR trajectory */}
      {isrData.length > 0 && (
        <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
          <h3 className="font-display text-lg text-[#E6EDF3] mb-1">International Students Ratio</h3>
          <p className="text-xs text-[#8B949E] mb-4">ISR pillar score across ranking years</p>
          <div className="h-[240px]">
            <ReactECharts option={isrOption} style={{ height: '100%', width: '100%' }} />
          </div>
          {isrAnnotation && (
            <p className="text-xs text-emerald-600 mt-3 font-medium">{isrAnnotation}</p>
          )}
        </div>
      )}

      {/* Ranking Impact Projector */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-1">Ranking Impact Projector</h3>
        <p className="text-xs text-[#8B949E] mb-4">Projected QS indicator impact from policy interventions</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {impactCards.map(card => (
            <div key={card.type} className="rounded-lg border border-slate-100 p-4">
              <p className="text-sm font-medium text-slate-800 capitalize mb-2">{card.type.replace(/_/g, ' ')}</p>
              {card.qsIndicators.map(ind => (
                <div key={ind.label} className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>{ind.label}</span>
                  <span className="font-mono">
                    {ind.current?.toFixed(1) ?? '—'} → {ind.projectedLow?.toFixed(1)}–{ind.projectedHigh?.toFixed(1)}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 mt-2 italic">{card.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar scores table */}
      <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
        <h3 className="font-display text-lg text-[#E6EDF3] mb-4">Detailed Pillar Scores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#21262D]">
                <th className="text-left py-2 px-3 text-[#8B949E] font-medium text-xs uppercase tracking-wider">Pillar</th>
                {years.map(y => <th key={y} className="text-right py-2 px-3 text-[#8B949E] font-medium text-xs uppercase tracking-wider">{y}</th>)}
                <th className="text-right py-2 px-3 text-[#8B949E] font-medium text-xs uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                const values = years.map(y => {
                  const rec = qsRankings.find(r => r.year === y)
                  return rec ? (rec[key as keyof RankingRecord] as number | null) : null
                })
                const first = values.find(v => v !== null)
                const last = [...values].reverse().find(v => v !== null)
                const delta = first != null && last != null ? last - first : null
                return (
                  <tr key={key} className="border-b border-[#21262D]/50 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-[#E6EDF3]">{label}</td>
                    {values.map((v, i) => <td key={years[i]} className="py-2.5 px-3 text-right font-mono text-[#C9D1D9]">{v != null ? v.toFixed(1) : '—'}</td>)}
                    <td className={`py-2.5 px-3 text-right font-mono ${delta != null && delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* THE Rankings summary */}
      {theRankings.length > 0 && (
        <div className="bg-[#0D1117] rounded-xl border border-[#21262D] p-6">
          <h3 className="font-display text-lg text-[#E6EDF3] mb-4">THE World University Rankings</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {theRankings.slice(-1).map(r => (
              <>
                <div key={`${r.year}-rank`} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[9px] text-[#8B949E] uppercase">THE Rank {r.year}</p>
                  <p className="font-display text-xl mt-1" style={{ color: accentColor }}>{r.overall_rank}</p>
                </div>
                <div key={`${r.year}-teach`} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[9px] text-[#8B949E] uppercase">Teaching</p>
                  <p className="font-display text-xl mt-1">{r.the_teaching?.toFixed(1) ?? '—'}</p>
                </div>
                <div key={`${r.year}-research`} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[9px] text-[#8B949E] uppercase">Research</p>
                  <p className="font-display text-xl mt-1">{r.the_research_quality?.toFixed(1) ?? '—'}</p>
                </div>
                <div key={`${r.year}-industry`} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[9px] text-[#8B949E] uppercase">Industry</p>
                  <p className="font-display text-xl mt-1">{r.the_industry?.toFixed(1) ?? '—'}</p>
                </div>
                <div key={`${r.year}-intl`} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[9px] text-[#8B949E] uppercase">Intl. Outlook</p>
                  <p className="font-display text-xl mt-1">{r.the_international_outlook?.toFixed(1) ?? '—'}</p>
                </div>
              </>
            ))}
          </div>
        </div>
      )}

      {/* Methodology link */}
      <div className="text-center">
        <a
          href="https://tahirmahmoodkhan-syrka-methodology.hf.space"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          How is the curriculum score calculated? View methodology →
        </a>
      </div>

      <CompetitiveBadge />
    </div>
  )
}

function CompetitiveBadge() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
      <p className="text-xs font-medium text-slate-700 mb-1.5">No conflict of interest</p>
      <p className="text-xs text-slate-500 leading-relaxed">
        Syrka does not sell consulting services to the universities it benchmarks.
        Unlike QS&apos;s own advisory arm — flagged by the UN University in 2023 —
        our recommendations are grounded in OECD and ESCO data, not ranking methodology we control.
      </p>
    </div>
  )
}
