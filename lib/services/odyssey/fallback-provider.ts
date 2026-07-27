import type { OdysseyGenerationResult } from '@/lib/campus-types'
import type { OdysseyGenerationProvider } from './provider'
import {
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
 * The deterministic, typed demonstration plan — used whenever DeepSeek is
 * unavailable, times out, or its response fails validation. Always honest:
 * providerStatus stays 'fallback_typed', never disguised as AI-generated.
 */
export const fallbackOdysseyProvider: OdysseyGenerationProvider = {
  async generatePlan() {
    return buildFallbackResult('The recommendation service is temporarily unavailable, so a deterministic demonstration plan is shown instead.')
  },
  async replan() {
    return buildFallbackResult('Replanning is temporarily unavailable, so your most recent valid plan is shown instead. No changes were made.')
  },
}

function buildFallbackResult(message: string): OdysseyGenerationResult {
  const planVersion = odysseyPlanVersions[0]
  return {
    status: 'fallback',
    planVersion,
    milestones: odysseyMilestones,
    actions: odysseyActions,
    evidenceRequirements: odysseyEvidenceRequirements,
    expectedImpacts: odysseyExpectedImpacts,
    recommendationFactors: odysseyRecommendationFactors,
    constraints: odysseyConstraints,
    blockers: odysseyBlockers,
    alternativeActions: odysseyAlternativeActions,
    validation: { valid: true, issues: [] },
    message,
  }
}
