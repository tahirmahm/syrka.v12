'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface BenchmarkRadarChartProps {
  country: string
  countryCode: string
  peerAverage: Record<string, number>
  countryValues: Record<string, number>
  accentColor: string
}

export default function BenchmarkRadarChart({
  country,
  countryCode,
  peerAverage,
  countryValues,
  accentColor,
}: BenchmarkRadarChartProps) {
  const indicators = useMemo(
    () => Object.keys({ ...peerAverage, ...countryValues }),
    [peerAverage, countryValues]
  )

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#E6EDF3',
          fontSize: 12,
        },
        formatter(params: { seriesName: string; value: number[]; name: string }) {
          const { seriesName, value } = params
          let html = `<div style="font-family:monospace;color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:6px">${seriesName}</div>`
          indicators.forEach((ind, i) => {
            const val = value[i] !== undefined ? value[i].toFixed(1) : '--'
            html += `<div style="display:flex;justify-content:space-between;gap:12px;padding:1px 0">
              <span style="color:rgba(255,255,255,0.7);font-size:11px">${ind}</span>
              <span style="color:#fff;font-weight:500;font-size:11px">${val}</span>
            </div>`
          })
          return html
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 2,
        data: [`${country} (${countryCode})`, 'Peer Average'],
      },
      radar: {
        indicator: indicators.map((name) => ({ name, max: 100 })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#94A3B8',
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(148,163,184,0.02)', 'rgba(148,163,184,0.04)'],
          },
        },
        splitLine: {
          lineStyle: { color: 'rgba(148,163,184,0.1)' },
        },
        axisLine: {
          lineStyle: { color: 'rgba(148,163,184,0.1)' },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              name: `${country} (${countryCode})`,
              value: indicators.map((ind) => countryValues[ind] ?? 0),
              symbol: 'circle',
              symbolSize: 5,
              lineStyle: { color: accentColor, width: 2 },
              itemStyle: { color: accentColor },
              areaStyle: { color: accentColor + '4D' },
            },
            {
              name: 'Peer Average',
              value: indicators.map((ind) => peerAverage[ind] ?? 0),
              symbol: 'circle',
              symbolSize: 4,
              lineStyle: { color: '#64748B', width: 1.5, type: 'dashed' },
              itemStyle: { color: '#64748B' },
              areaStyle: { color: 'rgba(100,116,139,0.1)' },
            },
          ],
        },
      ],
    }),
    [indicators, country, countryCode, countryValues, peerAverage, accentColor]
  )

  return (
    <div className="w-full" style={{ height: 400 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
