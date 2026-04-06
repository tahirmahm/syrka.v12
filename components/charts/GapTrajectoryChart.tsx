'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface TrajectoryDataPoint {
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

interface GapTrajectoryChartProps {
  data: TrajectoryDataPoint[]
  accentColor: string
  targetYear: number
}

function formatYAxisLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GapTrajectoryChart({ data, accentColor, targetYear }: GapTrajectoryChartProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data])

  const hasIntervention = sortedData.some(
    (d) => d.with_intervention !== null && d.with_intervention !== undefined
  )

  const historicalPoints = useMemo(
    () =>
      sortedData
        .filter((d) => d.data_type === 'historical' && d.current_trajectory !== null)
        .map((d) => [d.year, d.current_trajectory]),
    [sortedData]
  )

  const years = sortedData.map((d) => d.year)

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
        formatter(params: Array<{ seriesName: string; value: number | null; color: string }>) {
          if (!Array.isArray(params) || params.length === 0) return ''
          const axisTick = (params[0] as unknown as { axisValue: number }).axisValue
          let html = `<div style="font-family:monospace;color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:6px">${axisTick}</div>`
          for (const p of params) {
            if (p.seriesName === 'Historical Data') continue
            const val =
              p.value !== null && p.value !== undefined
                ? Number(p.value).toLocaleString()
                : '--'
            html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
              <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
              <span style="color:rgba(255,255,255,0.7);font-size:11px">${p.seriesName}:</span>
              <span style="color:#fff;font-weight:500;font-size:11px;margin-left:auto;padding-left:12px">${val}</span>
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
        itemHeight: 2,
        data: [
          'Current Trajectory',
          'Vision Target',
          ...(hasIntervention ? ['With Intervention'] : []),
        ],
      },
      xAxis: {
        type: 'category',
        data: years,
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
          name: 'Current Trajectory',
          type: 'line',
          data: sortedData.map((d) => d.current_trajectory),
          smooth: true,
          connectNulls: true,
          symbol: 'none',
          lineStyle: { color: '#EF4444', width: 2, type: 'dashed' },
          itemStyle: { color: '#EF4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239,68,68,0.15)' },
                { offset: 1, color: 'rgba(239,68,68,0.02)' },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: { borderWidth: 0 },
          },
        },
        {
          name: 'Vision Target',
          type: 'line',
          data: sortedData.map((d) => d.vision_target),
          smooth: true,
          connectNulls: true,
          symbol: 'none',
          lineStyle: { color: accentColor, width: 2 },
          itemStyle: { color: accentColor },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: accentColor + '26' },
                { offset: 1, color: accentColor + '05' },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: { borderWidth: 0 },
          },
        },
        ...(hasIntervention
          ? [
              {
                name: 'With Intervention',
                type: 'line',
                data: sortedData.map((d) => d.with_intervention),
                smooth: true,
                connectNulls: true,
                symbol: 'none',
                lineStyle: { color: '#16A34A', width: 2, type: 'dashed' },
                itemStyle: { color: '#16A34A' },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(22,163,74,0.1)' },
                      { offset: 1, color: 'rgba(22,163,74,0.01)' },
                    ],
                  },
                },
                emphasis: {
                  focus: 'series',
                  itemStyle: { borderWidth: 0 },
                },
              },
            ]
          : []),
        {
          name: 'Historical Data',
          type: 'scatter',
          data: historicalPoints,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#94A3B8' },
          z: 10,
        },
      ],
    }),
    [sortedData, accentColor, hasIntervention, historicalPoints, years]
  )

  return (
    <div className="w-full" style={{ height: 340 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
