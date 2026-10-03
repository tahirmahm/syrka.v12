import type {
  CapabilityDefinition,
  OdysseyMilestone,
  OdysseyAction,
  OdysseyEvidenceRequirement,
  OdysseyExpectedImpact,
  OdysseyAlternativeAction,
  OdysseyBlocker,
} from '@/lib/campus-types'

export interface ResolvedOdysseyMilestone {
  milestone: OdysseyMilestone
  capabilityNames: string[]
  prerequisites: { id: string; title: string }[]
  unlocks: { id: string; title: string }[]
  actions: OdysseyAction[]
  evidenceRequirements: OdysseyEvidenceRequirement[]
  expectedImpacts: (OdysseyExpectedImpact & { capabilityName: string })[]
  alternatives: OdysseyAlternativeAction[]
  blocker?: OdysseyBlocker
}

export interface OdysseyLookupTables {
  capabilityById: Map<string, CapabilityDefinition>
  actionById: Map<string, OdysseyAction>
  evidenceRequirementById: Map<string, OdysseyEvidenceRequirement>
  expectedImpactById: Map<string, OdysseyExpectedImpact>
  alternativesByMilestoneId: Map<string, OdysseyAlternativeAction[]>
  blockersByMilestoneId: Map<string, OdysseyBlocker[]>
}

/** Resolves every milestone's canonical-id references into display-ready data, once, in one place. */
export function resolveMilestones(milestones: OdysseyMilestone[], tables: OdysseyLookupTables): ResolvedOdysseyMilestone[] {
  const milestoneById = new Map(milestones.map((m) => [m.id, m]))
  const dependents = new Map<string, string[]>()
  milestones.forEach((m) =>
    m.prerequisiteMilestoneIds.forEach((prereqId) => {
      dependents.set(prereqId, [...(dependents.get(prereqId) ?? []), m.id])
    })
  )

  return milestones.map((milestone) => ({
    milestone,
    capabilityNames: milestone.capabilityIds.map((id) => tables.capabilityById.get(id)?.name ?? id),
    prerequisites: milestone.prerequisiteMilestoneIds.map((id) => ({ id, title: milestoneById.get(id)?.title ?? id })),
    unlocks: (dependents.get(milestone.id) ?? []).map((id) => ({ id, title: milestoneById.get(id)?.title ?? id })),
    actions: milestone.actionIds.map((id) => tables.actionById.get(id)).filter((a): a is OdysseyAction => Boolean(a)),
    evidenceRequirements: milestone.evidenceRequirementIds
      .map((id) => tables.evidenceRequirementById.get(id))
      .filter((r): r is OdysseyEvidenceRequirement => Boolean(r)),
    expectedImpacts: milestone.expectedImpactIds
      .map((id) => tables.expectedImpactById.get(id))
      .filter((i): i is OdysseyExpectedImpact => Boolean(i))
      .map((i) => ({ ...i, capabilityName: tables.capabilityById.get(i.capabilityId)?.name ?? i.capabilityId })),
    alternatives: tables.alternativesByMilestoneId.get(milestone.id) ?? [],
    blocker: (tables.blockersByMilestoneId.get(milestone.id) ?? [])[0],
  }))
}

/** Deterministic display order: milestones with satisfied prerequisites sort earlier, ties keep array order. */
export function orderMilestonesForDisplay(milestones: OdysseyMilestone[]): OdysseyMilestone[] {
  const byId = new Map(milestones.map((m) => [m.id, m]))
  const depths = new Map<string, number>()
  const resolving = new Set<string>()

  function depthOf(id: string): number {
    if (depths.has(id)) return depths.get(id) as number
    if (resolving.has(id)) return 0
    resolving.add(id)
    const m = byId.get(id)
    const prereqs = m?.prerequisiteMilestoneIds.filter((p) => byId.has(p)) ?? []
    const depth = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(depthOf))
    resolving.delete(id)
    depths.set(id, depth)
    return depth
  }

  milestones.forEach((m) => depthOf(m.id))
  return [...milestones].sort((a, b) => (depths.get(a.id) ?? 0) - (depths.get(b.id) ?? 0))
}
