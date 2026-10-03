import type {
  OdysseyRawProviderResponse,
  OdysseyMilestone,
  OdysseyAction,
  OdysseyEvidenceRequirement,
  OdysseyExpectedImpact,
  OdysseyConstraint,
  OdysseyBlocker,
  ConfidenceBand,
  CapabilityMaturity,
  OdysseyMilestoneStatus,
  OdysseyMilestoneType,
  OdysseyActionType,
  OdysseyConstraintType,
  EvidenceSourceType,
} from '@/lib/campus-types'

export interface MappedPlanContent {
  milestones: OdysseyMilestone[]
  actions: OdysseyAction[]
  evidenceRequirements: OdysseyEvidenceRequirement[]
  expectedImpacts: OdysseyExpectedImpact[]
  constraints: OdysseyConstraint[]
  blockers: OdysseyBlocker[]
}

/**
 * Converts an already-validated raw provider response into canonical Odyssey
 * domain objects. Only ever called after validate-provider-response.ts has
 * confirmed the response is structurally sound and every referenced
 * Capability/Evidence/resource id is real — this function does not
 * re-validate, it only shapes data.
 */
export function mapRawResponseToDomain(
  raw: OdysseyRawProviderResponse,
  opts: { idPrefix: string; resourceIds: Set<string> }
): MappedPlanContent {
  let counter = 0
  const nextId = (kind: string) => `${opts.idPrefix}-${kind}-${++counter}`

  const actions: OdysseyAction[] = []
  const evidenceRequirements: OdysseyEvidenceRequirement[] = []
  const expectedImpacts: OdysseyExpectedImpact[] = []

  const blockers: OdysseyBlocker[] = (raw.blockers ?? []).map((b) => ({
    id: nextId('blocker'),
    milestoneId: b.milestoneId,
    reason: b.reason,
    unblockedBy: b.unblockedBy,
  }))

  const constraints: OdysseyConstraint[] = (raw.constraints ?? []).map((c) => ({
    id: nextId('constraint'),
    type: (c.type as OdysseyConstraintType) ?? 'preference',
    description: c.description,
  }))
  const constraintIds = constraints.map((c) => c.id)

  const milestones: OdysseyMilestone[] = raw.milestones.map((rm) => {
    const evidenceReqIds = rm.evidenceRequirements.map((req) => {
      const id = nextId('evreq')
      evidenceRequirements.push({
        id,
        description: req.description,
        sourceTypeHint: req.sourceTypeHint as EvidenceSourceType | undefined,
        satisfiedByEvidenceIds: [],
      })
      return id
    })

    const impactIds = rm.expectedImpacts.map((impact) => {
      const id = nextId('impact')
      expectedImpacts.push({
        id,
        capabilityId: impact.capabilityId,
        projectedMaturity: impact.projectedMaturity as CapabilityMaturity,
        projectedConfidence: impact.projectedConfidence as ConfidenceBand,
        isProjection: true,
      })
      return id
    })

    const actionIds = rm.actions.map((ra) => {
      const id = nextId('action')
      const isAiProposed = !ra.resourceId || !opts.resourceIds.has(ra.resourceId)
      actions.push({
        id,
        type: ra.type as OdysseyActionType,
        title: ra.title,
        description: ra.description,
        developsCapabilityIds: ra.developsCapabilityIds,
        producesEvidenceRequirementIds: evidenceReqIds,
        requiresReview: ra.requiresReview,
        resourceId: !isAiProposed ? ra.resourceId : undefined,
        isAiProposed,
        proposalId: isAiProposed ? nextId('proposal') : undefined,
      })
      return id
    })

    const milestone: OdysseyMilestone = {
      id: rm.id,
      type: rm.type as OdysseyMilestoneType,
      title: rm.title,
      description: rm.description,
      capabilityIds: rm.capabilityIds,
      prerequisiteMilestoneIds: rm.prerequisiteMilestoneIds,
      targetMaturity: rm.targetMaturity as CapabilityMaturity | undefined,
      targetConfidence: rm.targetConfidence as ConfidenceBand | undefined,
      actionIds,
      evidenceRequirementIds: evidenceReqIds,
      expectedImpactIds: impactIds,
      estimatedEffort: rm.estimatedEffort,
      reasoningSummary: rm.reasoningSummary,
      alternativeActionIds: [],
      constraintIds,
      recommendationConfidence: rm.recommendationConfidence as ConfidenceBand,
      status: rm.status as OdysseyMilestoneStatus,
      sourceSignalIds: [],
      // Filled in by odyssey-repository.commitPlanVersion once the real version id is assigned.
      planVersionId: 'pending',
      blockedReason: rm.blockedReason,
      completionImpact: rm.completionImpact,
    }
    return milestone
  })

  return { milestones, actions, evidenceRequirements, expectedImpacts, constraints, blockers }
}
