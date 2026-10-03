'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'

export interface OdysseyCollapsedBranchNodeData extends Record<string, unknown> {
  kind: 'collapsed-branch'
  count: number
  onExpand: () => void
}

/** The compact stand-in for a collapsed branch — a count, not a void; clicking (or Enter/Space) reopens it. */
export function OdysseyCollapsedBranchNode({ data }: NodeProps<Node<OdysseyCollapsedBranchNodeData>>) {
  return (
    <div className="flex items-center px-1.5 py-1">
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-campus-border" />
      <button
        type="button"
        onClick={data.onExpand}
        className="flex items-center gap-1 rounded-full border border-dashed border-campus-border px-2 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        aria-label={`Show ${data.count} collapsed alternative ${data.count === 1 ? 'route' : 'routes'}`}
      >
        <CaretDown size={10} aria-hidden="true" />
        {data.count} {data.count === 1 ? 'route' : 'routes'}
      </button>
    </div>
  )
}
