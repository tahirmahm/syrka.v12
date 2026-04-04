'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const BenchmarkRadarChart = dynamic(() => import('@/components/charts/BenchmarkRadarChart'), { ssr: false })
const IndicatorHeatmapChart = dynamic(() => import('@/components/charts/IndicatorHeatmapChart'), { ssr: false })

interface BenchmarkData {
  country: {
    code: string
    name: string
    indicators: Record<string, { year: number; value: number }[]>
  }
  peers: {
    code: string
    name: string
    indicators: Record<string, { year: number; value: number }[]>
  }[]
  peerAverage: Record<string, number>
  latestCountryValues: Record<string, number>
}

interface InternationalBenchmarkingProps {
  country: string
  accentColor: string
}

const INDICATOR_LABELS: Record<string, string> = {
  'SL.UEM.TOTL.ZS': 'Unemployment Rate %',
  'SE.XPD.TOTL.GD.ZS': 'Education Expenditure % GDP',
  'GB.XPD.RSDV.GD.ZS': 'R&D Expenditure % GDP',
  'SL.TLF.CACT.ZS': 'Labor Force Participation %',
  'NY.GDP.PCAP.PP.CD': 'GDP per Capita (PPP)',
}

const COUNTRY_NAMES: Record<string, string> = {
  MT: 'Malta', SA: 'Saudi Arabia', CY: 'Cyprus', EE: 'Estonia',
  SI: 'Slovenia', LU: 'Luxembourg', AE: 'UAE', QA: 'Qatar',
  BH: 'Bahrain', KW: 'Kuwait',
}

function normalizeValue(value: number, indicator: string): number {
  const ranges: Record<string, [number, number]> = {
    'SL.UEM.TOTL.ZS': [0, 30],
    'SE.XPD.TOTL.GD.ZS': [0, 10],
    'GB.XPD.RSDV.GD.ZS': [0, 5],
    'SL.TLF.CACT.ZS': [0, 100],
    'NY.GDP.PCAP.PP.CD': [0, 120000],
  }
  const [min, max] = ranges[indicator] || [0, 100]
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

export default function InternationalBenchmarking({ country, accentColor }: InternationalBenchmarkingProps) {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndicator, setSelectedIndicator] = useState('SL.UEM.TOTL.ZS')

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/benchmark/${country}`)
      if (!res.ok) throw new Error('Failed to fetch benchmark data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benchmarking data')
    } finally {
      setLoading(false)
    }
  }, [country])

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

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628]">International Benchmarking</h3>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
      </div>
    )
  }

  if (!data || Object.keys(data.latestCountryValues || {}).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628]">International Benchmarking</h3>
        <p className="text-sm text-slate-500 mt-2">
          No international statistics data yet. The Vercel Cron jobs will populate data from World Bank, ILO, OECD, UNESCO, and WEF automatically on a weekly schedule. You can also trigger them manually via the API.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-3">
          {['World Bank', 'ILO', 'OECD', 'UNESCO', 'WEF'].map(source => (
            <div key={source} className="text-center py-3 rounded-lg border border-dashed border-[#E2E5EB]">
              <p className="text-xs text-[#8B95A8]">{source}</p>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting data</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const radarCountryValues: Record<string, number> = {}
  const radarPeerAverage: Record<string, number> = {}

  for (const [indicator, label] of Object.entries(INDICATOR_LABELS)) {
    const countryVal = data.latestCountryValues[indicator]
    const peerVal = data.peerAverage[indicator]
    if (countryVal !== undefined) radarCountryValues[label] = normalizeValue(countryVal, indicator)
    if (peerVal !== undefined) radarPeerAverage[label] = normalizeValue(peerVal, indicator)
  }

  const heatmapData: Array<{ country: string; year: number; value: number }> = []
  const allCountries = [data.country, ...data.peers]
  for (const c of allCountries) {
    const indicatorData = c.indicators[selectedIndicator] || []
    for (const d of indicatorData) {
      heatmapData.push({
        country: COUNTRY_NAMES[c.code] || c.code,
        year: d.year,
        value: d.value,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg text-[#0A1628]">International Benchmarking</h3>
            <p className="text-sm text-[#5A6478] mt-1">
              {data.country.name} vs peer group ({data.peers.map(p => COUNTRY_NAMES[p.code] || p.code).join(', ')})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
              {data.country.name}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              Peer Average
            </span>
          </div>
        </div>

        <div className="h-[380px]">
          <BenchmarkRadarChart
            country={data.country.name}
            countryCode={data.country.code}
            countryValues={radarCountryValues}
            peerAverage={radarPeerAverage}
            accentColor={accentColor}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg text-[#0A1628]">Indicator Comparison Over Time</h3>
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            className="text-sm border border-[#E2E5EB] rounded-lg px-3 py-1.5 text-[#0A1628] bg-white"
          >
            {Object.entries(INDICATOR_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <div className="h-[300px]">
          <IndicatorHeatmapChart
            data={heatmapData}
            indicatorName={INDICATOR_LABELS[selectedIndicator]}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Key metrics comparison table */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-4">Latest Indicators</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E5EB]">
                <th className="text-left py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">Indicator</th>
                <th className="text-right py-2 px-3 text-xs uppercase tracking-wider font-medium" style={{ color: accentColor }}>
                  {data.country.name}
                </th>
                <th className="text-right py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">Peer Avg</th>
                <th className="text-right py-2 px-3 text-[#8B95A8] font-medium text-xs uppercase tracking-wider">Gap</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(INDICATOR_LABELS).map(([code, label]) => {
                const cv = data.latestCountryValues[code]
                const pv = data.peerAverage[code]
                const gap = cv !== undefined && pv !== undefined ? cv - pv : null
                return (
                  <tr key={code} className="border-b border-[#E2E5EB]/50 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-[#0A1628]">{label}</td>
                    <td className="py-2.5 px-3 text-right font-mono" style={{ color: accentColor }}>
                      {cv !== undefined ? cv.toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#5A6478]">
                      {pv !== undefined ? pv.toFixed(1) : '—'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${gap !== null && gap >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {gap !== null ? `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}` : '—'}
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
