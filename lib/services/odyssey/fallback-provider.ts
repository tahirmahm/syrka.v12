import type { OdysseyGenerationRequest, OdysseyReplanningRequest, OdysseyGenerationResult } from '@/lib/campus-types'
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
import {
  class10PlanVersions,
  class10Milestones,
  class10Actions,
  class10EvidenceRequirements,
  class10ExpectedImpacts,
  class10RecommendationFactors,
  class10Constraints,
  class10Blockers,
  class10AlternativeActions,
} from '@/lib/mock-data/odyssey-class10-seed'
import { UNIVERSITY_STAGE_REGRESSION_STUDENT_ID } from '@/lib/repositories/odyssey-repository'

/**
 * The deterministic, typed demonstration plan for whichever fixture set
 * matches the requesting student's stage (Odyssey product correction) —
 * used whenever DeepSeek is unavailable (in this environment, always: no
 * DEEPSEEK_API_KEY is configured, so this deterministic planner is the
 * authorised default, not a degraded fallback). providerStatus stays
 * 'fallback_typed' throughout — the message is honest about "no live AI"
 * without framing deterministic planning as a broken service.
 */
export const fallbackOdysseyProvider: OdysseyGenerationProvider = {
  async generatePlan(request?: OdysseyGenerationRequest) {
    return buildFallbackResult(request?.context.studentId, 'Deterministic demonstration plan — generated from curriculum, learner state, and reviewed Evidence. No live AI model was called.')
  },
  async replan(request?: OdysseyReplanningRequest) {
    return buildFallbackResult(request?.context.studentId, 'Deterministic demonstration plan — your most recent valid plan is shown; no live AI model was called for this adjustment.')
  },
}

function buildFallbackResult(studentId: string | undefined, message: string): OdysseyGenerationResult {
  const isUniversityStageRegression = studentId === UNIVERSITY_STAGE_REGRESSION_STUDENT_ID
  const planVersion = isUniversityStageRegression ? odysseyPlanVersions[0] : class10PlanVersions[0]
  return {
    status: 'fallback',
    planVersion,
    milestones: isUniversityStageRegression ? odysseyMilestones : class10Milestones,
    actions: isUniversityStageRegression ? odysseyActions : class10Actions,
    evidenceRequirements: isUniversityStageRegression ? odysseyEvidenceRequirements : class10EvidenceRequirements,
    expectedImpacts: isUniversityStageRegression ? odysseyExpectedImpacts : class10ExpectedImpacts,
    recommendationFactors: isUniversityStageRegression ? odysseyRecommendationFactors : class10RecommendationFactors,
    constraints: isUniversityStageRegression ? odysseyConstraints : class10Constraints,
    blockers: isUniversityStageRegression ? odysseyBlockers : class10Blockers,
    alternativeActions: isUniversityStageRegression ? odysseyAlternativeActions : class10AlternativeActions,
    validation: { valid: true, issues: [] },
    message,
  }
}
