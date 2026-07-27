import type { ConfidenceScore } from './confidence'
import type { CapabilityMaturity } from './capability'
import type { LearningEvidenceSubtype } from './learning-evidence'

/**
 * Passport Intelligence — Layer 1, the private Capability Profile
 * (Passport Intelligence & Public Portfolio Architecture Checkpoint §1, §3).
 * Kept entirely separate from EvidenceRecord/EvidenceReview/CapabilityClaim/
 * PassportClaim/OdysseyMilestone (lib/campus-types/{evidence,capability,
 * passport,odyssey}.ts) — those stay exactly as they are. This layer never
 * becomes eligible for the Career Passport or the public Portfolio except
 * through the explicit projection/disclosure models in passport.ts and
 * portfolio.ts. No UnifiedProfile object: each concern below is its own
 * entity, on purpose.
 */

export type SourceCategory = 'campus_learning' | 'odyssey' | 'cv' | 'linkedin' | 'github' | 'google_scholar' | 'discord' | 'user_entered'

export type ConnectionState = 'connected' | 'expired' | 'revoked' | 'error' | 'disconnected'

/** One connected external account. campus_learning/odyssey/user_entered are native and never appear here — they have no external connection to manage. */
export interface ExternalConnection {
  id: string
  studentId: string
  sourceCategory: SourceCategory
  sourceAccountId: string
  state: ConnectionState
  scopeGranted: string[]
  connectedAt: string
  lastRefreshedAt?: string
  disconnectedAt?: string
}

/** The external identity itself, stable across a connection's disconnect/reconnect lifecycle. */
export interface SourceAccount {
  id: string
  sourceCategory: SourceCategory
  /** e.g. a GitHub login, a Scholar author id, a LinkedIn profile URL. */
  externalIdentifier: string
  displayLabel: string
}

export type SourceRefreshStatus = 'success' | 'partial' | 'error'

/** One row per refresh attempt — powers "last refresh" / "imported record count" / "excluded records" in the connector UI (Stage E). */
export interface SourceRefresh {
  id: string
  connectionId: string
  occurredAt: string
  status: SourceRefreshStatus
  recordsAdded: number
  recordsUpdated: number
  recordsRemoved: number
  recordsExcluded: number
  errorMessage?: string
}

/** One raw imported unit exactly as the source represented it, before any ontology mapping. Immutable once captured — a refresh creates a new SourceRecord via supersedesSourceRecordId, never mutates history. */
export interface SourceRecord {
  id: string
  connectionId?: string
  sourceCategory: SourceCategory
  externalRecordId: string
  capturedAt: string
  supersedesSourceRecordId?: string
  raw: Record<string, unknown>
}

export type ImportedAssertionKind =
  | 'identity'
  | 'education'
  | 'employment'
  | 'project'
  | 'certification'
  | 'publication'
  | 'volunteering'
  | 'skill'
  | 'award'
  | 'contribution'
  | 'community_activity'

/** A SourceRecord normalised into Syrka's vocabulary — still just a claim about the world, not yet evaluated against the Capability ontology. */
export interface ImportedAssertion {
  id: string
  studentId: string
  sourceRecordId: string
  kind: ImportedAssertionKind
  label: string
  description?: string
  startDate?: string
  endDate?: string
  provenanceId: string
}

/** An ImportedAssertion proposed as something that could support a Capability. Distinct from EvidenceRecord, which stays reserved for Syrka-native, Faculty-reviewable Evidence — a candidate only becomes real Evidence through the existing native submission flow, never automatically. */
export interface EvidenceCandidate {
  id: string
  studentId: string
  /** Present when this candidate originated from an external-source ImportedAssertion (CV/LinkedIn/GitHub/Scholar/Discord). A Learning-derived candidate instead sets learningOriginId — an AssessmentAttempt or LearningObservation is not an ImportedAssertion, and Learning does not get a parallel inference system to route around this field. */
  importedAssertionId?: string
  /** Present when this candidate originated from Syrka Learning — an AssessmentAttempt.id or LearningObservation.id (lib/campus-types/learning-assessment.ts / learning-observation.ts). Exactly one of importedAssertionId / learningOriginId is set. */
  learningOriginId?: string
  /** Only set alongside learningOriginId — the additional classification Learning needs without a new top-level SourceCategory. */
  learningEvidenceSubtype?: LearningEvidenceSubtype
  proposedCapabilityIds: string[]
  rationale: string
  /** Set only once the student has actually submitted this into the existing native Evidence flow (lib/campus-types/evidence.ts EvidenceRecord.id). */
  linkedEvidenceRecordId?: string
  provenanceId: string
}

/**
 * Authority describes how much an assertion should be trusted; derivation
 * describes how it was produced. These are deliberately two separate axes
 * (Checkpoint §5 correction) — system_inferred is always a derivation type,
 * never itself an authority level, and authority is never upgraded by mere
 * repetition of the same self-report across sources.
 */
