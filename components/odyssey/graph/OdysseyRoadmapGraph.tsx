'use client'

import { useMemo } from 'react'
import { ReactFlow, ReactFlowProvider, Background, useReactFlow, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MagnifyingGlassPlus, MagnifyingGlassMinus, CornersOut, ArrowsOut } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { OdysseyMilestoneNode } from './OdysseyMilestoneNode'
import { OdysseyDestinationNode } from './OdysseyDestinationNode'
import { OdysseyAlternativeNode } from './OdysseyAlternativeNode'
import { OdysseyGraphLegend } from './OdysseyGraphLegend'
import type { OdysseyNodeData } from '@/lib/utilities/odyssey-projection'

const nodeTypes = {
  milestone: OdysseyMilestoneNode,
  destination: OdysseyDestinationNode,
  alternative: OdysseyAlternativeNode,
}

export interface OdysseyRoadmapGraphProps {
  nodes: Node<OdysseyNodeData>[]
  edges: Edge[]
  selectedMilestoneId?: string
  onSelectMilestone: (milestoneId: string) => void
}

export function OdysseyRoadmapGraph({ nodes, edges, selectedMilestoneId, onSelectMilestone }: OdysseyRoadmapGraphProps) {
  const reduceMotion = useReducedMotionSafe()

  const interactiveNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedMilestoneId,
        data: node.data.kind === 'milestone' ? { ...node.data, onSelect: onSelectMilestone } : node.data,
      })),
    [nodes, selectedMilestoneId, onSelectMilestone]
  )

  return (
    <div className="relative h-[560px] w-full rounded-campus-md border border-campus-border bg-campus-surface lg:h-[640px]">
      <ReactFlowProvider>
        <ReactFlow
          nodes={interactiveNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, duration: reduceMotion ? 0 : 300 }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          minZoom={0.35}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} className="opacity-40" />
          <GraphControls reduceMotion={Boolean(reduceMotion)} />
        </ReactFlow>
      </ReactFlowProvider>
      <div className="absolute bottom-3 right-3 z-10 hidden max-w-xs rounded-campus-sm border border-campus-border bg-campus-surface/95 p-2.5 shadow-campus-subtle md:block">
        <OdysseyGraphLegend />
      </div>
    </div>
  )
}

function GraphControls({ reduceMotion }: { reduceMotion: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const duration = reduceMotion ? 0 : 300

  return (
    <div className="absolute bottom-3 left-3 z-10 flex gap-1 rounded-campus-sm border border-campus-border bg-campus-surface p-1 shadow-campus-subtle">
      <button
        type="button"
        onClick={() => zoomIn({ duration })}
        aria-label="Zoom in"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <MagnifyingGlassPlus size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration })}
        aria-label="Zoom out"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <MagnifyingGlassMinus size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ duration, padding: 0.2 })}
        aria-label="Fit to view"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <ArrowsOut size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ duration: 0, padding: 0.2 })}
        aria-label="Reset view"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <CornersOut size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
