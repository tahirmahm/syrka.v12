import { CONFIDENCE_BANDS } from '@/lib/campus-types'
import type {
  CapabilityInference,
  ProvenanceRecord,
  ReviewRequirement,
  ConflictRecord,
  PassportProjectionRule,
  PassportEligibilityEvaluation,
  PassportEligibilityState,
} from '@/lib/campus-types'

function bandRank(band: string): number {
  return CONFIDENCE_BANDS.findIndex((b) => b.band === band)
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24)
}

export interface EvaluatePassportEligibilityInput {
  studentId: string
  ruleSet: PassportProjectionRule
  profileRevision: string
  inferences: CapabilityInference[]
  provenanceById: Map<string, ProvenanceRecord>
  reviewRequirements: ReviewRequirement[]
  conflicts: ConflictRecord[]
  /** Inference ids currently touched by an unresolved conflict — computed by the caller from ConflictRecord.conflictingAssertionIds -> EvidenceCandidate -> CapabilityInference.basisIds, kept as a plain set here so this function stays a pure, deterministic computation over already-resolved lookups. */
  disputedInferenceIds: Set<string>
  /** Injected rather than read from Date.now() so evaluation is reproducible against fixtures. */
  now: string
}

/**
 * Live, advisory computation of what currently qualifies for the Career
 * Passport (Checkpoint §1). Never mutates a PassportVersion — only ever
 * produces a fresh PassportEligibilityEvaluation. A version is issued only
 * through explicit student action, separately.
 */
export function evaluatePassportEligibility(input: EvaluatePassportEligibilityInput): PassportEligibilityEvaluation {
  const { studentId, ruleSet, profileRevision, inferences, provenanceById, reviewRequirements, conflicts, disputedInferenceIds, now } = input

  const eligibleClaimIds: string[] = []
  const blockedClaimIds: string[] = []
  const reasons: Record<string, string> = {}
  const requiredReviewIds: string[] = []
  const conflictIds = conflicts.filter((c) => !c.resolutionId).map((c) => c.id)
  const freshnessWarnings: string[] = []
  const states: Record<string, PassportEligibilityState> = {}

  const minRank = bandRank(ruleSet.minimumConfidenceBand)

  for (const inference of inferences) {
    const provenance = provenanceById.get(inference.provenanceId)
    const pendingReview = reviewRequirements.find((r) => r.targetType === 'capability_inference' && r.targetId === inference.id && r.status === 'pending')

    if (disputedInferenceIds.has(inference.id)) {
      states[inference.capabilityId] = 'disputed'
      blockedClaimIds.push(inference.capabilityId)
      reasons[inference.capabilityId] = 'An unresolved conflict touches the Evidence behind this inference.'
      continue
    }

    if (bandRank(inference.confidence.band) < minRank) {
      states[inference.capabilityId] = 'withheld'
      blockedClaimIds.push(inference.capabilityId)
      reasons[inference.capabilityId] = `Confidence (${inference.confidence.band}) is below this rule set's minimum (${ruleSet.minimumConfidenceBand}).`
      continue
    }

    if (ruleSet.requiresReview && pendingReview) {
      states[inference.capabilityId] = 'awaiting_review'
      blockedClaimIds.push(inference.capabilityId)
      requiredReviewIds.push(pendingReview.id)
      reasons[inference.capabilityId] = 'Awaiting human review before it can become eligible.'
      continue
    }

    const referenceDate = provenance?.lastRefreshedAt ?? provenance?.importedAt
    if (referenceDate && daysBetween(referenceDate, now) > ruleSet.freshnessThresholdDays) {
      states[inference.capabilityId] = 'stale'
      blockedClaimIds.push(inference.capabilityId)
      freshnessWarnings.push(`${inference.capabilityId} decayed past the ${ruleSet.freshnessThresholdDays}-day freshness threshold.`)
      reasons[inference.capabilityId] = 'Confidence has decayed past the freshness threshold — needs refreshed Evidence.'
      continue
    }

    states[inference.capabilityId] = 'eligible'
    eligibleClaimIds.push(inference.capabilityId)
    reasons[inference.capabilityId] = 'Clears confidence, review, and freshness requirements.'
  }

  return {
    id: `eval-${studentId}-${now}`,
    studentId,
    evaluatedAt: now,
    ruleSetVersion: ruleSet.version,
    profileRevision,
    eligibleClaimIds,
    blockedClaimIds,
    reasons,
    requiredReviewIds,
    conflictIds,
    freshnessWarnings,
    states,
  }
}
