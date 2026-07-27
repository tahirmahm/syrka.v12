import type {
  CampusUser,
  OdysseyGenerationResult,
  OdysseyMilestone,
  OdysseyPlanVersion,
  OdysseyPlanVersionTrigger,
  OdysseyGenerationRequest,
  OdysseyReplanningRequest,
} from '@/lib/campus-types'
import { buildOdysseyContext } from './context-builder'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'
import { createDeepSeekOdysseyProvider } from './deepseek-provider'
import { fallbackOdysseyProvider } from './fallback-provider'
import { ODYSSEY_PROVIDER_CONFIG } from './provider'
import { isSimulationAllowed, parseSimulationKind, simulateGenerationResult } from './simulate'

/**
 * Orchestrates one generation/replan request: builds context, calls the
 * configured provider (falling back to the deterministic typed plan, or to
 * the student's own last valid plan when one already exists, on any
 * failure), and persists only validated, successful results as a new plan
 * version. Nothing here is provider-specific — that lives in
 * deepseek-provider.ts / fallback-provider.ts, both implementing the same
 * OdysseyGenerationProvider contract.
 */

export type GenerationSource = 'deepseek' | 'fallback'

export interface GenerationOutcome {
  result: OdysseyGenerationResult
  source: GenerationSource
  requestDurationMs: number
  /** The original failure status that triggered a fallback, e.g. "timeout" or "validation_failed" — undefined when generation succeeded outright. */
  fallbackReasonCategory?: string
}

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

/** On failure: keep showing the student's own last valid plan (never silently swap it for the generic demo) when one exists. */
async function previousPlanRetainedResult(studentId: string, message: string): Promise<OdysseyGenerationResult | undefined> {
  const currentVersion = await mockOdysseyRepository.getCurrentPlanVersion(studentId)
  if (!currentVersion || currentVersion.providerStatus === 'fallback_typed') return undefined
  const milestones = await mockOdysseyRepository.getMilestonesForVersion(studentId, currentVersion.id)
  return {
    status: 'fallback',
    planVersion: { ...currentVersion, providerStatus: 'previous_preserved' } as OdysseyPlanVersion,
    milestones,
    validation: { valid: true, issues: [] },
    message,
  }
}

function referenceSetsFor(context: OdysseyGenerationRequest['context'], existingMilestoneIds: string[] = []) {
  return {
    capabilityIds: new Set(context.capabilities.map((c) => c.capabilityId)),
    evidenceIds: new Set(context.recentEvidence.map((e) => e.evidenceId)),
    resourceIds: new Set(context.availableResources.map((r) => r.id)),
    existingMilestoneIds: new Set(existingMilestoneIds),
  }
}

export async function generateOdysseyPlan(
  user: CampusUser,
  input: Omit<OdysseyGenerationRequest, 'context'> & { simulate?: unknown }
): Promise<GenerationOutcome> {
  const startedAt = Date.now()
  const context = await buildOdysseyContext(user)
  const request: OdysseyGenerationRequest = { context, ...input }
  const simulateKind = isSimulationAllowed() ? parseSimulationKind(input.simulate) : undefined

  const useDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY)
  const provider = useDeepSeek ? createDeepSeekOdysseyProvider(ODYSSEY_PROVIDER_CONFIG) : fallbackOdysseyProvider
  let source: GenerationSource = useDeepSeek ? 'deepseek' : 'fallback'
  let result = simulateKind ? simulateGenerationResult(simulateKind, referenceSetsFor(context)) : await provider.generatePlan(request)
  let fallbackReasonCategory: string | undefined

  if (result.status !== 'success' && (useDeepSeek || simulateKind)) {
    source = 'fallback'
    fallbackReasonCategory = result.status
    const originalValidation = result.validation
    const originalMessage = result.message
    const fallbackContent = (await previousPlanRetainedResult(user.id, `${originalMessage} Your current plan has not changed.`)) ?? (await fallbackOdysseyProvider.generatePlan(request))
    // Keep the fallback's renderable plan content, but preserve the real diagnostic (validation issues/message) that caused the fallback.
    result = { ...fallbackContent, validation: originalValidation, message: fallbackContent.message ?? originalMessage }
  }

  if (result.status === 'success') {
    result = await persistSuccess(user.id, 'initial_generation', `Generated toward "${input.destinationTitle}".`, result)
  }

  return { result, source, requestDurationMs: Date.now() - startedAt, fallbackReasonCategory }
}

export async function replanOdyssey(
  user: CampusUser,
  adjustmentInstruction: string,
  simulate?: unknown
): Promise<GenerationOutcome> {
  const startedAt = Date.now()
  const context = await buildOdysseyContext(user)
  const currentPlanVersion = await mockOdysseyRepository.getCurrentPlanVersion(user.id)

  if (!currentPlanVersion) {
    return {
      result: {
        status: 'validation_failed',
        validation: { valid: false, issues: [{ code: 'no_current_plan', message: 'No current plan to replan from.' }] },
        message: 'Generate an initial Odyssey plan before requesting a replan.',
      },
      source: 'fallback',
      requestDurationMs: Date.now() - startedAt,
    }
  }

  const currentMilestones = await mockOdysseyRepository.getMilestonesForVersion(user.id, currentPlanVersion.id)
  const request: OdysseyReplanningRequest = { context, currentPlanVersion, currentMilestones, adjustmentInstruction }
  const simulateKind = isSimulationAllowed() ? parseSimulationKind(simulate) : undefined

  const useDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY)
  const provider = useDeepSeek ? createDeepSeekOdysseyProvider(ODYSSEY_PROVIDER_CONFIG) : fallbackOdysseyProvider
  let source: GenerationSource = useDeepSeek ? 'deepseek' : 'fallback'
  let result = simulateKind
    ? simulateGenerationResult(simulateKind, referenceSetsFor(context, currentMilestones.map((m) => m.id)))
    : await provider.replan(request)
  let fallbackReasonCategory: string | undefined

  if (result.status !== 'success' && (useDeepSeek || simulateKind)) {
    source = 'fallback'
    fallbackReasonCategory = result.status
    const originalValidation = result.validation
    const originalMessage = result.message
    const retained = await previousPlanRetainedResult(user.id, `${originalMessage} Your current plan has not changed.`)
    result = retained ? { ...retained, validation: originalValidation, message: retained.message ?? originalMessage } : result
  }

  if (result.status === 'success') {
    result = await persistSuccess(user.id, 'replan_request', adjustmentInstruction, result)
  }

  return { result, source, requestDurationMs: Date.now() - startedAt, fallbackReasonCategory }
}
