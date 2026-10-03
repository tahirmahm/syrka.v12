import type {
  SourceAccount,
  ExternalConnection,
  SourceRefresh,
  SourceRecord,
  ImportedAssertion,
  ProvenanceRecord,
  EvidenceCandidate,
  CapabilityInferenceBasis,
  CapabilityInference,
  IdentityResolution,
  ConflictRecord,
  DuplicateResolution,
  UserConfirmation,
  ReviewRequirement,
  DisclosurePermission,
  PassportProjectionRule,
  PassportEligibilityEvaluation,
  PassportEligibilityState,
  PortfolioSlug,
  PortfolioProfile,
  PortfolioAudience,
  PortfolioPublication,
} from '@/lib/campus-types'
import { computeInferenceConfidence } from '@/lib/services/profile/inference'
import { deriveAuthorityClass } from '@/lib/services/profile/authority'
import { isVisibleToAudience } from '@/lib/services/profile/disclosure'
import { RESERVED_SLUGS, isReservedSlug, validateSlugFormat } from '@/lib/services/profile/reserved-slugs'

export interface ProfileDataInput {
  sourceAccounts: SourceAccount[]
  externalConnections: ExternalConnection[]
  sourceRefreshes: SourceRefresh[]
  sourceRecords: SourceRecord[]
  importedAssertions: ImportedAssertion[]
  provenanceRecords: ProvenanceRecord[]
  evidenceCandidates: EvidenceCandidate[]
  capabilityInferenceBases: CapabilityInferenceBasis[]
  capabilityInferences: CapabilityInference[]
  identityResolutions: IdentityResolution[]
  conflictRecords: ConflictRecord[]
  duplicateResolutions: DuplicateResolution[]
  userConfirmations: UserConfirmation[]
  reviewRequirements: ReviewRequirement[]
  disclosurePermissions: DisclosurePermission[]
  passportProjectionRuleV1: PassportProjectionRule
  passportEligibilityEvaluation: PassportEligibilityEvaluation
  portfolioSlug: PortfolioSlug
  portfolioProfile: PortfolioProfile
  portfolioAudiences: PortfolioAudience[]
  portfolioPublications: PortfolioPublication[]
  /** Native EvidenceRecord ids (lib/mock-data/seed.ts) — checked against EvidenceCandidate.linkedEvidenceRecordId. */
  nativeEvidenceIds?: Set<string>
}

