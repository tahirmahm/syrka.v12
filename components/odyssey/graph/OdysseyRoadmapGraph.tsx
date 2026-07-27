'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReactFlow, ReactFlowProvider, useReactFlow, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MagnifyingGlassPlus, MagnifyingGlassMinus, CornersOut, EyeSlash, Target } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { OdysseyMilestoneNode } from './OdysseyMilestoneNode'
import { OdysseyDestinationNode } from './OdysseyDestinationNode'
import { OdysseyAlternativeNode } from './OdysseyAlternativeNode'
import { OdysseyCollapsedBranchNode } from './OdysseyCollapsedBranchNode'
import { OdysseyGraphLegend } from './OdysseyGraphLegend'
import type { OdysseyNodeData, OdysseyMilestoneNodeData } from '@/lib/utilities/odyssey-projection'
import { computeMilestoneBranchGroups } from '@/lib/utilities/odyssey-projection'

const nodeTypes = {
  milestone: OdysseyMilestoneNode,
  destination: OdysseyDestinationNode,
  alternative: OdysseyAlternativeNode,
  'collapsed-branch': OdysseyCollapsedBranchNode,
}

const COMPLETED_STATUSES = new Set(['completed', 'verified'])

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
  const [collapsedRoots, setCollapsedRoots] = useState<Set<string>>(new Set())

  const milestoneNodes = useMemo(() => nodes.filter((n): n is Node<OdysseyMilestoneNodeData> => n.data.kind === 'milestone'), [nodes])
  const isPrimaryById = useMemo(() => new Map(milestoneNodes.map((n) => [n.id, n.data.isPrimaryPath])), [milestoneNodes])
  const { rootOf, groups } = useMemo(
    () => computeMilestoneBranchGroups(milestoneNodes.map((n) => n.data.milestone), (id) => isPrimaryById.get(id) ?? false),
    [milestoneNodes, isPrimaryById]
  )

  // Selecting a milestone inside a collapsed branch opens that branch
  // automatically, rather than leaving the selection invisible.
  useEffect(() => {
    if (!selectedMilestoneId) return
    const rootId = rootOf.get(selectedMilestoneId)
    if (rootId && collapsedRoots.has(rootId)) {
      setCollapsedRoots((prev) => {
        const next = new Set(prev)
        next.delete(rootId)
        return next
      })
    }
    // Only re-run when the selection changes — expanding a branch the user
    // just collapsed themselves (without changing selection) must stick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMilestoneId, rootOf])

  function toggleBranchCollapse(milestoneId: string) {
    const rootId = rootOf.get(milestoneId) ?? milestoneId
    setCollapsedRoots((prev) => {
      const next = new Set(prev)
      if (next.has(rootId)) next.delete(rootId)
      else next.add(rootId)
      return next
    })
  }

  const contentHeight = useMemo(() => {
    const ys = nodes.map((n) => n.position.y)
    const maxY = ys.length > 0 ? Math.max(...ys) : 0
    const minY = ys.length > 0 ? Math.min(...ys) : 0
    return Math.max(460, maxY - minY + 260)
  }, [nodes])

  // Real route isolation, not opacity: when focused on a selected milestone,
  // only the trunk, that milestone's own prerequisite ancestors, and the
  // milestone itself stay visible — everything else (unrelated branches,
  // superseded/no-longer-relevant milestones) is hidden outright.
  const focusRelevantIds = useMemo(() => {
    if (!focusActive) return null
    const byId = new Map(milestoneNodes.map((n) => [n.id, n.data]))
    const relevant = new Set<string>()
    milestoneNodes.forEach((n) => {
      if (n.data.isPrimaryPath) relevant.add(n.id)
    })
    if (selectedMilestoneId && byId.has(selectedMilestoneId)) {
      const stack = [selectedMilestoneId]
      while (stack.length > 0) {
        const id = stack.pop()!
        if (relevant.has(id)) continue
        relevant.add(id)
        byId.get(id)?.milestone.prerequisiteMilestoneIds.forEach((pid) => stack.push(pid))
      }
    }
    return relevant
  }, [milestoneNodes, focusActive, selectedMilestoneId])

  const collapsedMemberIds = useMemo(() => {
    const hidden = new Set<string>()
    collapsedRoots.forEach((rootId) => groups.get(rootId)?.forEach((id) => hidden.add(id)))
    return hidden
  }, [collapsedRoots, groups])

  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>()
    if (hideCompleted) {
      milestoneNodes.forEach((n) => {
        if (COMPLETED_STATUSES.has(n.data.milestone.status)) hidden.add(n.id)
      })
    }
    collapsedMemberIds.forEach((id) => hidden.add(id))
    if (focusRelevantIds) {
      nodes.forEach((n) => {
        if (n.data.kind === 'milestone' && !focusRelevantIds.has(n.id)) hidden.add(n.id)
        if (n.data.kind === 'alternative') hidden.add(n.id)
      })
    }
    // Alternative-action nodes hang off a specific milestone — hide them
    // whenever that milestone itself is hidden, for any reason above.
    edges.forEach((edge) => {
      const targetIsAlternative = nodes.find((n) => n.id === edge.target)?.data.kind === 'alternative'
      if (targetIsAlternative && hidden.has(edge.source)) hidden.add(edge.target)
    })
    return hidden
  }, [nodes, edges, milestoneNodes, hideCompleted, collapsedMemberIds, focusRelevantIds])

  const collapsedBranchNodes = useMemo(() => {
    const result: Node<{ kind: 'collapsed-branch'; count: number; onExpand: () => void }>[] = []
    collapsedRoots.forEach((rootId) => {
      const rootNode = milestoneNodes.find((n) => n.id === rootId)
      const members = groups.get(rootId)
      if (!rootNode || !members) return
      result.push({
        id: `collapsed-${rootId}`,
        type: 'collapsed-branch',
        position: rootNode.position,
        data: { kind: 'collapsed-branch', count: members.length, onExpand: () => toggleBranchCollapse(rootId) },
        draggable: false,
      })
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsedRoots, groups, milestoneNodes])

  const interactiveNodes = useMemo(() => {
    const base = nodes.map((node) => ({
      ...node,
      hidden: hiddenIds.has(node.id),
      selected: node.id === selectedMilestoneId,
      data:
        node.data.kind === 'milestone'
          ? { ...node.data, onSelect: onSelectMilestone, onToggleCollapse: groups.has(node.id) ? toggleBranchCollapse : undefined }
          : node.data,
    }))
    return [...base, ...collapsedBranchNodes]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, selectedMilestoneId, onSelectMilestone, hiddenIds, groups, collapsedBranchNodes])

  const interactiveEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, hidden: hiddenIds.has(edge.source) || hiddenIds.has(edge.target) })),
    [edges, hiddenIds]
  )

  return (
    <div className="flex flex-col gap-3">
      {focusActive && selectedMilestoneId && (
        <button
          type="button"
          onClick={onToggleFocusActive}
          className="self-start rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-xs text-campus-muted hover:bg-campus-surface-raised"
        >
          Focused on this route — Show all routes
        </button>
      )}
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
