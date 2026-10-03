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
  /** On the single continuous trunk line, vs. a branch offered to the side — the roadmap's central visual distinction (see buildOdysseyRoadmap). */
  isPrimaryPath: boolean
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

const COLUMN_WIDTH = 168
const ROW_HEIGHT = 132
const ALTERNATIVE_OFFSET_X = 176
const ALTERNATIVE_OFFSET_Y = 64

const INACTIVE_STATUSES = new Set(['superseded', 'no_longer_relevant'])

/**
 * Edge semantics (see OdysseyGraphLegend): solid = required prerequisite,
 * dotted = alternative/optional route, muted grey = leads to a superseded
 * or no-longer-relevant milestone, red dashed = leads to a blocked
 * milestone. The trunk (isPrimaryPath) additionally always renders
 * thicker than a branch — line weight carries progression, not just colour.
 */
function prerequisiteEdgeStyle(targetMilestone: OdysseyMilestone, isPrimaryPath: boolean): Pick<Edge, 'style'> {
  const width = isPrimaryPath ? 2.5 : 1.25
  if (targetMilestone.status === 'blocked') {
    return { style: { strokeDasharray: '5 4', stroke: 'var(--campus-red-600, #dc2626)', strokeWidth: width } }
  }
  if (INACTIVE_STATUSES.has(targetMilestone.status)) {
    return { style: { stroke: 'var(--campus-stone-400, #a8a29e)', opacity: 0.45, strokeWidth: Math.max(1, width - 0.5) } }
  }
  return { style: { stroke: 'var(--campus-ink-700, #44403c)', strokeWidth: width } }
}

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

/** Priority order for which milestone anchors the trunk at a given depth — a single continuous spine, not a wide tree. */
const TRUNK_STATUS_PRIORITY: OdysseyMilestone['status'][] = [
  'in_progress',
  'accepted',
  'recommended',
  'verified',
  'completed',
  'evidence_pending',
  'under_review',
  'planned',
  'deferred',
  'blocked',
  'superseded',
  'no_longer_relevant',
]

function pickTrunkMilestone(group: OdysseyMilestone[]): OdysseyMilestone {
  return [...group].sort((a, b) => TRUNK_STATUS_PRIORITY.indexOf(a.status) - TRUNK_STATUS_PRIORITY.indexOf(b.status))[0]
}

/**
 * Groups every branch (non-trunk) milestone under the topmost non-trunk
 * ancestor in its own prerequisite chain — walking up until hitting a
 * trunk milestone or running out of prerequisites. Shared by the desktop
 * graph and the mobile vertical tree so "collapse this branch" means the
 * same set of milestones in both.
 */
export function computeMilestoneBranchGroups(milestones: OdysseyMilestone[], isPrimary: (id: string) => boolean) {
  const byId = new Map(milestones.map((m) => [m.id, m]))
  const rootOf = new Map<string, string>()

  function findRoot(id: string): string {
    if (isPrimary(id)) return id
    const milestone = byId.get(id)
    if (!milestone) return id
    const nonTrunkParentId = milestone.prerequisiteMilestoneIds.find((pid) => !isPrimary(pid) && byId.has(pid))
    return nonTrunkParentId ? findRoot(nonTrunkParentId) : id
  }

  milestones.forEach((m) => {
    if (!isPrimary(m.id)) rootOf.set(m.id, findRoot(m.id))
  })

  const groups = new Map<string, string[]>()
  rootOf.forEach((rootId, memberId) => {
    groups.set(rootId, [...(groups.get(rootId) ?? []), memberId])
  })

  return { rootOf, groups }
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

  // One trunk milestone per depth — the single continuous spine the roadmap
  // reads as a path along, not a tree. Every sibling at that depth is a
  // branch, offered to the side rather than competing for the centre line.
  const trunkIdByDepth = new Map<number, string>()
  byDepth.forEach((group, depth) => trunkIdByDepth.set(depth, pickTrunkMilestone(group).id))
  const isPrimary = (milestone: OdysseyMilestone) => trunkIdByDepth.get(depths.get(milestone.id) ?? 0) === milestone.id

  const nodes: Node<OdysseyNodeData>[] = []
  const edges: Edge[] = []
  const blockersByMilestone = new Map<string, OdysseyBlocker[]>()
  blockers.forEach((b) => blockersByMilestone.set(b.milestoneId, [...(blockersByMilestone.get(b.milestoneId) ?? []), b]))

  const maxDepth = Math.max(0, ...Array.from(byDepth.keys()))

  Array.from(byDepth.entries()).forEach(([depth, group]) => {
    const trunkId = trunkIdByDepth.get(depth)
    let branchIndex = 0
    group.forEach((milestone) => {
      const onTrunk = milestone.id === trunkId
      // The trunk always sits on the centre line (x=0); branches alternate
      // left/right of it, each one column further out than the last.
      let x = 0
      if (!onTrunk) {
        branchIndex += 1
        const side = branchIndex % 2 === 1 ? 1 : -1
        const rank = Math.ceil(branchIndex / 2)
        x = side * rank * COLUMN_WIDTH
      }
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
          isPrimaryPath: onTrunk,
        },
        draggable: false,
      })

      milestone.prerequisiteMilestoneIds.forEach((prereqId) => {
        const prereq = milestones.find((m) => m.id === prereqId)
        const edgeIsPrimary = onTrunk && Boolean(prereq && isPrimary(prereq))
        edges.push({
          id: `${prereqId}->${milestone.id}`,
          source: prereqId,
          target: milestone.id,
          type: 'simplebezier',
          animated: false,
          ...prerequisiteEdgeStyle(milestone, edgeIsPrimary),
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
            type: 'simplebezier',
            animated: false,
            style: { strokeDasharray: '3 3', strokeWidth: 1.1, stroke: 'var(--campus-stone-400, #a8a29e)' },
          })
        })
    })
  })

  // Destination sits one row below the deepest milestones, on the centre
  // line — every leaf milestone (nothing depends on it) feeds into it, the
  // trunk's leaf rendered thicker to keep the progression readable.
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
    const edgeIsPrimary = isPrimary(m)
    edges.push({
      id: `${m.id}->destination`,
      source: m.id,
      target: 'destination',
      type: 'simplebezier',
      animated: false,
      style: INACTIVE_STATUSES.has(m.status)
        ? { stroke: 'var(--campus-stone-400, #a8a29e)', opacity: 0.45, strokeWidth: 1 }
        : { stroke: 'var(--campus-ink-700, #44403c)', strokeWidth: edgeIsPrimary ? 2.5 : 1.25 },
    })
  })

  return { nodes, edges }
}
