'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface HeatmapSkill {
  name: string
  gap_score: number
  criticality: 'critical' | 'high' | 'medium' | 'low' | null
  sector: string
}

interface SectorHeatmapProps {
  skills: HeatmapSkill[]
  accentColor: string
}

export default function SectorHeatmap({ skills, accentColor }: SectorHeatmapProps) {
  const { sectors, skillNames, heatmapData, maxScore } = useMemo(() => {
    if (skills.length === 0) {
      return { sectors: [], skillNames: [], heatmapData: [], maxScore: 100 }
    }

    const sectorSet = new Set<string>()
    const skillNameSet = new Set<string>()
    for (const s of skills) {
      sectorSet.add(s.sector || 'Other')
      skillNameSet.add(s.name)
    }

    const sectorsList = Array.from(sectorSet).sort()
    const skillNamesList = Array.from(skillNameSet).sort()

    // Build a lookup map for gap scores
    const scoreMap = new Map<string, { gap_score: number; criticality: string | null }>()
    for (const s of skills) {
      const key = `${s.sector || 'Other'}::${s.name}`
      scoreMap.set(key, { gap_score: s.gap_score, criticality: s.criticality })
    }

    const data: Array<[number, number, number, string | null]> = []
    let max = 0
    for (let xi = 0; xi < sectorsList.length; xi++) {
      for (let yi = 0; yi < skillNamesList.length; yi++) {
        const key = `${sectorsList[xi]}::${skillNamesList[yi]}`
        const entry = scoreMap.get(key)
        if (entry) {
          data.push([xi, yi, entry.gap_score, entry.criticality])
          if (entry.gap_score > max) max = entry.gap_score
        }
      }
    }

    return {
      sectors: sectorsList,
      skillNames: skillNamesList,
      heatmapData: data,
      maxScore: max || 100,
    }
  }, [skills])

  const chartHeight = Math.max(300, skillNames.length * 28 + 80)

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: {
        top: 10,
        right: 20,
        bottom: 60,
        left: 'auto',
        containLabel: true,
      },
      tooltip: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#E6EDF3', fontSize: 12 },
        formatter(params: {
          value: [number, number, number, string | null]
          name: string
        }) {
          const [xi, yi, score, criticality] = params.value
          const sector = sectors[xi]
          const skill = skillNames[yi]
          let html = `<div style="font-weight:500;color:#fff;margin-bottom:4px">${skill}</div>`
          html += `<div style="color:#94A3B8;font-size:11px">Gap Score: <span style="color:#fff">${score}/100</span></div>`
          if (criticality) {
            html += `<div style="color:#94A3B8;font-size:11px">Criticality: <span style="color:#fff;text-transform:capitalize">${criticality}</span></div>`
          }
          html += `<div style="color:#94A3B8;font-size:11px">Sector: <span style="color:#fff">${sector}</span></div>`
          return html
        },
      },
      xAxis: {
        type: 'category',
        data: sectors,
        axisLine: { lineStyle: { color: '#1E293B' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          rotate: sectors.length > 5 ? 30 : 0,
          interval: 0,
        },
        position: 'bottom',
      },
      yAxis: {
        type: 'category',
        data: skillNames,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          width: 120,
          overflow: 'truncate',
        },
      },
      visualMap: {
        min: 0,
        max: maxScore,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 14,
        itemHeight: 120,
        textStyle: { color: '#64748B', fontSize: 10 },
        text: ['High gap', 'Low gap'],
        inRange: {
          color: [accentColor + '15', accentColor + '40', accentColor + '80', accentColor],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          itemStyle: {
            borderColor: '#0F1A2E',
            borderWidth: 2,
            borderRadius: 3,
          },
          emphasis: {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)',
            },
          },
          label: {
            show: heatmapData.length <= 40,
            formatter(params: { value: [number, number, number] }) {
              return `${params.value[2]}`
            },
            color: '#E6EDF3',
            fontSize: 10,
          },
        },
      ],
    }),
    [sectors, skillNames, heatmapData, maxScore, accentColor]
  )

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No skill data available
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
