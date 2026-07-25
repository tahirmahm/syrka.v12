'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { CheckCircle, MapPin, Star } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyMilestoneNodeData } from '@/lib/utilities/odyssey-projection'
import { MILESTONE_TYPE_VISUALS, MILESTONE_STATUS_BORDER } from './odyssey-node-config'
import { MILESTONE_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

type SelectableNodeData = OdysseyMilestoneNodeData & { onSelect?: (milestoneId: string) => void }

export function OdysseyMilestoneNode({ data, selected }: NodeProps<Node<SelectableNodeData>>) {
  const { milestone, isCurrentPosition, isRecommendedNext, onSelect } = data
  const visual = MILESTONE_TYPE_VISUALS[milestone.type]
  const Icon = visual.icon

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
      className={`relative w-60 cursor-pointer rounded-campus-md border-2 bg-campus-surface p-3 shadow-campus-subtle transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
        MILESTONE_STATUS_BORDER[milestone.status]
      } ${selected ? 'ring-2 ring-campus-blue-600 dark:ring-campus-blue-dark' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-campus-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-campus-border" />

      {isCurrentPosition && (
        <span className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full border border-campus-border bg-campus-surface px-1.5 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">
          <MapPin size={10} weight="fill" aria-hidden="true" /> You are here
        </span>
      )}
      {isRecommendedNext && !isCurrentPosition && (
        <span className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full border border-campus-border bg-campus-surface px-1.5 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-amber-600 dark:text-campus-amber-dark">
          <Star size={10} weight="fill" aria-hidden="true" /> Recommended next
        </span>
      )}

      <div className="flex items-start gap-2">
        <Icon size={18} className={`mt-0.5 shrink-0 ${visual.accentClass}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-campus-sans text-campus-sm font-medium text-campus-text">{milestone.title}</p>
          <p className="mt-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
        </div>
        {(milestone.status === 'completed' || milestone.status === 'verified') && (
          <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-campus-green-600 dark:text-campus-green-dark" aria-hidden="true" />
        )}
      </div>

      <p className="mt-2 font-campus-mono text-campus-xs text-campus-muted">{MILESTONE_STATUS_LABELS[milestone.status]}</p>
      {milestone.status === 'blocked' && milestone.blockedReason && (
        <p className="mt-1 line-clamp-2 font-campus-sans text-[11px] text-campus-red-600 dark:text-campus-red-dark">{milestone.blockedReason}</p>
      )}
    </div>
  )
}