export type AuthorityClass = 'institutionally_reviewed' | 'externally_verified' | 'platform_grounded' | 'user_asserted' | 'disputed' | 'unresolved'

export type DerivationType = 'directly_observed' | 'imported' | 'normalised' | 'corroborated' | 'system_inferred' | 'human_reviewed'

export interface CorroboratingSource {
  sourceRecordId: string
  sourceCategory: SourceCategory
  /**
   * True only when this source is independent of the asserting student's
   * own uploads/self-reports — an institutional record, a verified
   * credential issuer, a merged/reviewed GitHub PR, publication metadata.
   * Never true for two self-reported documents describing the same fact
   * (e.g. a CV entry and a LinkedIn entry for the same role) — see
   * lib/services/profile/authority.ts.
   */
  independent: boolean
}

/** Attached to every ImportedAssertion, EvidenceCandidate, and CapabilityInference — never hidden from the owning student. */
export interface ProvenanceRecord {
  id: string
  source: SourceCategory
  sourceIdentifier: string
  /** studentId */
  owner: string
  importMethod: 'oauth_api' | 'user_authorised_export' | 'document_upload' | 'manual_entry' | 'native_syrka'
  importedAt: string
  lastRefreshedAt?: string
  originalUrl?: string
  authorityClass: AuthorityClass
  derivationType: DerivationType
  corroboratingSources: CorroboratingSource[]
  userConfirmationId?: string
  reviewRequirementId?: string
  linkedArtefactIds: string[]
  limitations?: string
  staleAfterDays?: number
  disclosurePermissionIds: string[]
}

/** One piece of concrete support behind an inference — "3 merged PRs with review", never a hidden weight. */
export interface CapabilityInferenceBasis {
  id: string
  description: string
  evidenceCandidateId: string
  weight: 'primary' | 'supporting'
}

/** A proposed relationship between EvidenceCandidates and an existing ontology Capability id — never a bare score. */
export interface CapabilityInference {
  id: string
  studentId: string
  capabilityId: string
  basisIds: string[]
  confidence: ConfidenceScore
  maturityEstimate: CapabilityMaturity
  provenanceId: string
  computedAt: string
}

export type IdentityResolutionConfidence = 'confirmed' | 'likely' | 'ambiguous'

/** Links a SourceAccount to the owning student — critical for Scholar namesake disambiguation and CV-name-vs-handle matching. */
export interface IdentityResolution {
  id: string
  studentId: string
  sourceAccountId: string
  confidence: IdentityResolutionConfidence
  resolvedAt?: string
  resolvedBy?: 'student' | 'system'
}

/** The unresolved-conflict object shown to the user before a DuplicateResolution exists. */
export interface ConflictRecord {
  id: string
  studentId: string
  conflictingAssertionIds: string[]
  description: string
  detectedAt: string
  resolutionId?: string
}

export type DuplicateResolutionAction = 'merge' | 'keep_separate' | 'preferred_value' | 'mark_historical' | 'reject' | 'request_verification'

/** A student's decision on a ConflictRecord. Merging always preserves original provenance — see mergedFromAssertionIds. */
export interface DuplicateResolution {
  id: string
  conflictRecordId: string
  action: DuplicateResolutionAction
  preferredAssertionId?: string
  mergedFromAssertionIds: string[]
  resolvedBy: string
  resolvedAt: string
  note?: string
}

/** The feedback-loop entity the reference paper calls for — required before an imported assertion can influence a CapabilityInference beyond "unconfirmed" weight. */
export interface UserConfirmation {
  id: string
  studentId: string
  targetType: 'imported_assertion' | 'evidence_candidate' | 'capability_inference'
  targetId: string
  action: 'confirmed' | 'corrected' | 'rejected'
  correctedFields?: Record<string, unknown>
  confirmedAt: string
}

/** Mirrors EvidenceReview's existing pending/decided lifecycle for inferences that need human sign-off before reaching human_reviewed authority. */
export interface ReviewRequirement {
  id: string
  targetType: 'evidence_candidate' | 'capability_inference'
  targetId: string
  status: 'pending' | 'satisfied' | 'waived'
  requiredBecause: string
  satisfiedAt?: string
  satisfiedBy?: string
}

export type DisclosureAudience = 'passport' | 'portfolio_employer' | 'portfolio_academic' | 'portfolio_public'

/** The atomic unit both Passport projection and Portfolio publication read from — one row per (record, audience) decision. There is no implicit "public unless marked private" default anywhere in this model. */
export interface DisclosurePermission {
  id: string
  studentId: string
  recordType: 'imported_assertion' | 'evidence_candidate' | 'capability_inference' | 'passport_claim'
  recordId: string
  audience: DisclosureAudience
  allowed: boolean
  setAt: string
}
