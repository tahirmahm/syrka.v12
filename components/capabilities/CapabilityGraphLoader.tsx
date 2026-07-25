'use client'

import dynamic from 'next/dynamic'
import type { Node, Edge } from '@xyflow/react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { CapabilityNodeData, DomainLabelNodeData } from '@/lib/utilities/capability-graph-layout'

/**
 * @xyflow/react requires the DOM, so it's dynamically imported with
 * ssr:false — the bundle is only fetched when a user switches to the
 * graph view, never on the default list-view page load.
 */
const CapabilityGraphView = dynamic(() => import('./CapabilityGraphView').then((m) => m.CapabilityGraphView), {
  ssr: false,
  loading: () => <Skeleton className="h-[520px] w-full" />,
})

export function CapabilityGraphLoader({ nodes, edges }: { nodes: Node<CapabilityNodeData | DomainLabelNodeData>[]; edges: Edge[] }) {
  return <CapabilityGraphView nodes={nodes} edges={edges} />
}
