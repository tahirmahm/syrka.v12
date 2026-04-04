'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface ScenarioDataPoint {
  year: number
  before: number
  after: number
}

interface ScenarioComparisonChartProps {
  data: ScenarioDataPoint[]
  accentColor: string
}

function formatYAxisLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

export default function ScenarioComparisonChart({
  data,
  accentColor,
}: ScenarioComparisonChartProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data])

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: {
        top: 8,
        right: 16,
        bottom: 40,
        left: 52,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A1628',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        formatter(params: Array<{ seriesName: string; value: number; color: string; axisValue: string }>) {
          if (!Array.isArray(params) || params.length === 0) return ''
          const year = params[0].axisValue
          const before = params.find((p) => p.seriesName === 'Before Intervention')
          const after = params.find((p) => p.seriesName === 'After Intervention')
          const reduction =
            before && after && before.value > 0
              ? Math.round(((before.value - after.value) / before.value) * 100)
              : null

          let html = `<div style="font-family:monospace;color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:6px">${year}</div>`
          for (const p of params) {
            html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
              <span style="width:8px;height:8px;border-radius:2px;background:${p.color};flex-shrink:0"></span>
              <span style="color:rgba(255,255,255,0.7);font-size:11px">${p.seriesName}:</span>
              <span style="color:#fff;font-weight:500;font-size:11px;margin-left:auto;padding-left:12px">${Number(p.value).toLocaleString()}</span>
            </div>`
          }
          if (reduction !== null) {
            html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)">
              <span style="color:#34D399;font-size:11px">${reduction}% gap reduction</span>
            </div>`
          }
          return html
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
      },
      xAxis: {
        type: 'category',
        data: sortedData.map((d) => d.year),
        axisLine: { lineStyle: { color: '#1E293B' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          formatter: formatYAxisLabel,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: 'rgba(148,163,184,0.08)', type: 'dashed' },
        },
      },
      series: [
        {
          name: 'Before Intervention',
          type: 'bar',
          data: sortedData.map((d) => d.before),
          itemStyle: {
            color: '#EF4444',
            opacity: 0.7,
            borderRadius: [3, 3, 0, 0],
          },
          barGap: '10%',
          barCategoryGap: '20%',
        },
        {
          name: 'After Intervention',
          type: 'bar',
          data: sortedData.map((d) => d.after),
          itemStyle: {
            color: accentColor,
            opacity: 0.85,
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
    }),
    [sortedData, accentColor]
  )

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
