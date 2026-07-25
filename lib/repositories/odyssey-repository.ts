import type {
  OdysseyPlan,
  OdysseyDestination,
  OdysseyPlanVersion,
  OdysseyPlanVersionTrigger,
  OdysseyMilestone,
  OdysseyAction,
  OdysseyEvidenceRequirement,
  OdysseyExpectedImpact,
  OdysseyRecommendationFactor,
  OdysseyConstraint,
  OdysseyBlocker,
  OdysseyAlternativeAction,
  OdysseyInstitutionalResource,
  OdysseyValidationStatus,
  OdysseyProviderStatus,
  ConfidenceBand,
} from '@/lib/campus-types'
import {
  odysseyDestination,
  odysseyInstitutionalResources,
  odysseyPlan,
  odysseyPlanVersions,
  odysseyMilestones,
  odysseyActions,
  odysseyEvidenceRequirements,
  odysseyExpectedImpacts,
  odysseyRecommendationFactors,
  odysseyConstraints,
  odysseyBlockers,
  odysseyAlternativeActions,
} from '@/lib/mock-data/odyssey-seed'

/**
 * In-memory, per-student session store. Seeded from the typed fallback plan
 * and grows as generation/replanning produce new validated plan versions.
 * This is deliberately not a database — it is the "session/local demo
 * persistence" option the Odyssey spec allows, and its non-permanence is
 * surfaced honestly in the UI (resets on server restart / new instance).
 */
interface OdysseyStore {
  plan: OdysseyPlan
  destination: OdysseyDestination
  planVersions: Map<string, OdysseyPlanVersion>
  /** Each version keeps its own independent milestone snapshot, so historical versions never mutate under later replans. */
  milestonesByVersion: Map<string, Map<string, OdysseyMilestone>>
  actions: Map<string, OdysseyAction>
  evidenceRequirements: Map<string, OdysseyEvidenceRequirement>
  expectedImpacts: Map<string, OdysseyExpectedImpact>
  recommendationFactors: Map<string, OdysseyRecommendationFactor>
  constraints: Map<string, OdysseyConstraint>
  blockers: Map<string, OdysseyBlocker>
  alternativeActions: Map<string, OdysseyAlternativeAction>
}

const globalStore = globalThis as unknown as { __odysseyStores?: Map<string, OdysseyStore> }
const stores = globalStore.__odysseyStores ?? new Map<string, OdysseyStore>()
globalStore.__odysseyStores = stores

function createSeededStore(): OdysseyStore {
  return {
    plan: { ...odysseyPlan },
    destination: { ...odysseyDestination },
    planVersions: new Map(odysseyPlanVersions.map((v) => [v.id, v])),
    milestonesByVersion: new Map(
      odysseyPlanVersions.map((v) => [v.id, new Map(odysseyMilestones.filter((m) => v.milestoneIds.includes(m.id)).map((m) => [m.id, m]))])
    ),
    actions: new Map(odysseyActions.map((a) => [a.id, a])),
    evidenceRequirements: new Map(odysseyEvidenceRequirements.map((r) => [r.id, r])),
    expectedImpacts: new Map(odysseyExpectedImpacts.map((i) => [i.id, i])),
    recommendationFactors: new Map(odysseyRecommendationFactors.map((f) => [f.id, f])),
    constraints: new Map(odysseyConstraints.map((c) => [c.id, c])),
    blockers: new Map(odysseyBlockers.map((b) => [b.id, b])),
    alternativeActions: new Map(odysseyAlternativeActions.map((a) => [a.id, a])),
  }
}

function getStore(studentId: string): OdysseyStore {
  let store = stores.get(studentId)
  if (!store) {
    store = createSeededStore()
    stores.set(studentId, store)
  }
  return store
}

