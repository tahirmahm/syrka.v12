'use client'

import dynamic from 'next/dynamic'
import type { Node, Edge } from '@xyflow/react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { OdysseyNodeData } from '@/lib/utilities/odyssey-projection'

/**
 * @xyflow/react requires the DOM, so it's dynamically imported with
 * ssr:false — the bundle is only fetched when the roadmap graph view is
 * actually shown, never on unrelated routes or the list-only view.
 */
const OdysseyRoadmapGraph = dynamic(() => import('./OdysseyRoadmapGraph').then((m) => m.OdysseyRoadmapGraph), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full lg:h-[640px]" />,
})

export interface OdysseyRoadmapLoaderProps {
  nodes: Node<OdysseyNodeData>[]
  edges: Edge[]
  selectedMilestoneId?: string
  onSelectMilestone: (milestoneId: string) => void
}

export function OdysseyRoadmapLoader(props: OdysseyRoadmapLoaderProps) {
  return <OdysseyRoadmapGraph {...props} />
}
