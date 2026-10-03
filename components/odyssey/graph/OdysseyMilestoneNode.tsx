'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyMilestoneNodeData } from '@/lib/utilities/odyssey-projection'
import { MILESTONE_TYPE_VISUALS, MILESTONE_STATUS_MARKER } from './odyssey-node-config'
import { MILESTONE_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

type SelectableNodeData = OdysseyMilestoneNodeData & {
  onSelect?: (milestoneId: string) => void
  /** Only ever offered on a branch (isPrimaryPath === false) — the trunk is never collapsible. */
  onToggleCollapse?: (milestoneId: string) => void
}

/**
 * A roadmap marker, not a dashboard card: a small status-coded dot sits on
 * the trunk/branch line, with the title set beside it as plain text — no
 * border box, no shadow, no fixed card chrome. The trunk gets a filled
 * marker and full-weight type; a branch gets a hollow marker and muted
 * type, so line weight + marker fill (not colour alone) carry "this is the
 * path" vs. "this is an option."
 */
export function OdysseyMilestoneNode({ data, selected }: NodeProps<Node<SelectableNodeData>>) {
  const { milestone, isCurrentPosition, isRecommendedNext, isPrimaryPath, onSelect, onToggleCollapse } = data
  const visual = MILESTONE_TYPE_VISUALS[milestone.type]
  const Icon = visual.icon
  const statusMarker = MILESTONE_STATUS_MARKER[milestone.status]
  const StatusIcon = statusMarker.icon

  function activate() {
    onSelect?.(milestone.id)
  }

  function toggleCollapse(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    onToggleCollapse?.(milestone.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${milestone.title}, ${MILESTONE_TYPE_LABELS[milestone.type]}, ${MILESTONE_STATUS_LABELS[milestone.status]}${
        isRecommendedNext ? ', recommended next' : ''
      }${isCurrentPosition ? ', your current position' : ''}. Activate to view detail.`}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      className={`group relative flex w-[152px] cursor-pointer items-start gap-2 rounded-campus-sm px-1.5 py-1 transition-colors duration-campus-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
        selected ? 'bg-campus-surface-raised' : 'hover:bg-campus-surface-raised/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-campus-border" />
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-campus-border" />

      {/* The marker itself — filled on the trunk, hollow on a branch; the corner status icon is the only place status repeats. */}
      <span
        className={`relative mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${statusMarker.markerBorderClass} ${
          isPrimaryPath ? statusMarker.markerFillClass : 'bg-campus-surface'
        }`}
        aria-hidden="true"
      >
        {(isCurrentPosition || isRecommendedNext) && (
          <span
            className={`absolute -inset-1.5 rounded-full border ${isCurrentPosition ? 'border-campus-blue-600 dark:border-campus-blue-dark' : 'border-campus-amber-600 dark:border-campus-amber-dark'} animate-pulse`}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <Icon size={11} className={`shrink-0 ${visual.accentClass}`} aria-hidden="true" />
          <p className={`truncate font-campus-sans text-[12px] leading-tight text-campus-text ${isPrimaryPath ? 'font-medium' : ''}`}>{milestone.title}</p>
        </div>
        <div className="mt-0.5 flex items-center gap-1 font-campus-mono text-[9px] uppercase tracking-wide">
          <StatusIcon size={9} weight="fill" aria-hidden="true" className={statusMarker.accentClass} />
          <span className={statusMarker.accentClass}>{statusMarker.shortLabel}</span>
          {(isCurrentPosition || isRecommendedNext) && (
            <span className={isCurrentPosition ? 'text-campus-blue-600 dark:text-campus-blue-dark' : 'text-campus-amber-600 dark:text-campus-amber-dark'}>
              · {isCurrentPosition ? 'Here' : 'Next'}
            </span>
          )}
        </div>
      </div>

      {!isPrimaryPath && onToggleCollapse && (
        <button
          type="button"
          onClick={toggleCollapse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleCollapse(e)
            }
          }}
          aria-label={`Collapse this branch route: ${milestone.title}`}
          className="ml-1 shrink-0 rounded-campus-sm p-0.5 text-campus-muted opacity-0 hover:bg-campus-surface-raised group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <CaretDown size={11} aria-hidden="true" className="rotate-90" />
        </button>
      )}
    </div>
  )
}
