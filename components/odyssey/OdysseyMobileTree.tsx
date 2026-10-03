'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import { CaretDown, FlagCheckered } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyNodeData, OdysseyMilestoneNodeData } from '@/lib/utilities/odyssey-projection'
import { computeMilestoneBranchGroups } from '@/lib/utilities/odyssey-projection'
import { MILESTONE_TYPE_VISUALS, MILESTONE_STATUS_MARKER } from './graph/odyssey-node-config'
import { MILESTONE_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

export interface OdysseyMobileTreeProps {
  nodes: Node<OdysseyNodeData>[]
  selectedMilestoneId?: string
  onSelectMilestone: (milestoneId: string) => void
}

/**
 * The purpose-built mobile Odyssey view — a real vertical trunk/branch
 * tree, not a stack of textual cards. Branches default to collapsed (so
 * the trunk reads at a glance on a narrow screen) and reuse the same
 * branch-group logic as the desktop graph, so "collapse this branch"
 * means the same set of milestones in both. Selecting a milestone opens
 * the existing OdysseyMilestoneInspector, which already renders as a
 * bottom sheet on mobile — this component only owns the tree itself.
 */
export function OdysseyMobileTree({ nodes, selectedMilestoneId, onSelectMilestone }: OdysseyMobileTreeProps) {
  const milestoneNodes = useMemo(() => nodes.filter((n): n is Node<OdysseyMilestoneNodeData> => n.data.kind === 'milestone'), [nodes])
  const destinationNode = useMemo(() => nodes.find((n) => n.data.kind === 'destination'), [nodes])

  const isPrimaryById = useMemo(() => new Map(milestoneNodes.map((n) => [n.id, n.data.isPrimaryPath])), [milestoneNodes])
  const { rootOf, groups } = useMemo(
    () => computeMilestoneBranchGroups(milestoneNodes.map((n) => n.data.milestone), (id) => isPrimaryById.get(id) ?? false),
    [milestoneNodes, isPrimaryById]
  )

  const [collapsedRoots, setCollapsedRoots] = useState<Set<string>>(() => new Set(groups.keys()))

  useEffect(() => {
    if (!selectedMilestoneId) return
    const rootId = rootOf.get(selectedMilestoneId)
    if (!rootId) return
    setCollapsedRoots((prev) => {
      if (!prev.has(rootId)) return prev
      const next = new Set(prev)
      next.delete(rootId)
      return next
    })
  }, [selectedMilestoneId, rootOf])

  function toggle(rootId: string) {
    setCollapsedRoots((prev) => {
      const next = new Set(prev)
      if (next.has(rootId)) next.delete(rootId)
      else next.add(rootId)
      return next
    })
  }

  const byDepth = useMemo(() => {
    const map = new Map<number, Node<OdysseyMilestoneNodeData>[]>()
    milestoneNodes.forEach((n) => {
      const list = map.get(n.position.y) ?? []
      list.push(n)
      map.set(n.position.y, list)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [milestoneNodes])

  return (
    <ol className="flex flex-col gap-0.5">
      {byDepth.map(([depth, group]) => {
        const trunk = group.find((n) => n.data.isPrimaryPath)
        const branches = group.filter((n) => !n.data.isPrimaryPath)
        const renderedRoots = new Set<string>()

        return (
          <li key={depth} className="flex flex-col gap-0.5">
            {trunk && (
              <MilestoneRow node={trunk} selected={trunk.id === selectedMilestoneId} onSelect={onSelectMilestone} isTrunk />
            )}
            {branches.map((n) => {
              const rootId = rootOf.get(n.id)!
              if (renderedRoots.has(rootId)) return null
              renderedRoots.add(rootId)
              const members = groups.get(rootId) ?? [n.id]
              const collapsed = collapsedRoots.has(rootId)

              if (collapsed) {
                return (
                  <div key={rootId} className="ml-7 border-l border-dashed border-campus-border pl-3">
                    <button
                      type="button"
                      onClick={() => toggle(rootId)}
                      className="flex items-center gap-1 rounded-full border border-dashed border-campus-border px-2 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted"
                      aria-label={`Show ${members.length} collapsed alternative ${members.length === 1 ? 'route' : 'routes'}`}
                    >
                      <CaretDown size={10} className="-rotate-90" aria-hidden="true" />
                      {members.length} {members.length === 1 ? 'route' : 'routes'}
                    </button>
                  </div>
                )
              }

              return (
                <div key={rootId} className="ml-7 flex flex-col gap-0.5 border-l border-dashed border-campus-border pl-3">
                  {members.map((memberId) => {
                    const memberNode = milestoneNodes.find((mn) => mn.id === memberId)
                    if (!memberNode) return null
                    return (
                      <MilestoneRow
                        key={memberId}
                        node={memberNode}
                        selected={memberId === selectedMilestoneId}
                        onSelect={onSelectMilestone}
                        isTrunk={false}
                        onCollapse={memberId === rootId ? () => toggle(rootId) : undefined}
                      />
                    )
                  })}
                </div>
              )
            })}
          </li>
        )
      })}
      {destinationNode && destinationNode.data.kind === 'destination' && (
        <li className="mt-2 flex items-center gap-3 border-t border-campus-border pt-3">
          <FlagCheckered size={16} className="text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" />
          <span className="font-campus-sans text-campus-sm font-semibold text-campus-text">{destinationNode.data.destination.title}</span>
        </li>
      )}
    </ol>
  )
}

function MilestoneRow({
  node,
  selected,
  onSelect,
  isTrunk,
  onCollapse,
}: {
  node: Node<OdysseyMilestoneNodeData>
  selected: boolean
  onSelect: (id: string) => void
  isTrunk: boolean
  onCollapse?: () => void
}) {
  const { milestone, isCurrentPosition, isRecommendedNext } = node.data
  const visual = MILESTONE_TYPE_VISUALS[milestone.type]
  const Icon = visual.icon
  const statusMarker = MILESTONE_STATUS_MARKER[milestone.status]
  const StatusIcon = statusMarker.icon

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onSelect(milestone.id)}
        aria-current={selected ? 'true' : undefined}
        aria-label={`${milestone.title}, ${MILESTONE_TYPE_LABELS[milestone.type]}, ${MILESTONE_STATUS_LABELS[milestone.status]}${
          isRecommendedNext ? ', recommended next' : ''
        }${isCurrentPosition ? ', your current position' : ''}`}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-campus-sm px-2 py-2 text-left transition-colors ${
          selected ? 'bg-campus-surface-raised' : 'hover:bg-campus-surface-raised/60'
        }`}
      >
        <span
          className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${statusMarker.markerBorderClass} ${
            isTrunk ? statusMarker.markerFillClass : 'bg-campus-surface'
          }`}
          aria-hidden="true"
        >
          {(isCurrentPosition || isRecommendedNext) && (
            <span
              className={`absolute -inset-1 rounded-full border ${isCurrentPosition ? 'border-campus-blue-600 dark:border-campus-blue-dark' : 'border-campus-amber-600 dark:border-campus-amber-dark'} animate-pulse`}
            />
          )}
        </span>
        <Icon size={13} className={`shrink-0 ${visual.accentClass}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-campus-sans text-campus-sm text-campus-text ${isTrunk ? 'font-medium' : ''}`}>{milestone.title}</span>
          <span className="flex items-center gap-1 font-campus-mono text-[9px] uppercase tracking-wide">
            <StatusIcon size={9} weight="fill" aria-hidden="true" className={statusMarker.accentClass} />
            <span className={statusMarker.accentClass}>{statusMarker.shortLabel}</span>
            {(isCurrentPosition || isRecommendedNext) && (
              <span className={isCurrentPosition ? 'text-campus-blue-600 dark:text-campus-blue-dark' : 'text-campus-amber-600 dark:text-campus-amber-dark'}>
                · {isCurrentPosition ? 'Here' : 'Next'}
              </span>
            )}
          </span>
        </span>
      </button>
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-label={`Collapse this branch route: ${milestone.title}`}
          className="shrink-0 rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised"
        >
          <CaretDown size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
