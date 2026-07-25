import type { OdysseyGenerationResult } from '@/lib/campus-types'
import { validateProviderResponse, type ValidationReferenceSets } from './validate-provider-response'

/**
 * A deterministic, server-only way to exercise every failure path through
 * the exact same validation/result pipeline a real provider failure would
 * hit — without touching the real DeepSeek key or waiting for a genuine
 * timeout/outage. Only ever honored when ODYSSEY_ALLOW_SIMULATION=true,
 * which should never be set in a real production environment.
 */
export type SimulationKind =
  | 'malformed_json'
  | 'unknown_capability'
  | 'circular_prerequisite'
  | 'timeout'
  | 'provider_unavailable'
  | 'rate_limited'

const SIMULATION_KINDS: SimulationKind[] = [
  'malformed_json',
  'unknown_capability',
  'circular_prerequisite',
  'timeout',
  'provider_unavailable',
  'rate_limited',
]

export function isSimulationAllowed(): boolean {
  return process.env.ODYSSEY_ALLOW_SIMULATION === 'true'
}

export function parseSimulationKind(value: unknown): SimulationKind | undefined {
  return typeof value === 'string' && (SIMULATION_KINDS as string[]).includes(value) ? (value as SimulationKind) : undefined
}

function circularRaw() {
  const shared = {
    description: 'd',
    actions: [],
    evidenceRequirements: [],
    expectedImpacts: [],
    reasoningSummary: 'r',
    status: 'recommended',
    recommendationConfidence: 'Strong',
    completionImpact: 'c',
    capabilityIds: [],
  }
  return {
    planTitle: 'Simulated plan',
    destinationTitle: 'Simulated destination',
    planSummary: 'Simulated for testing.',
    reasoningSummary: 'Simulated for testing.',
    recommendationConfidence: 'Strong',
    planVersionReason: 'Simulated for testing.',
    milestones: [
      { id: 'sim-a', type: 'course', title: 'Simulated A', prerequisiteMilestoneIds: ['sim-b'], ...shared },
      { id: 'sim-b', type: 'course', title: 'Simulated B', prerequisiteMilestoneIds: ['sim-a'], ...shared },
    ],
  }
}

function unknownCapabilityRaw() {
  return {
    planTitle: 'Simulated plan',
    destinationTitle: 'Simulated destination',
    planSummary: 'Simulated for testing.',
    reasoningSummary: 'Simulated for testing.',
    recommendationConfidence: 'Strong',
    planVersionReason: 'Simulated for testing.',
    milestones: [
      {
        id: 'sim-1',
        type: 'course',
        title: 'Simulated milestone',
        description: 'd',
        capabilityIds: ['cap-does-not-exist'],
        prerequisiteMilestoneIds: [],
        actions: [],
        evidenceRequirements: [],
        expectedImpacts: [],
        reasoningSummary: 'r',
        status: 'recommended',
        recommendationConfidence: 'Strong',
        completionImpact: 'c',
      },
    ],
  }
}

/** Mirrors deepseek-provider.ts's own failure-to-result mapping, without importing it (that module also makes the real network call). */
export function simulateGenerationResult(kind: SimulationKind, refs: ValidationReferenceSets): OdysseyGenerationResult {
  switch (kind) {
    case 'timeout':
      return { status: 'timeout', validation: { valid: false, issues: [] }, message: 'DeepSeek did not respond in time. (simulated)' }
    case 'provider_unavailable':
      return { status: 'provider_unavailable', validation: { valid: false, issues: [] }, message: 'DeepSeek is currently unavailable. (simulated)' }
    case 'rate_limited':
      return { status: 'rate_limited', validation: { valid: false, issues: [] }, message: 'DeepSeek is rate-limiting requests right now. (simulated)' }
    case 'malformed_json': {
      const validation = validateProviderResponse('not a JSON object', refs)
      return { status: 'validation_failed', validation, message: 'DeepSeek returned a plan that did not pass validation, so it was not applied. (simulated)' }
    }
    case 'unknown_capability': {
      const validation = validateProviderResponse(unknownCapabilityRaw(), refs)
      return { status: 'validation_failed', validation, message: 'DeepSeek returned a plan that did not pass validation, so it was not applied. (simulated)' }
    }
    case 'circular_prerequisite': {
      const validation = validateProviderResponse(circularRaw(), refs)
      return { status: 'validation_failed', validation, message: 'DeepSeek returned a plan that did not pass validation, so it was not applied. (simulated)' }
    }
  }
}
