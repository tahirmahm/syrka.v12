import type { ConfidenceScore, ConfidenceBand } from './confidence'
import type { CapabilityMaturity } from './capability'

/**
 * Passport — one evidence-backed domain model (ADR-002 §3.19, ONT-001).
 * The Campus student surface presents this as "Academic Passport"
 * (see lib/constants/passport.ts); the underlying type stays generic so a
 * future professional/employer-facing Passport surface can reuse it.
 */
export type PassportClaimVerificationState = 'verified' | 'strong_unverified' | 'supported' | 'stale' | 'revoked'

export interface PassportClaim {
  id: string
  capabilityId: string
  capabilityName: string
  capabilityDomain: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  verificationState: PassportClaimVerificationState
  evidenceIds: string[]
  strongestEvidenceId?: string
  /** Who reviewed/issued this claim, e.g. "Reviewed by Department of Computer Science faculty". */
  issuingContext: string
  limitations?: string
  issuedAt: string
}

/** A capability considered for this version but not included as a claim. */
export interface WithheldCapability {
  capabilityId: string
  capabilityName: string
  reason: string
}

export interface PassportVersion {
  version: number
  issuedAt: string
  reissueReason?: string
  claims: PassportClaim[]
  withheld: WithheldCapability[]
  claimsAddedCapabilityIds: string[]
  claimsUpdatedCapabilityIds: string[]
  claimsRevokedCapabilityIds: string[]
  /**
   * The PassportProjectionRule set and PassportEligibilityEvaluation this
   * version was issued from — an explicit, immutable snapshot. A later
   * change in live eligibility (Passport Intelligence Checkpoint §1) never
   * rewrites this version; see PassportStatusEvent for how staleness,
   * revocation, dispute, and supersession get recorded afterwards instead.
   */
  ruleSetVersion?: string
  eligibilityEvaluationId?: string
}

export interface Passport {
  id: string
  studentId: string
  institutionId: string
  programmeId: string
  departmentId?: string
  currentVersion: number
  versions: PassportVersion[]
  verificationSeal: {
    issuer: string
    verifiedAt: string
  }
}

export type PassportAudience = 'employer' | 'graduate_programme' | 'general' | 'custom'
export type LinkExpiryPreference = 'never' | '7_days' | '30_days' | '90_days'

/**
 * Frontend-only mock disclosure preferences — not persisted to any backend.
 * A distinct entity from Passport itself so "what the student owns" and
 * "how they're currently choosing to share it" don't collapse together.
 */
export interface DisclosureSettings {
  includeIdentity: boolean
  includeCourseContext: boolean
  includeReviewerInfo: boolean
  excludeStaleClaims: boolean
  excludeRevokedClaims: boolean
  audience: PassportAudience
  linkExpiryPreference: LinkExpiryPreference
}

export interface ExternalPassportClaim {
  capabilityName: string
  capabilityDomain: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  verificationState: PassportClaimVerificationState
  evidenceCount: number
  courseContext?: string
  reviewerContext?: string
}

/** Computed, never stored — what an external viewer would see under the current DisclosureSettings. */
export interface ExternalPassportView {
  studentName?: string
  institutionName: string
  programmeName?: string
  version: number
  issuedAt: string
  claims: ExternalPassportClaim[]
  audience: PassportAudience
}

/**
 * Passport Intelligence Checkpoint §1 — the hybrid projection model.
 * A named, versioned rule set the server evaluates against the private
 * Capability Profile (lib/campus-types/profile.ts) to compute live,
 * advisory eligibility. Never applied retroactively to an issued
 * PassportVersion — only to a fresh PassportEligibilityEvaluation.
 */
export interface PassportProjectionRule {
  id: string
  version: string
  description: string
  minimumConfidenceBand: ConfidenceBand
  requiresReview: boolean
  freshnessThresholdDays: number
}

export type PassportEligibilityState = 'eligible' | 'awaiting_review' | 'withheld' | 'stale' | 'disputed' | 'revoked' | 'included'

/**
 * A live, advisory computation of what from the private profile currently
 * qualifies for the Passport — advisory until issuance. Recomputing this
 * never mutates a PassportVersion; a new version is only ever created
 * through explicit student issuance/reissuance.
 */
export interface PassportEligibilityEvaluation {
  id: string
  studentId: string
  evaluatedAt: string
  ruleSetVersion: string
  /** An opaque marker of the private-profile state this evaluation ran against — lets a later evaluation be recognised as stale relative to profile changes. */
  profileRevision: string
  eligibleClaimIds: string[]
  blockedClaimIds: string[]
  /** claimId (or capabilityId, pre-issuance) -> human-readable reason. */
  reasons: Record<string, string>
  requiredReviewIds: string[]
  conflictIds: string[]
  freshnessWarnings: string[]
  /** capabilityId -> current advisory state. */
  states: Record<string, PassportEligibilityState>
}

export type PassportStatusEventType = 'staleness' | 'revocation' | 'dispute' | 'supersession'

/**
 * Records what happened to an issued claim over time without rewriting
 * the historical PassportVersion it was issued in (Checkpoint §1).
 */
export interface PassportStatusEvent {
  id: string
  passportId: string
  version: number
  claimId: string
  type: PassportStatusEventType
  occurredAt: string
  reason: string
}
