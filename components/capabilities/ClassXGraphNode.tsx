'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useRouter } from 'next/navigation'
import type { ClassXGraphNodeData } from '@/lib/utilities/class10-capability-graph-layout'

const KIND_STYLE: Record<string, string> = {
  subject: 'border-campus-border bg-campus-surface-raised',
  chapter: 'border-campus-border bg-campus-surface',
  concept: 'border-campus-blue-600 bg-campus-surface dark:border-campus-blue-dark',
  evidence: 'border-campus-green-600 bg-campus-surface dark:border-campus-green-dark',
  capability: 'border-campus-ink-950 bg-campus-surface dark:border-campus-stone-100',
}

export function ClassXGraphNode({ data, selected }: NodeProps<Node<ClassXGraphNodeData>>) {
  const router = useRouter()
  const clickable = Boolean(data.href)

  function activate() {
    if (data.href) router.push(data.href)
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? activate : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                activate()
              }
            }
          : undefined
      }
      className={`w-48 rounded-campus-md border-2 p-2.5 shadow-campus-subtle ${KIND_STYLE[data.kind]} ${clickable ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600' : ''} ${
        selected ? 'ring-2 ring-campus-blue-600 dark:ring-campus-blue-dark' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-campus-border" />
      <Handle type="source" position={Position.Right} className="!bg-campus-border" />
      <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">{data.kind}</p>
      <p className="mt-0.5 font-campus-sans text-campus-xs font-medium text-campus-text">{data.label}</p>
      {data.sublabel && <p className="mt-0.5 font-campus-mono text-[9px] text-campus-muted">{data.sublabel}</p>}
    </div>
  )
}
