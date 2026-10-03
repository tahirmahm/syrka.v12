import type { CapabilityMaturity } from './capability'
import type { ConfidenceBand } from './confidence'
import type {
  OdysseyPlanVersion,
  OdysseyMilestone,
  OdysseyAction,
  OdysseyEvidenceRequirement,
  OdysseyExpectedImpact,
  OdysseyRecommendationFactor,
  OdysseyConstraint,
  OdysseyBlocker,
  OdysseyAlternativeAction,
  OdysseyInstitutionalResource,
} from './odyssey'

/**
 * AI-provider-facing types — kept in a separate file from the canonical
 * Odyssey domain model (odyssey.ts) on purpose. Nothing here is persisted
 * as plan truth; it only exists to get a validated result INTO the domain
 * model above.
 */

/** Typed, minimal, reviewable input to generation/replanning — never sent verbatim as a prompt. */
export interface OdysseyContext {
  studentId: string
  programmeName: string
  departmentName?: string
  currentStage: string
  completedModuleTitles: string[]
  currentModuleTitles: string[]
  intentSummary: string
  capabilities: {
    capabilityId: string
    name: string
    domain: string
    maturity: CapabilityMaturity
    confidence: ConfidenceBand
    evidenceCount: number
  }[]
  recentEvidence: {
    evidenceId: string
    title: string
    sourceType: string
    reviewStatus: string
    capabilityIds: string[]
  }[]
  unresolvedEvidenceReviewCount: number
  availableResources: OdysseyInstitutionalResource[]
  constraints: OdysseyConstraint[]
  passportReadiness: {
    shareableClaimCount: number
    staleCapabilityNames: string[]
    revokedCapabilityNames: string[]
    withheldCapabilityNames: string[]
  }
  currentPlan?: {
    destinationTitle: string
    milestoneTitles: string[]
  }
}

export interface OdysseyGenerationRequest {
  context: OdysseyContext
  destinationTitle: string
  destinationDescription?: string
  workloadPreference?: 'light' | 'standard' | 'intensive'
  timeHorizon?: string
  preferredActionTypes?: string[]
}

export interface OdysseyReplanningRequest {
  context: OdysseyContext
  currentPlanVersion: OdysseyPlanVersion
  currentMilestones: OdysseyMilestone[]
  adjustmentInstruction: string
}

/**
 * The strict shape DeepSeek is instructed to return, before any validation.
 * Untrusted by construction — never rendered directly, never assumed correct.
 */
export interface OdysseyRawAction {
  type: string
  title: string
  description: string
  developsCapabilityIds: string[]
  requiresReview: boolean
  /** A canonical resource id from the supplied context — omit if none matches. */
  resourceId?: string
}

export interface OdysseyRawMilestone {
  id: string
  type: string
  title: string
  description: string
  capabilityIds: string[]
  prerequisiteMilestoneIds: string[]
  targetMaturity?: string
  targetConfidence?: string
  actions: OdysseyRawAction[]
  evidenceRequirements: { description: string; sourceTypeHint?: string }[]
  expectedImpacts: { capabilityId: string; projectedMaturity: string; projectedConfidence: string }[]
  estimatedEffort?: string
  reasoningSummary: string
  status: string
  recommendationConfidence: string
  blockedReason?: string
  completionImpact: string
}

export interface OdysseyRawProviderResponse {
  planTitle: string
  destinationTitle: string
  destinationDescription?: string
  planSummary: string
  reasoningSummary: string
  recommendationConfidence: string
  planVersionReason: string
  milestones: OdysseyRawMilestone[]
  constraints?: { type: string; description: string }[]
  blockers?: { milestoneId: string; reason: string; unblockedBy?: string }[]
  changeSummary?: string
}

export interface OdysseyValidationIssue {
  code: string
  message: string
  milestoneId?: string
}

export interface OdysseyValidationResult {
  valid: boolean
  issues: OdysseyValidationIssue[]
}

export type OdysseyGenerationStatus =
  | 'success'
  | 'validation_failed'
  | 'provider_unavailable'
  | 'provider_error'
  | 'rate_limited'
  | 'timeout'
  | 'fallback'

/** What the generation/replanning service returns to the API route and, from there, the client. */
export interface OdysseyGenerationResult {
  status: OdysseyGenerationStatus
  planVersion?: OdysseyPlanVersion
  milestones?: OdysseyMilestone[]
  actions?: OdysseyAction[]
  evidenceRequirements?: OdysseyEvidenceRequirement[]
  expectedImpacts?: OdysseyExpectedImpact[]
  recommendationFactors?: OdysseyRecommendationFactor[]
  constraints?: OdysseyConstraint[]
  blockers?: OdysseyBlocker[]
  alternativeActions?: OdysseyAlternativeAction[]
  validation: OdysseyValidationResult
  /** Safe, user-facing summary — never raw provider output or a stack trace. */
  message: string
}
