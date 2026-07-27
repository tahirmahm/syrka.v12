'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ArrowBendRightDown } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyAlternativeNodeData } from '@/lib/utilities/odyssey-projection'

export function OdysseyAlternativeNode({ data }: NodeProps<Node<OdysseyAlternativeNodeData>>) {
  return (
    <div
      role="group"
      aria-label={`Alternative route: ${data.alternative.title}`}
      className="w-40 rounded-campus-sm border border-dashed border-campus-border bg-campus-surface/60 p-2 opacity-90"
    >
      <Handle type="target" position={Position.Left} className="!bg-campus-border" />
      <div className="flex items-start gap-1.5">
        <ArrowBendRightDown size={12} className="mt-0.5 shrink-0 text-campus-muted" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Alternative</p>
          <p className="truncate font-campus-sans text-[11px] font-medium text-campus-text">{data.alternative.title}</p>
        </div>
      </div>
    </div>
  )
}
