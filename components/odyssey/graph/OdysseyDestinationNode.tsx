'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { FlagCheckered } from '@phosphor-icons/react/dist/ssr'
import type { OdysseyDestinationNodeData } from '@/lib/utilities/odyssey-projection'

/** The roadmap's terminus — a filled marker on the trunk, not a boxed card, so it reads as "where the line ends," not another tile in a grid. */
export function OdysseyDestinationNode({ data }: NodeProps<Node<OdysseyDestinationNodeData>>) {
  return (
    <div role="group" aria-label={`Destination: ${data.destination.title}`} className="flex flex-col items-center gap-1.5 px-1.5 py-1 text-center">
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-campus-border" />
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-campus-blue-600 bg-campus-blue-600 text-campus-white dark:border-campus-blue-dark dark:bg-campus-blue-dark">
        <FlagCheckered size={12} weight="fill" aria-hidden="true" />
      </span>
      <div>
        <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Destination</p>
        <p className="max-w-[160px] font-campus-sans text-[12px] font-semibold leading-tight text-campus-text">{data.destination.title}</p>
      </div>
    </div>
  )
}
