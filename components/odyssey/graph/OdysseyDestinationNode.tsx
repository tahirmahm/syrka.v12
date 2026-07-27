'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { FlagCheckered } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyDestinationNodeData } from '@/lib/utilities/odyssey-projection'

export function OdysseyDestinationNode({ data }: NodeProps<Node<OdysseyDestinationNodeData>>) {
  return (
    <div
      role="group"
      aria-label={`Destination: ${data.destination.title}`}
      className="w-44 rounded-campus-sm border-2 border-campus-blue-600 bg-campus-blue-600/5 p-2.5 text-center shadow-campus-subtle dark:border-campus-blue-dark dark:bg-campus-blue-dark/10"
    >
      <Handle type="target" position={Position.Top} className="!bg-campus-border" />
      <FlagCheckered size={16} className="mx-auto text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" />
      <p className="mt-1 font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Destination</p>
      <p className="mt-0.5 font-campus-sans text-[12px] font-semibold leading-tight text-campus-text">{data.destination.title}</p>
    </div>
  )
}
