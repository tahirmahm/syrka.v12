'use client'

import type { NodeProps, Node } from '@xyflow/react'
import type { DomainLabelNodeData } from '@/lib/utilities/capability-graph-layout'

export function DomainLabelNode({ data }: NodeProps<Node<DomainLabelNodeData>>) {
  return (
    <div className="w-56 font-campus-mono text-campus-xs font-medium uppercase tracking-widest text-campus-muted">
      {data.domain}
    </div>
  )
}
