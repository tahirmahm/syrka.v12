'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface IndicatorHeatmapProps {
  data: Array<{
    country: string
    year: number
    value: number
  }>
  indicatorName: string
  accentColor: string
}

export default function IndicatorHeatmapChart({
  data,
  indicatorName,
  accentColor,
}: IndicatorHeatmapProps) {
  const { years, countries, heatmapData, minVal, maxVal } = useMemo(() => {
    const yearSet = new Set<number>()
    const countrySet = new Set<string>()
    let min = Infinity
    let max = -Infinity

    for (const d of data) {
      yearSet.add(d.year)
      countrySet.add(d.country)
      if (d.value < min) min = d.value
      if (d.value > max) max = d.value
    }

    const sortedYears = Array.from(yearSet).sort((a, b) => a - b)
    const sortedCountries = Array.from(countrySet).sort()

    const yearIndex = new Map(sortedYears.map((y, i) => [y, i]))
    const countryIndex = new Map(sortedCountries.map((c, i) => [c, i]))

    const mapped = data.map((d) => [
      yearIndex.get(d.year)!,
      countryIndex.get(d.country)!,
      d.value,
    ])

    return {
      years: sortedYears,
      countries: sortedCountries,
      heatmapData: mapped,
      minVal: min === Infinity ? 0 : min,
      maxVal: max === -Infinity ? 100 : max,
    }
  }, [data])

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: {
        top: 8,
        right: 80,
        bottom: 40,
        left: 120,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0A1628',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        formatter(params: { value: [number, number, number] }) {
          const [yearIdx, countryIdx, value] = params.value
          const year = years[yearIdx]
          const countryName = countries[countryIdx]
          return `<div style="font-family:monospace;color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:6px">${countryName} \u00B7 ${year}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="color:rgba(255,255,255,0.7);font-size:11px">${indicatorName}:</span>
              <span style="color:#fff;font-weight:500;font-size:12px">${value.toFixed(1)}</span>
            </div>`
        },
      },
      xAxis: {
        type: 'category',
        data: years.map(String),
        axisLine: { lineStyle: { color: '#1E293B' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: countries,
        axisLine: { lineStyle: { color: '#1E293B' } },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitArea: { show: false },
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemHeight: 140,
        itemWidth: 12,
        textStyle: { color: '#64748B', fontSize: 10 },
        inRange: {
          color: [
            accentColor + '1A',
            accentColor + '4D',
            accentColor + '80',
            accentColor + 'B3',
            accentColor,
          ],
        },
        borderColor: 'transparent',
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
          itemStyle: {
            borderColor: '#0F172A',
            borderWidth: 1,
            borderRadius: 2,
          },
        },
      ],
    }),
    [years, countries, heatmapData, minVal, maxVal, accentColor, indicatorName]
  )

  return (
    <div className="w-full" style={{ height: Math.max(300, countries.length * 32 + 80) }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
