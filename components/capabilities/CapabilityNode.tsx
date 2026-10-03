'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useRouter } from 'next/navigation'
import type { CapabilityNodeData } from '@/lib/utilities/capability-graph-layout'

const MATURITY_TONE: Record<string, string> = {
  Exposed: 'border-campus-stone-300 dark:border-campus-border',
  Emerging: 'border-campus-amber-600 dark:border-campus-amber-dark',
  Developing: 'border-campus-blue-600 dark:border-campus-blue-dark',
  Proficient: 'border-campus-blue-600 dark:border-campus-blue-dark',
  Advanced: 'border-campus-green-600 dark:border-campus-green-dark',
  Expert: 'border-campus-green-600 dark:border-campus-green-dark',
  Stale: 'border-campus-stone-500',
  Revoked: 'border-campus-red-600 dark:border-campus-red-dark',
}

export function CapabilityNode({ data, selected }: NodeProps<Node<CapabilityNodeData>>) {
  const router = useRouter()
  const { definition, claim } = data

  function activate() {
    router.push(`/student/capabilities/${definition.id}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${definition.name}, ${claim ? `${claim.maturity} maturity, ${claim.confidence.band} confidence` : 'no current claim'}. Activate to view detail.`}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      className={`w-56 cursor-pointer rounded-campus-md border-2 bg-campus-surface p-3 shadow-campus-subtle transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
        MATURITY_TONE[claim?.maturity ?? 'Exposed']
      } ${selected ? 'ring-2 ring-campus-blue-600 dark:ring-campus-blue-dark' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-campus-border" />
      <Handle type="source" position={Position.Right} className="!bg-campus-border" />
      <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{definition.name}</p>
      <p className="mt-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
        {claim ? claim.maturity : 'No claim'}
      </p>
      {claim && (
        <p className="mt-1 font-campus-mono text-campus-xs text-campus-muted">
          {claim.confidence.band} · {claim.evidenceCount} evidence
        </p>
      )}
    </div>
  )
}
