'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { MapPin } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyMilestoneNodeData } from '@/lib/utilities/odyssey-projection'
import { MILESTONE_TYPE_VISUALS, MILESTONE_STATUS_BORDER, MILESTONE_STATUS_MARKER } from './odyssey-node-config'
import { MILESTONE_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

type SelectableNodeData = OdysseyMilestoneNodeData & { onSelect?: (milestoneId: string) => void }

/**
 * Compact roadmap-scale node. Type is communicated by icon + label; status
 * by a small always-present corner marker (icon + short label), never by
 * colour alone. Current-position/recommended-next get an additional pill
 * since those two conditions are genuinely rare and worth calling out.
 */
export function OdysseyMilestoneNode({ data, selected }: NodeProps<Node<SelectableNodeData>>) {
  const { milestone, isCurrentPosition, isRecommendedNext, onSelect } = data
  const visual = MILESTONE_TYPE_VISUALS[milestone.type]
  const Icon = visual.icon
  const statusMarker = MILESTONE_STATUS_MARKER[milestone.status]
  const StatusIcon = statusMarker.icon

  function activate() {
    onSelect?.(milestone.id)
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
      className={`group relative w-44 cursor-pointer rounded-campus-sm border-2 bg-campus-surface px-2.5 py-2 shadow-campus-subtle transition-shadow duration-campus-fast hover:shadow-campus-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
        MILESTONE_STATUS_BORDER[milestone.status]
      } ${selected ? 'ring-2 ring-campus-blue-600 dark:ring-campus-blue-dark' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-campus-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-campus-border" />

      {(isCurrentPosition || isRecommendedNext) && (
        <span
          className={`absolute -top-2.5 left-2 flex items-center gap-1 rounded-full border border-campus-border bg-campus-surface px-1.5 py-0.5 font-campus-mono text-[9px] uppercase tracking-wide ${
            isCurrentPosition ? 'text-campus-blue-600 dark:text-campus-blue-dark' : 'text-campus-amber-600 dark:text-campus-amber-dark'
          }`}
        >
          {isCurrentPosition ? (
            <>
              <MapPin size={9} weight="fill" aria-hidden="true" /> Here
            </>
          ) : (
            'Next'
          )}
        </span>
      )}

      <div className="flex items-start gap-1.5">
        <Icon size={15} className={`mt-0.5 shrink-0 ${visual.accentClass}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-campus-sans text-[12px] font-medium leading-tight text-campus-text">{milestone.title}</p>
          <p className="mt-0.5 font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
        </div>
      </div>

      <div className={`mt-1.5 flex items-center gap-1 border-t border-campus-border pt-1 font-campus-mono text-[9px] uppercase tracking-wide ${statusMarker.accentClass}`}>
        <StatusIcon size={11} weight="fill" aria-hidden="true" />
        {statusMarker.shortLabel}
      </div>
    </div>
  )
}
