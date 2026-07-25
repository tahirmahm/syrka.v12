import type { CampusUser, OdysseyGenerationResult, OdysseyMilestone, OdysseyPlanVersionTrigger, OdysseyGenerationRequest, OdysseyReplanningRequest } from '@/lib/campus-types'
import { buildOdysseyContext } from './context-builder'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'
import { createDeepSeekOdysseyProvider } from './deepseek-provider'
import { fallbackOdysseyProvider } from './fallback-provider'
import { ODYSSEY_PROVIDER_CONFIG } from './provider'

/**
 * Orchestrates one generation/replan request: builds context, calls the
 * configured provider (falling back to the deterministic typed plan on any
 * failure), and persists only validated, successful results as a new plan
 * version. Nothing here is provider-specific — that lives in
 * deepseek-provider.ts / fallback-provider.ts, both implementing the same
 * OdysseyGenerationProvider contract.
 */

function diffMilestoneIds(previous: OdysseyMilestone[], next: OdysseyMilestone[]) {
  const previousIds = previous.map((m) => m.id)
  const nextIds = next.map((m) => m.id)
  const previousSet = new Set(previousIds)
  const nextSet = new Set(nextIds)
  const previousById = new Map(previous.map((m) => [m.id, m]))

  const added = nextIds.filter((id) => !previousSet.has(id))
  const removed = previousIds.filter((id) => !nextSet.has(id))
  const superseded = next.filter((m) => m.status === 'superseded').map((m) => m.id)
  const changed = nextIds.filter((id) => {
    const prev = previousById.get(id)
    const curr = next.find((m) => m.id === id)
    return Boolean(prev) && Boolean(curr) && JSON.stringify(prev) !== JSON.stringify(curr)
  })
  const reordered = nextIds.filter((id, index) => previousSet.has(id) && previousIds.indexOf(id) !== index)

  return { added, removed, changed, reordered, superseded }
}

async function persistSuccess(
  studentId: string,
  trigger: OdysseyPlanVersionTrigger,
  triggerSummary: string,
  result: OdysseyGenerationResult
): Promise<OdysseyGenerationResult> {
  if (!result.planVersion || !result.milestones) return result

  const previousVersion = await mockOdysseyRepository.getCurrentPlanVersion(studentId)
  const previousMilestones = previousVersion ? await mockOdysseyRepository.getMilestonesForVersion(studentId, previousVersion.id) : []
  const diff = diffMilestoneIds(previousMilestones, result.milestones)

  const committed = await mockOdysseyRepository.commitPlanVersion(studentId, {
    trigger,
    triggerSummary,
    title: result.planVersion.title,
    destinationId: result.planVersion.destinationId,
    reasoningSummary: result.planVersion.reasoningSummary,
    recommendationConfidence: result.planVersion.recommendationConfidence,
    milestones: result.milestones,
    actions: result.actions ?? [],
    evidenceRequirements: result.evidenceRequirements ?? [],
    expectedImpacts: result.expectedImpacts ?? [],
    recommendationFactors: result.recommendationFactors ?? [],
    constraints: result.constraints ?? [],
    blockers: result.blockers ?? [],
    alternativeActions: result.alternativeActions ?? [],
    milestonesAddedIds: diff.added,
    milestonesRemovedIds: diff.removed,
    milestonesReorderedIds: diff.reordered,
    milestonesChangedIds: diff.changed,
    milestonesSupersededIds: diff.superseded,
    validationStatus: 'valid',
    providerStatus: 'ai_generated',
  })

  const persistedMilestones = await mockOdysseyRepository.getMilestonesForVersion(studentId, committed.id)
  return { ...result, planVersion: committed, milestones: persistedMilestones }
}

export async function generateOdysseyPlan(
  user: CampusUser,
  input: Omit<OdysseyGenerationRequest, 'context'>
): Promise<OdysseyGenerationResult> {
  const context = await buildOdysseyContext(user)
  const request: OdysseyGenerationRequest = { context, ...input }

  const useDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY)
  const provider = useDeepSeek ? createDeepSeekOdysseyProvider(ODYSSEY_PROVIDER_CONFIG) : fallbackOdysseyProvider
  let result = await provider.generatePlan(request)

  if (result.status !== 'success' && useDeepSeek) {
    result = await fallbackOdysseyProvider.generatePlan(request)
  }

  if (result.status === 'success') {
    result = await persistSuccess(user.id, 'initial_generation', `Generated toward "${input.destinationTitle}".`, result)
  }

  return result
}

export async function replanOdyssey(user: CampusUser, adjustmentInstruction: string): Promise<OdysseyGenerationResult> {
  const context = await buildOdysseyContext(user)
  const currentPlanVersion = await mockOdysseyRepository.getCurrentPlanVersion(user.id)

  if (!currentPlanVersion) {
    return {
      status: 'validation_failed',
      validation: { valid: false, issues: [{ code: 'no_current_plan', message: 'No current plan to replan from.' }] },
      message: 'Generate an initial Odyssey plan before requesting a replan.',
    }
  }

  const currentMilestones = await mockOdysseyRepository.getMilestonesForVersion(user.id, currentPlanVersion.id)
  const request: OdysseyReplanningRequest = { context, currentPlanVersion, currentMilestones, adjustmentInstruction }

  const useDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY)
  const provider = useDeepSeek ? createDeepSeekOdysseyProvider(ODYSSEY_PROVIDER_CONFIG) : fallbackOdysseyProvider
  let result = await provider.replan(request)

  if (result.status !== 'success' && useDeepSeek) {
    result = await fallbackOdysseyProvider.replan(request)
  }

  if (result.status === 'success') {
    result = await persistSuccess(user.id, 'replan_request', adjustmentInstruction, result)
  }

  return result
}