/** Referential integrity across the new entities — every id one entity points at must resolve to a record that actually exists. */
function validateDomainIntegrity(data: ProfileDataInput): string[] {
  const errors: string[] = []
  const sourceRecordIds = new Set(data.sourceRecords.map((r) => r.id))
  const connectionIds = new Set(data.externalConnections.map((c) => c.id))
  const provenanceIds = new Set(data.provenanceRecords.map((p) => p.id))
  const assertionIds = new Set(data.importedAssertions.map((a) => a.id))
  const evidenceCandidateIds = new Set(data.evidenceCandidates.map((c) => c.id))
  const basisIds = new Set(data.capabilityInferenceBases.map((b) => b.id))
  const conflictIds = new Set(data.conflictRecords.map((c) => c.id))
  const inferenceIds = new Set(data.capabilityInferences.map((i) => i.id))

  data.sourceRecords.forEach((r) => {
    if (r.connectionId && !connectionIds.has(r.connectionId)) errors.push(`SourceRecord "${r.id}" references unknown connection "${r.connectionId}"`)
  })
  data.sourceRefreshes.forEach((r) => {
    if (!connectionIds.has(r.connectionId)) errors.push(`SourceRefresh "${r.id}" references unknown connection "${r.connectionId}"`)
  })
  data.importedAssertions.forEach((a) => {
    if (!sourceRecordIds.has(a.sourceRecordId)) errors.push(`ImportedAssertion "${a.id}" references unknown source record "${a.sourceRecordId}"`)
    if (!provenanceIds.has(a.provenanceId)) errors.push(`ImportedAssertion "${a.id}" references unknown provenance "${a.provenanceId}"`)
  })
  data.evidenceCandidates.forEach((c) => {
    if (!c.importedAssertionId && !c.learningOriginId) {
      errors.push(`EvidenceCandidate "${c.id}" has neither importedAssertionId nor learningOriginId — every candidate must declare exactly one origin`)
    }
    if (c.importedAssertionId && c.learningOriginId) {
      errors.push(`EvidenceCandidate "${c.id}" sets both importedAssertionId and learningOriginId — exactly one origin is allowed`)
    }
    if (c.importedAssertionId && !assertionIds.has(c.importedAssertionId)) {
      errors.push(`EvidenceCandidate "${c.id}" references unknown imported assertion "${c.importedAssertionId}"`)
    }
    if (!provenanceIds.has(c.provenanceId)) errors.push(`EvidenceCandidate "${c.id}" references unknown provenance "${c.provenanceId}"`)
    if (c.linkedEvidenceRecordId && data.nativeEvidenceIds && !data.nativeEvidenceIds.has(c.linkedEvidenceRecordId)) {
      errors.push(`EvidenceCandidate "${c.id}" links to unknown native EvidenceRecord "${c.linkedEvidenceRecordId}"`)
    }
  })
  data.capabilityInferenceBases.forEach((b) => {
    if (!evidenceCandidateIds.has(b.evidenceCandidateId)) errors.push(`CapabilityInferenceBasis "${b.id}" references unknown evidence candidate "${b.evidenceCandidateId}"`)
  })
  data.capabilityInferences.forEach((inf) => {
    if (inf.basisIds.length === 0) errors.push(`CapabilityInference "${inf.id}" has no basis records — every inference must show what supports it`)
    inf.basisIds.forEach((id) => {
      if (!basisIds.has(id)) errors.push(`CapabilityInference "${inf.id}" references unknown basis "${id}"`)
    })
    if (!provenanceIds.has(inf.provenanceId)) errors.push(`CapabilityInference "${inf.id}" references unknown provenance "${inf.provenanceId}"`)
  })
  data.conflictRecords.forEach((c) => {
    c.conflictingAssertionIds.forEach((id) => {
      if (!assertionIds.has(id)) errors.push(`ConflictRecord "${c.id}" references unknown assertion "${id}"`)
    })
    if (c.resolutionId && !data.duplicateResolutions.some((r) => r.id === c.resolutionId)) {
      errors.push(`ConflictRecord "${c.id}" references unknown resolution "${c.resolutionId}"`)
    }
  })
  data.duplicateResolutions.forEach((r) => {
    if (!conflictIds.has(r.conflictRecordId)) errors.push(`DuplicateResolution "${r.id}" references unknown conflict "${r.conflictRecordId}"`)
  })
  data.reviewRequirements.forEach((r) => {
    if (r.targetType === 'capability_inference' && !inferenceIds.has(r.targetId)) {
      errors.push(`ReviewRequirement "${r.id}" targets unknown inference "${r.targetId}"`)
    }
  })
  data.disclosurePermissions.forEach((p) => {
    const known = evidenceCandidateIds.has(p.recordId) || assertionIds.has(p.recordId) || inferenceIds.has(p.recordId)
    if (!known) errors.push(`DisclosurePermission "${p.id}" references unknown record "${p.recordId}"`)
  })

  // Required-scenario coverage (Passport Intelligence Checkpoint §7) — a
  // deliberate completeness net so a future edit can't silently drop one of
  // the 15 required demonstration fixtures without a validator noticing.
  const hasMergePreservingBoth = data.duplicateResolutions.some((r) => r.action === 'merge' && r.mergedFromAssertionIds.length >= 2)
  if (!hasMergePreservingBoth) errors.push('No merge DuplicateResolution preserves both original source records — required scenario missing')
  const multiBasisInference = data.capabilityInferences.some((inf) => inf.basisIds.length >= 2)
  if (!multiBasisInference) errors.push('No CapabilityInference has multiple basis records — required scenario missing')
  const hasAmbiguousIdentity = data.identityResolutions.some((r) => r.confidence === 'ambiguous')
  if (!hasAmbiguousIdentity) errors.push('No IdentityResolution demonstrates an ambiguous/awaiting-confirmation identity — required scenario missing')
  if (data.portfolioAudiences.every((a) => a.audienceType !== 'employer')) errors.push('No employer PortfolioAudience defined — required scenario missing')
  if (data.portfolioAudiences.every((a) => a.audienceType !== 'academic_research')) errors.push('No academic/research PortfolioAudience defined — required scenario missing')
  if (!data.portfolioPublications.some((p) => p.unpublishedAt)) errors.push('No unpublished PortfolioPublication defined — required scenario missing')

  return errors
}

/** Recomputes each inference's confidence from its stored basis records and confirms it matches — catches silent drift between fixtures and the deterministic scoring function. */
function validateInferenceDeterminism(data: ProfileDataInput): string[] {
  const errors: string[] = []
  const basisById = new Map(data.capabilityInferenceBases.map((b) => [b.id, b]))
  data.capabilityInferences.forEach((inf) => {
    const bases = inf.basisIds.map((id) => basisById.get(id)).filter((b): b is CapabilityInferenceBasis => Boolean(b))
    const recomputed = computeInferenceConfidence(bases)
    if (Math.abs(recomputed.score - inf.confidence.score) > 1e-9 || recomputed.band !== inf.confidence.band) {
      errors.push(`CapabilityInference "${inf.id}" confidence (${inf.confidence.score}, ${inf.confidence.band}) does not match recomputation from its own basis records (${recomputed.score}, ${recomputed.band})`)
    }
  })
  return errors
}

