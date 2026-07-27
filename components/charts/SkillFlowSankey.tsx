'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface SkillFlowNode {
  name: string
  category: 'education' | 'skill' | 'employment'
}

interface SkillFlowLink {
  source: string
  target: string
  value: number
}

interface SkillFlowSankeyProps {
  nodes: SkillFlowNode[]
  links: SkillFlowLink[]
  accentColor: string
}

const CATEGORY_COLORS: Record<SkillFlowNode['category'], string> = {
  education: '', // set dynamically from accentColor
  skill: '#64748B',
  employment: '#16A34A',
}

export default function SkillFlowSankey({
  nodes,
  links,
  accentColor,
}: SkillFlowSankeyProps) {
  const categoryColorMap = useMemo(
    () => ({ ...CATEGORY_COLORS, education: accentColor }),
    [accentColor]
  )

  const nodeColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const node of nodes) {
      map[node.name] = categoryColorMap[node.category]
    }
    return map
  }, [nodes, categoryColorMap])

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#E6EDF3',
          fontSize: 12,
        },
        formatter(params: { dataType: string; name: string; data: { source: string; target: string; value: number } }) {
          if (params.dataType === 'edge') {
            const { source, target, value } = params.data
            return `<div style="font-size:11px">
              <span style="color:rgba(255,255,255,0.6)">${source}</span>
              <span style="color:rgba(255,255,255,0.3);margin:0 6px">\u2192</span>
              <span style="color:rgba(255,255,255,0.6)">${target}</span>
              <div style="color:#fff;font-weight:500;margin-top:4px">${value.toLocaleString()}</div>
            </div>`
          }
          return `<div style="color:#fff;font-weight:500;font-size:12px">${params.name}</div>`
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          nodeAlign: 'left',
          layoutIterations: 32,
          nodeWidth: 20,
          nodeGap: 12,
          left: 40,
          right: 40,
          top: 16,
          bottom: 16,
          data: nodes.map((node) => ({
            name: node.name,
            itemStyle: { color: categoryColorMap[node.category] },
            label: {
              color: '#CBD5E1',
              fontSize: 11,
            },
          })),
          links: links.map((link) => ({
            ...link,
            lineStyle: {
              color: nodeColorMap[link.source] || accentColor,
              opacity: 0.25,
            },
          })),
          label: {
            position: 'right',
            color: '#CBD5E1',
            fontSize: 11,
          },
          lineStyle: {
            curveness: 0.5,
          },
        },
      ],
    }),
    [nodes, links, accentColor, categoryColorMap, nodeColorMap]
  )

  return (
    <div className="w-full" style={{ height: 480 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
