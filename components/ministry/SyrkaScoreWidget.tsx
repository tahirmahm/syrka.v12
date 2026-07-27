'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface Dimension {
  name: string
  score: number | null
  weight: number
  available: boolean
  description: string
}

interface ScoreData {
  score: number
  grade: string
  dimensions: Dimension[]
  availableDimensions: number
}

interface SyrkaScoreWidgetProps {
  country: string
  accentColor: string
}

export default function SyrkaScoreWidget({ country, accentColor }: SyrkaScoreWidgetProps) {
  const [data, setData] = useState<ScoreData | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/syrka-score/${country}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [country])

  if (!data) return null

  const hasEnoughData = data.availableDimensions >= 3

  const chartOption = {
    grid: { top: 4, right: 8, bottom: 4, left: 110 },
    xAxis: {
      type: 'value' as const,
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category' as const,
      data: data.dimensions.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#8B949E' },
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: data.dimensions.map((d) => ({
          value: d.available ? d.score : 0,
          itemStyle: {
            color: d.available ? accentColor : '#21262D',
            borderRadius: [0, 3, 3, 0],
          },
        })),
        barWidth: 14,
        label: {
          show: true,
          position: 'right' as const,
          fontSize: 10,
          color: '#C9D1D9',
          formatter: (p: { dataIndex: number }) => {
            const dim = data.dimensions[p.dataIndex]
            return dim.available ? `${dim.score}` : 'Awaiting data'
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const dim = data.dimensions[params[0].dataIndex]
        return `<b>${dim.name}</b><br/>${dim.description}<br/>${dim.available ? `Score: ${dim.score}/100` : 'Data not yet available'}`
      },
    },
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-right cursor-pointer hover:opacity-80 transition-opacity"
      >
        <p className="text-[11px] uppercase tracking-wider text-[#8B949E] font-medium">Syrka Score</p>
        {hasEnoughData ? (
          <>
            <p className="font-display text-2xl mt-0.5" style={{ color: accentColor }}>
              {data.score} <span className="text-sm text-[#8B949E]">/ 100</span>
            </p>
            <p className="text-xs text-[#8B949E]">{data.grade}</p>
          </>
        ) : (
          <p className="text-xs text-[#8B949E] mt-1">
            Calculating — {data.availableDimensions}/5 sources connected
          </p>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#0D1117] rounded-lg border border-[#21262D] shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#E6EDF3]">Score Breakdown</h4>
            <button onClick={() => setExpanded(false)} className="text-xs text-[#8B949E] hover:text-[#C9D1D9]">
              Close
            </button>
          </div>
          <div style={{ height: 180 }}>
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} notMerge />
          </div>
          <p className="text-[10px] text-[#8B949E] mt-2">
            Weighted composite of {data.availableDimensions} available dimensions. Click each bar for details.
          </p>
        </div>
      )}
    </div>
  )
}
