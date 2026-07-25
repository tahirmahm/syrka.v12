import type { Node, Edge } from '@xyflow/react'
import type { OdysseyMilestone, OdysseyDestination, OdysseyAlternativeAction, OdysseyBlocker } from '@/lib/campus-types'
import { getActiveMilestone } from './odyssey'

/**
 * Projects the canonical Odyssey domain model into xyflow nodes/edges.
 * This is a one-way, disposable projection — coordinates, node/edge ids
 * derived here, and any renderer state live only in this layer and are
 * never written back into OdysseyMilestone/OdysseyPlanVersion. A different
 * renderer could replace this file entirely without touching the domain
 * model or the services that produce it.
 *
 * Layout is deterministic: milestone depth = 1 + max(depth of prerequisites),
 * milestones at the same depth are laid out left-to-right in array order,
 * and the destination sits one row below the deepest milestones. No force
 * simulation — the same plan always renders identically.
 */

export interface OdysseyMilestoneNodeData extends Record<string, unknown> {
  kind: 'milestone'
  milestone: OdysseyMilestone
  isCurrentPosition: boolean
  isRecommendedNext: boolean
}

export interface OdysseyDestinationNodeData extends Record<string, unknown> {
  kind: 'destination'
  destination: OdysseyDestination
}

export interface OdysseyAlternativeNodeData extends Record<string, unknown> {
  kind: 'alternative'
  alternative: OdysseyAlternativeAction
}

export type OdysseyNodeData = OdysseyMilestoneNodeData | OdysseyDestinationNodeData | OdysseyAlternativeNodeData

const COLUMN_WIDTH = 280
const ROW_HEIGHT = 170
const ALTERNATIVE_OFFSET_X = 240
const ALTERNATIVE_OFFSET_Y = 90

function computeDepths(milestones: OdysseyMilestone[]): Map<string, number> {
  const byId = new Map(milestones.map((m) => [m.id, m]))
  const depths = new Map<string, number>()
  const resolving = new Set<string>()

  function depthOf(id: string): number {
    if (depths.has(id)) return depths.get(id) as number
    if (resolving.has(id)) return 0 // circular guard — validation should prevent this in practice
    resolving.add(id)
    const milestone = byId.get(id)
    const prereqs = milestone?.prerequisiteMilestoneIds.filter((p) => byId.has(p)) ?? []
    const depth = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(depthOf))
    resolving.delete(id)
    depths.set(id, depth)
    return depth
  }

  milestones.forEach((m) => depthOf(m.id))
  return depths
}

export function buildOdysseyRoadmap(
  milestones: OdysseyMilestone[],
  destination: OdysseyDestination,
  alternatives: OdysseyAlternativeAction[],
  blockers: OdysseyBlocker[]
): { nodes: Node<OdysseyNodeData>[]; edges: Edge[] } {
  const depths = computeDepths(milestones)
  const byDepth = new Map<number, OdysseyMilestone[]>()
  milestones.forEach((m) => {
    const depth = depths.get(m.id) ?? 0
    byDepth.set(depth, [...(byDepth.get(depth) ?? []), m])
  })

  const activeMilestone = getActiveMilestone(milestones)
  const completedIds = new Set(milestones.filter((m) => m.status === 'completed' || m.status === 'verified').map((m) => m.id))
  const maxCompletedDepth = Math.max(-1, ...milestones.filter((m) => completedIds.has(m.id)).map((m) => depths.get(m.id) ?? 0))
  const currentPositionIds = new Set(milestones.filter((m) => completedIds.has(m.id) && (depths.get(m.id) ?? 0) === maxCompletedDepth).map((m) => m.id))

  const nodes: Node<OdysseyNodeData>[] = []
  const edges: Edge[] = []
  const blockersByMilestone = new Map<string, OdysseyBlocker[]>()
  blockers.forEach((b) => blockersByMilestone.set(b.milestoneId, [...(blockersByMilestone.get(b.milestoneId) ?? []), b]))

  const maxDepth = Math.max(0, ...Array.from(byDepth.keys()))

  Array.from(byDepth.entries()).forEach(([depth, group]) => {
    group.forEach((milestone, index) => {
      const x = (index - (group.length - 1) / 2) * COLUMN_WIDTH
      const y = depth * ROW_HEIGHT
      nodes.push({
        id: milestone.id,
        type: 'milestone',
        position: { x, y },
        data: {
          kind: 'milestone',
          milestone,
          isCurrentPosition: currentPositionIds.has(milestone.id),
          isRecommendedNext: activeMilestone?.id === milestone.id,
        },
        draggable: false,
      })

      milestone.prerequisiteMilestoneIds.forEach((prereqId) => {
        edges.push({
          id: `${prereqId}->${milestone.id}`,
          source: prereqId,
          target: milestone.id,
          type: 'smoothstep',
          animated: false,
          style: milestone.status === 'blocked' ? { strokeDasharray: '5 4', stroke: 'var(--campus-red-600, #dc2626)' } : undefined,
        })
      })

      alternatives
        .filter((a) => a.milestoneId === milestone.id)
        .forEach((alt, altIndex) => {
          const altId = `alt-${alt.id}`
          nodes.push({
            id: altId,
            type: 'alternative',
            position: { x: x + ALTERNATIVE_OFFSET_X, y: y + ALTERNATIVE_OFFSET_Y * (altIndex + 1) },
            data: { kind: 'alternative', alternative: alt },
            draggable: false,
          })
          edges.push({
            id: `${milestone.id}->${altId}`,
            source: milestone.id,
            target: altId,
            type: 'smoothstep',
            animated: false,
            style: { strokeDasharray: '3 3' },
          })
        })
    })
  })

  // Destination sits one row below the deepest milestones; every leaf milestone
  // (nothing depends on it) feeds into it, visibly closing the progression.
  const dependedOnIds = new Set(milestones.flatMap((m) => m.prerequisiteMilestoneIds))
  const leafMilestones = milestones.filter((m) => !dependedOnIds.has(m.id))
  const destinationY = (maxDepth + 1) * ROW_HEIGHT

  nodes.push({
    id: 'destination',
    type: 'destination',
    position: { x: 0, y: destinationY },
    data: { kind: 'destination', destination },
    draggable: false,
  })

  leafMilestones.forEach((m) => {
    edges.push({
      id: `${m.id}->destination`,
      source: m.id,
      target: 'destination',
      type: 'smoothstep',
      animated: false,
    })
  })

  return { nodes, edges }
}