/** Conflicts must be surfaced, never silently resolved; a merge must preserve every original assertion; authority must never be upgraded by mere repeated self-assertion. */
function validateConflictResolution(data: ProfileDataInput): string[] {
  const errors: string[] = []
  data.conflictRecords.forEach((c) => {
    if (c.resolutionId) {
      const resolution = data.duplicateResolutions.find((r) => r.id === c.resolutionId)
      if (!resolution) {
        errors.push(`ConflictRecord "${c.id}" claims resolution "${c.resolutionId}" but no such DuplicateResolution exists`)
        return
      }
      if (resolution.action === 'merge') {
        const missing = c.conflictingAssertionIds.filter((id) => !resolution.mergedFromAssertionIds.includes(id))
        if (missing.length > 0) errors.push(`DuplicateResolution "${resolution.id}" merges conflict "${c.id}" but drops original assertion(s): ${missing.join(', ')}`)
      }
    }
  })

  const linkedinProvenance = data.provenanceRecords.find((p) => p.id === 'pf-prov-linkedin-employment')
  if (linkedinProvenance) {
    const derived = deriveAuthorityClass(linkedinProvenance.authorityClass, linkedinProvenance.corroboratingSources)
    if (derived === 'externally_verified') {
      errors.push('The LinkedIn employment entry was upgraded to externally_verified from a corroborating source that is not independent — authority must never be raised by mere repetition of the same self-report')
    }
  }
  return errors
}

/** The five required Passport eligibility states must all actually appear in the fixture's evaluation. */
function validatePassportEligibility(data: ProfileDataInput): string[] {
  const errors: string[] = []
  const required: PassportEligibilityState[] = ['eligible', 'awaiting_review', 'stale', 'withheld', 'disputed']
  const present = new Set(Object.values(data.passportEligibilityEvaluation.states))
  required.forEach((state) => {
    if (!present.has(state)) errors.push(`No CapabilityInference resolves to eligibility state "${state}" — required demonstration missing`)
  })
  if (data.passportEligibilityEvaluation.ruleSetVersion !== data.passportProjectionRuleV1.version) {
    errors.push('PassportEligibilityEvaluation.ruleSetVersion does not match the rule set it was supposedly evaluated against')
  }
  return errors
}

/** A record without an explicit allow permission for an audience must never be visible to that audience — no implicit "public unless marked private" default. */
function validateDisclosure(data: ProfileDataInput): string[] {
  const errors: string[] = []
  const privateDiscordCandidate = 'pf-candidate-discord'
  if (isVisibleToAudience(data.disclosurePermissions, privateDiscordCandidate, 'portfolio_public')) {
    errors.push(`"${privateDiscordCandidate}" is visible to portfolio_public despite being the required "excluded from Portfolio publication" fixture`)
  }
  const publiclyVisibleGithub = isVisibleToAudience(data.disclosurePermissions, 'pf-candidate-github', 'portfolio_public')
  if (!publiclyVisibleGithub) {
    errors.push('The GitHub evidence candidate has no portfolio_public disclosure permission — the "employer/academic audience" scenarios have nothing publishable to demonstrate against')
  }
  return errors
}

/** The reserved-slug registry must reject every listed slug and accept the fixture's own claimed slug. */
function validateReservedSlugs(data: ProfileDataInput): string[] {
  const errors: string[] = []
  RESERVED_SLUGS.forEach((slug) => {
    if (!isReservedSlug(slug)) errors.push(`Reserved slug "${slug}" was not flagged as reserved`)
  })
  const ownSlugCheck = validateSlugFormat(data.portfolioSlug.slug)
  if (!ownSlugCheck.valid) errors.push(`Fixture portfolio slug "${data.portfolioSlug.slug}" failed validation: ${ownSlugCheck.reason}`)
  if (data.portfolioSlug.reserved) errors.push(`Fixture portfolio slug "${data.portfolioSlug.slug}" is marked reserved, which would make it unclaimable`)
  return errors
}

/** Aggregates every Stage A validator. Empty return means the dataset is internally consistent. */
export function validateProfileData(data: ProfileDataInput): string[] {
  return [
    ...validateDomainIntegrity(data),
    ...validateInferenceDeterminism(data),
    ...validateConflictResolution(data),
    ...validatePassportEligibility(data),
    ...validateDisclosure(data),
    ...validateReservedSlugs(data),
  ]
}
