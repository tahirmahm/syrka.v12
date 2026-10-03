'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ArrowBendRightDown } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyAlternativeNodeData } from '@/lib/utilities/odyssey-projection'

/** A branch offered to the side of the trunk — deliberately quieter than a milestone marker: hollow dot, dashed connector, muted type. */
export function OdysseyAlternativeNode({ data }: NodeProps<Node<OdysseyAlternativeNodeData>>) {
  return (
    <div role="group" aria-label={`Alternative route: ${data.alternative.title}`} className="flex w-40 items-start gap-1.5 px-1.5 py-1 opacity-80">
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-campus-border" />
      <ArrowBendRightDown size={11} className="mt-0.5 shrink-0 text-campus-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Alternative</p>
        <p className="truncate font-campus-sans text-[11px] text-campus-text">{data.alternative.title}</p>
      </div>
    </div>
  )
}