export interface CommitPlanVersionInput {
  trigger: OdysseyPlanVersionTrigger
  triggerSummary: string
  title: string
  destinationId: string
  destinationTitle?: string
  destinationDescription?: string
  reasoningSummary: string
  recommendationConfidence: ConfidenceBand
  milestones: OdysseyMilestone[]
  actions: OdysseyAction[]
  evidenceRequirements: OdysseyEvidenceRequirement[]
  expectedImpacts: OdysseyExpectedImpact[]
  recommendationFactors: OdysseyRecommendationFactor[]
  constraints: OdysseyConstraint[]
  blockers: OdysseyBlocker[]
  alternativeActions: OdysseyAlternativeAction[]
  milestonesAddedIds: string[]
  milestonesRemovedIds: string[]
  milestonesReorderedIds: string[]
  milestonesChangedIds: string[]
  milestonesSupersededIds: string[]
  validationStatus: OdysseyValidationStatus
  providerStatus: OdysseyProviderStatus
}

export interface OdysseyRepository {
  getPlan(studentId: string): Promise<OdysseyPlan | undefined>
  getDestination(studentId: string): Promise<OdysseyDestination | undefined>
  listPlanVersions(studentId: string): Promise<OdysseyPlanVersion[]>
  getPlanVersion(studentId: string, versionId: string): Promise<OdysseyPlanVersion | undefined>
  getCurrentPlanVersion(studentId: string): Promise<OdysseyPlanVersion | undefined>
  getMilestonesForVersion(studentId: string, versionId: string): Promise<OdysseyMilestone[]>
  getMilestone(studentId: string, milestoneId: string): Promise<OdysseyMilestone | undefined>
  getActionsByIds(studentId: string, ids: string[]): Promise<OdysseyAction[]>
  getEvidenceRequirementsByIds(studentId: string, ids: string[]): Promise<OdysseyEvidenceRequirement[]>
  getExpectedImpactsByIds(studentId: string, ids: string[]): Promise<OdysseyExpectedImpact[]>
  getRecommendationFactorsByIds(studentId: string, ids: string[]): Promise<OdysseyRecommendationFactor[]>
  listRecommendationFactors(studentId: string): Promise<OdysseyRecommendationFactor[]>
  getConstraintsByIds(studentId: string, ids: string[]): Promise<OdysseyConstraint[]>
  listConstraints(studentId: string): Promise<OdysseyConstraint[]>
  getBlockersForMilestones(studentId: string, milestoneIds: string[]): Promise<OdysseyBlocker[]>
  getAlternativeActionsForMilestones(studentId: string, milestoneIds: string[]): Promise<OdysseyAlternativeAction[]>
  listInstitutionalResources(studentId: string): Promise<OdysseyInstitutionalResource[]>
  /** Persists a validated generation/replan result as the new current plan version. Never called with unvalidated content. */
  commitPlanVersion(studentId: string, input: CommitPlanVersionInput): Promise<OdysseyPlanVersion>
}

