'use client'

import { useMemo } from 'react'
import { ReactFlow, ReactFlowProvider, useReactFlow, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MagnifyingGlassPlus, MagnifyingGlassMinus, CornersOut, EyeSlash, Target } from '@phosphor-icons/react/dist/ssr'
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

const COMPLETED_STATUSES = new Set(['completed', 'verified'])
const INACTIVE_STATUSES = new Set(['superseded', 'no_longer_relevant'])

export interface OdysseyRoadmapGraphProps {
  nodes: Node<OdysseyNodeData>[]
  edges: Edge[]
  selectedMilestoneId?: string
  onSelectMilestone: (milestoneId: string) => void
  hideCompleted?: boolean
  focusActive?: boolean
  onToggleHideCompleted?: () => void
  onToggleFocusActive?: () => void
}

/**
 * The roadmap plane: a full-bleed, borderless canvas sized to its actual
 * content (not a fixed dashboard box), no grid-paper background, and the
 * page itself scrolls once the plan is taller than the viewport — the
 * canvas only pans/zooms on deliberate drag or the control cluster, never
 * hijacking the page's own scroll.
 */
export function OdysseyRoadmapGraph({
  nodes,
  edges,
  selectedMilestoneId,
  onSelectMilestone,
  hideCompleted = false,
  focusActive = false,
  onToggleHideCompleted,
  onToggleFocusActive,
}: OdysseyRoadmapGraphProps) {
  const reduceMotion = useReducedMotionSafe()

  const contentHeight = useMemo(() => {
    const ys = nodes.map((n) => n.position.y)
    const maxY = ys.length > 0 ? Math.max(...ys) : 0
    const minY = ys.length > 0 ? Math.min(...ys) : 0
    return Math.max(460, maxY - minY + 260)
  }, [nodes])

  const hiddenIds = useMemo(() => {
    if (!hideCompleted) return new Set<string>()
    return new Set(
      nodes.filter((n) => n.data.kind === 'milestone' && COMPLETED_STATUSES.has(n.data.milestone.status)).map((n) => n.id)
    )
  }, [nodes, hideCompleted])

  const interactiveNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isInactive = focusActive && node.data.kind === 'milestone' && INACTIVE_STATUSES.has(node.data.milestone.status)
        return {
          ...node,
          hidden: hiddenIds.has(node.id),
          selected: node.id === selectedMilestoneId,
          style: isInactive ? { ...node.style, opacity: 0.35 } : node.style,
          data: node.data.kind === 'milestone' ? { ...node.data, onSelect: onSelectMilestone } : node.data,
        }
      }),
    [nodes, selectedMilestoneId, onSelectMilestone, hiddenIds, focusActive]
  )

  const interactiveEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, hidden: hiddenIds.has(edge.source) || hiddenIds.has(edge.target) })),
    [edges, hiddenIds]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full bg-campus-bg" style={{ height: contentHeight }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={interactiveNodes}
            edges={interactiveEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15, duration: reduceMotion ? 0 : 300 }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll={false}
            zoomOnScroll={false}
            zoomOnPinch
            panOnDrag
            minZoom={0.5}
            maxZoom={1.75}
            proOptions={{ hideAttribution: true }}
          >
            <GraphControls
              reduceMotion={Boolean(reduceMotion)}
              hideCompleted={hideCompleted}
              focusActive={focusActive}
              onToggleHideCompleted={onToggleHideCompleted}
              onToggleFocusActive={onToggleFocusActive}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      {/* Below the canvas, never floating over it — a legend overlapping the destination or edge
          nodes in some plan layouts would undermine the very legibility it exists to support. */}
      <div className="rounded-campus-sm border border-campus-border bg-campus-surface p-2.5">
        <OdysseyGraphLegend />
      </div>
    </div>
  )
}

function GraphControls({
  reduceMotion,
  hideCompleted,
  focusActive,
  onToggleHideCompleted,
  onToggleFocusActive,
}: {
  reduceMotion: boolean
  hideCompleted: boolean
  focusActive: boolean
  onToggleHideCompleted?: () => void
  onToggleFocusActive?: () => void
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const duration = reduceMotion ? 0 : 300

  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1 rounded-campus-sm border border-campus-border bg-campus-surface/95 p-1 shadow-campus-subtle backdrop-blur-sm">
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
        onClick={() => fitView({ duration, padding: 0.15 })}
        aria-label="Fit to view"
        className="rounded-campus-sm p-2 text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <CornersOut size={16} aria-hidden="true" />
      </button>
      {onToggleHideCompleted && (
        <button
          type="button"
          onClick={onToggleHideCompleted}
          aria-pressed={hideCompleted}
          aria-label="Hide completed milestones"
          className={`rounded-campus-sm p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${hideCompleted ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
        >
          <EyeSlash size={16} aria-hidden="true" />
        </button>
      )}
      {onToggleFocusActive && (
        <button
          type="button"
          onClick={onToggleFocusActive}
          aria-pressed={focusActive}
          aria-label="Focus active plan, muting superseded routes"
          className={`rounded-campus-sm p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${focusActive ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
        >
          <Target size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
