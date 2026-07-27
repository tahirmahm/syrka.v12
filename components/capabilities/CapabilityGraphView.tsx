'use client'

import { ReactFlow, ReactFlowProvider, Background, useReactFlow, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MagnifyingGlassPlus, MagnifyingGlassMinus, CornersOut } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { CapabilityNode } from './CapabilityNode'
import { DomainLabelNode } from './DomainLabelNode'
import type { CapabilityNodeData, DomainLabelNodeData } from '@/lib/utilities/capability-graph-layout'

const nodeTypes = { capability: CapabilityNode, domainLabel: DomainLabelNode }

export interface CapabilityGraphViewProps {
  nodes: Node<CapabilityNodeData | DomainLabelNodeData>[]
  edges: Edge[]
}

export function CapabilityGraphView({ nodes, edges }: CapabilityGraphViewProps) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <div className="h-[520px] w-full rounded-campus-md border border-campus-border bg-campus-surface">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25, duration: reduceMotion ? 0 : 300 }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          minZoom={0.4}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} className="opacity-40" />
          <GraphControls reduceMotion={Boolean(reduceMotion)} />
        </ReactFlow>
      </ReactFlowProvider>
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
        onClick={() => fitView({ duration, padding: 0.25 })}
        aria-label="Reset view"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <CornersOut size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