export const mockOdysseyRepository: OdysseyRepository = {
  async getPlan(studentId) {
    const store = getStore(studentId)
    return store.plan.studentId === studentId ? store.plan : undefined
  },
  async getDestination(studentId) {
    return getStore(studentId).destination
  },
  async listPlanVersions(studentId) {
    return Array.from(getStore(studentId).planVersions.values()).sort((a, b) => a.version - b.version)
  },
  async getPlanVersion(studentId, versionId) {
    return getStore(studentId).planVersions.get(versionId)
  },
  async getCurrentPlanVersion(studentId) {
    const store = getStore(studentId)
    return store.planVersions.get(store.plan.currentVersionId)
  },
  async getMilestonesForVersion(studentId, versionId) {
    const store = getStore(studentId)
    const version = store.planVersions.get(versionId)
    const snapshot = store.milestonesByVersion.get(versionId)
    if (!version || !snapshot) return []
    return version.milestoneIds.map((id) => snapshot.get(id)).filter((m): m is OdysseyMilestone => Boolean(m))
  },
  async getMilestone(studentId, milestoneId) {
    const store = getStore(studentId)
    const currentSnapshot = store.milestonesByVersion.get(store.plan.currentVersionId)
    return currentSnapshot?.get(milestoneId)
  },
  async getActionsByIds(studentId, ids) {
    const store = getStore(studentId)
    return ids.map((id) => store.actions.get(id)).filter((a): a is OdysseyAction => Boolean(a))
  },
  async getEvidenceRequirementsByIds(studentId, ids) {
    const store = getStore(studentId)
    return ids.map((id) => store.evidenceRequirements.get(id)).filter((r): r is OdysseyEvidenceRequirement => Boolean(r))
  },
  async getExpectedImpactsByIds(studentId, ids) {
    const store = getStore(studentId)
    return ids.map((id) => store.expectedImpacts.get(id)).filter((i): i is OdysseyExpectedImpact => Boolean(i))
  },
  async getRecommendationFactorsByIds(studentId, ids) {
    const store = getStore(studentId)
    return ids.map((id) => store.recommendationFactors.get(id)).filter((f): f is OdysseyRecommendationFactor => Boolean(f))
  },
  async listRecommendationFactors(studentId) {
    return Array.from(getStore(studentId).recommendationFactors.values())
  },
  async getConstraintsByIds(studentId, ids) {
    const store = getStore(studentId)
    return ids.map((id) => store.constraints.get(id)).filter((c): c is OdysseyConstraint => Boolean(c))
  },
  async listConstraints(studentId) {
    return Array.from(getStore(studentId).constraints.values())
  },
  async getBlockersForMilestones(studentId, milestoneIds) {
    const set = new Set(milestoneIds)
    return Array.from(getStore(studentId).blockers.values()).filter((b) => set.has(b.milestoneId))
  },
  async getAlternativeActionsForMilestones(studentId, milestoneIds) {
    const set = new Set(milestoneIds)
    return Array.from(getStore(studentId).alternativeActions.values()).filter((a) => set.has(a.milestoneId))
  },
  async listInstitutionalResources() {
    return odysseyInstitutionalResources
  },
  async commitPlanVersion(studentId, input) {
    const store = getStore(studentId)

    if (input.destinationTitle) {
      store.destination = {
        ...store.destination,
        id: input.destinationId,
        title: input.destinationTitle,
        description: input.destinationDescription ?? store.destination.description,
      }
    }

    const previousVersionId = store.plan.currentVersionId
    const nextVersionNumber = Math.max(0, ...Array.from(store.planVersions.values()).map((v) => v.version)) + 1
    const id = `planv-${studentId}-${nextVersionNumber}-${Date.now().toString(36)}`

    store.milestonesByVersion.set(id, new Map(input.milestones.map((m) => [m.id, { ...m, planVersionId: id }])))
    input.actions.forEach((a) => store.actions.set(a.id, a))
    input.evidenceRequirements.forEach((r) => store.evidenceRequirements.set(r.id, r))
    input.expectedImpacts.forEach((i) => store.expectedImpacts.set(i.id, i))
    input.recommendationFactors.forEach((f) => store.recommendationFactors.set(f.id, f))
    input.constraints.forEach((c) => store.constraints.set(c.id, c))
    input.blockers.forEach((b) => store.blockers.set(b.id, b))
    input.alternativeActions.forEach((a) => store.alternativeActions.set(a.id, a))

    const version: OdysseyPlanVersion = {
      id,
      planId: store.plan.id,
      version: nextVersionNumber,
      createdAt: new Date().toISOString(),
      trigger: input.trigger,
      triggerSummary: input.triggerSummary,
      previousVersionId,
      title: input.title,
      destinationId: input.destinationId,
      reasoningSummary: input.reasoningSummary,
      recommendationConfidence: input.recommendationConfidence,
      milestoneIds: input.milestones.map((m) => m.id),
      milestonesAddedIds: input.milestonesAddedIds,
      milestonesRemovedIds: input.milestonesRemovedIds,
      milestonesReorderedIds: input.milestonesReorderedIds,
      milestonesChangedIds: input.milestonesChangedIds,
      milestonesSupersededIds: input.milestonesSupersededIds,
      validationStatus: input.validationStatus,
      providerStatus: input.providerStatus,
    }

    store.planVersions.set(id, version)
    store.plan = { ...store.plan, currentVersionId: id }
    return version
  },
}
