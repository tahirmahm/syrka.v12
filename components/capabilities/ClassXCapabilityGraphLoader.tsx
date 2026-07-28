'use client'

import dynamic from 'next/dynamic'
import type { Node, Edge } from '@xyflow/react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ClassXGraphNodeData } from '@/lib/utilities/class10-capability-graph-layout'

const ClassXCapabilityGraphView = dynamic(() => import('./ClassXCapabilityGraphView').then((m) => m.ClassXCapabilityGraphView), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full" />,
})

export function ClassXCapabilityGraphLoader({ nodes, edges }: { nodes: Node<ClassXGraphNodeData>[]; edges: Edge[] }) {
  return <ClassXCapabilityGraphView nodes={nodes} edges={edges} />
}
