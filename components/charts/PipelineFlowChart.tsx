'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface PipelineFlowChartProps {
  institutions: number
  graduates: number
  employmentRate: number
  accentColor: string
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export default function PipelineFlowChart({
  institutions,
  graduates,
  employmentRate,
  accentColor,
}: PipelineFlowChartProps) {
  const employed = Math.round((graduates * employmentRate) / 100)
  const unemployed = graduates - employed

  const option = useMemo(() => {
    // Scale values for visual proportionality.
    // Use graduates as the baseline since it is the throughput quantity.
    const eduValue = graduates
    const empValue = employed
    const unempValue = unemployed > 0 ? unemployed : 0

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#E6EDF3', fontSize: 12 },
        formatter(params: { data: { source?: string; target?: string; value?: number; name?: string } }) {
          const d = params.data
          if (d.source && d.target) {
            return `<div style="color:#94A3B8;font-size:11px">${d.source} → ${d.target}</div>
                    <div style="color:#fff;font-weight:500">${formatNumber(d.value ?? 0)}</div>`
          }
          return `<div style="color:#fff;font-weight:500">${d.name}</div>`
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          left: 40,
          right: 40,
          top: 20,
          bottom: 20,
          nodeWidth: 20,
          nodeGap: 16,
          draggable: false,
          emphasis: {
            focus: 'adjacency',
          },
          lineStyle: {
            color: 'gradient',
            opacity: 0.4,
            curveness: 0.5,
          },
          label: {
            color: '#CBD5E1',
            fontSize: 12,
            fontWeight: 500,
            formatter(params: { name: string }) {
              const name = params.name
              if (name === 'Education') return `Education\n${formatNumber(institutions)} institutions`
              if (name === 'Graduates') return `Graduates\n${formatNumber(graduates)}`
              if (name === 'Employment') return `Employment\n${employmentRate}% (${formatNumber(employed)})`
              if (name === 'Unemployed') return `Unemployed\n${formatNumber(unemployed)}`
              return name
            },
          },
          data: [
            {
              name: 'Education',
              itemStyle: { color: accentColor, borderColor: accentColor },
            },
            {
              name: 'Graduates',
              itemStyle: { color: accentColor + 'CC', borderColor: accentColor + 'CC' },
            },
            {
              name: 'Employment',
              itemStyle: { color: '#16A34A', borderColor: '#16A34A' },
            },
            ...(unempValue > 0
              ? [
                  {
                    name: 'Unemployed',
                    itemStyle: { color: '#EF4444', borderColor: '#EF4444' },
                  },
                ]
              : []),
          ],
          links: [
            {
              source: 'Education',
              target: 'Graduates',
              value: eduValue,
            },
            {
              source: 'Graduates',
              target: 'Employment',
              value: empValue,
            },
            ...(unempValue > 0
              ? [
                  {
                    source: 'Graduates',
                    target: 'Unemployed',
                    value: unempValue,
                  },
                ]
              : []),
          ],
        },
      ],
    }
  }, [institutions, graduates, employmentRate, employed, unemployed, accentColor])

  return (
    <div className="w-full" style={{ height: 260 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
