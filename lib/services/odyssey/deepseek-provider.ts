import { createDeepSeekClient } from '@/lib/deepseek'
import type { OdysseyGenerationRequest, OdysseyReplanningRequest, OdysseyGenerationResult, OdysseyRawProviderResponse, OdysseyPlanVersion } from '@/lib/campus-types'
import type { OdysseyGenerationProvider, OdysseyProviderConfig } from './provider'
import { OdysseyProviderError } from './errors'
import { buildGenerationPrompt, buildReplanningPrompt } from './prompt-builder'
import { validateProviderResponse } from './validate-provider-response'
import { mapRawResponseToDomain } from './map-raw-response'

/**
 * Calls DeepSeek's OpenAI-compatible chat-completions endpoint and returns
 * parsed (but still untrusted) JSON. Never called from a client component —
 * this module only runs in server routes/services. Reuses the existing
 * lib/deepseek.ts client factory rather than constructing a new SDK client.
 */
async function callDeepSeek(config: OdysseyProviderConfig, systemPrompt: string, userPrompt: string): Promise<unknown> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new OdysseyProviderError('unavailable', 'DeepSeek is not configured on this server.')
  }

  const client = createDeepSeekClient()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const completion = await client.chat.completions.create(
      {
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      { signal: controller.signal }
    )

    const content = completion.choices[0]?.message?.content
    if (!content) throw new OdysseyProviderError('malformed_response', 'Provider returned an empty response.')

    const cleaned = content.replace(/```json|```/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      throw new OdysseyProviderError('malformed_response', 'Provider response could not be parsed as JSON.')
    }
  } catch (error) {
    if (error instanceof OdysseyProviderError) throw error
    if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError') {
      throw new OdysseyProviderError('timeout', 'Provider request timed out.')
    }
    const status = (error as { status?: number } | undefined)?.status
    if (status === 429) throw new OdysseyProviderError('rate_limited', 'Provider rate limit reached.')
    if (typeof status === 'number' && status >= 500) throw new OdysseyProviderError('unavailable', 'Provider is currently unavailable.')
    throw new OdysseyProviderError('unknown', 'Provider request failed.')
  } finally {
    clearTimeout(timeoutHandle)
  }
}

function resultFromValidation(
  raw: unknown,
  resourceIds: Set<string>,
  capabilityIds: Set<string>,
  evidenceIds: Set<string>,
  existingMilestoneIds: Set<string>,
  idPrefix: string
): OdysseyGenerationResult {
  const validation = validateProviderResponse(raw, { capabilityIds, evidenceIds, resourceIds, existingMilestoneIds })
  if (!validation.valid) {
    return {
      status: 'validation_failed',
      validation,
      message: 'DeepSeek returned a plan that did not pass validation, so it was not applied.',
    }
  }

  const response = raw as OdysseyRawProviderResponse
  const mapped = mapRawResponseToDomain(response, { idPrefix, resourceIds })

  const draftVersion: Partial<OdysseyPlanVersion> = {
    title: response.planTitle,
    destinationId: 'pending',
    reasoningSummary: response.reasoningSummary,
    recommendationConfidence: response.recommendationConfidence as OdysseyPlanVersion['recommendationConfidence'],
  }

  return {
    status: 'success',
    // planVersion is intentionally partial here — generation-service.ts persists it via
    // the repository (which assigns id/version/createdAt) and replaces this draft.
    planVersion: draftVersion as OdysseyPlanVersion,
    milestones: mapped.milestones,
    actions: mapped.actions,
    evidenceRequirements: mapped.evidenceRequirements,
    expectedImpacts: mapped.expectedImpacts,
    constraints: mapped.constraints,
    blockers: mapped.blockers,
    alternativeActions: [],
    validation,
    message: response.planSummary,
  }
}

export function createDeepSeekOdysseyProvider(config: OdysseyProviderConfig): OdysseyGenerationProvider {
  return {
    async generatePlan(request: OdysseyGenerationRequest) {
      const capabilityIds = new Set(request.context.capabilities.map((c) => c.capabilityId))
      const evidenceIds = new Set(request.context.recentEvidence.map((e) => e.evidenceId))
      const resourceIds = new Set(request.context.availableResources.map((r) => r.id))

      try {
        const { system, user } = buildGenerationPrompt(request)
        const raw = await callDeepSeek(config, system, user)
        const result = resultFromValidation(raw, resourceIds, capabilityIds, evidenceIds, new Set(), `gen-${request.context.studentId}-${Date.now().toString(36)}`)
        if (result.status === 'success' && result.planVersion) {
          result.planVersion.destinationId = 'dest-1'
        }
        return result
      } catch (error) {
        return providerErrorToResult(error)
      }
    },
    async replan(request: OdysseyReplanningRequest) {
      const capabilityIds = new Set(request.context.capabilities.map((c) => c.capabilityId))
      const evidenceIds = new Set(request.context.recentEvidence.map((e) => e.evidenceId))
      const resourceIds = new Set(request.context.availableResources.map((r) => r.id))
      const existingMilestoneIds = new Set(request.currentMilestones.map((m) => m.id))

      try {
        const { system, user } = buildReplanningPrompt(request)
        const raw = await callDeepSeek(config, system, user)
        const result = resultFromValidation(
          raw,
          resourceIds,
          capabilityIds,
          evidenceIds,
          existingMilestoneIds,
          `replan-${request.context.studentId}-${Date.now().toString(36)}`
        )
        if (result.status === 'success' && result.planVersion) {
          result.planVersion.destinationId = request.currentPlanVersion.destinationId
        }
        return result
      } catch (error) {
        return providerErrorToResult(error)
      }
    },
  }
}

function providerErrorToResult(error: unknown): OdysseyGenerationResult {
  const kind = error instanceof OdysseyProviderError ? error.kind : 'unknown'
  const status = kind === 'timeout' ? 'timeout' : kind === 'rate_limited' ? 'rate_limited' : kind === 'unavailable' ? 'provider_unavailable' : 'provider_error'
  const messages: Record<typeof status, string> = {
    timeout: 'DeepSeek did not respond in time.',
    rate_limited: 'DeepSeek is rate-limiting requests right now.',
    provider_unavailable: 'DeepSeek is currently unavailable.',
    provider_error: 'DeepSeek could not generate a plan right now.',
  }
  return { status, validation: { valid: false, issues: [] }, message: messages[status] }
}
