import type {
  CapabilityDefinition,
  CapabilityClaim,
  CapabilityRelationEdge,
  EvidenceRecord,
  EvidenceReview,
  OdysseyPlan,
  Passport,
} from '@/lib/campus-types'

export interface SeedDataInput {
  capabilityDefinitions: CapabilityDefinition[]
  capabilityClaims: CapabilityClaim[]
  capabilityRelationEdges: CapabilityRelationEdge[]
  evidenceRecords: EvidenceRecord[]
  evidenceReviews: EvidenceReview[]
  odysseyPlan: OdysseyPlan
  passport: Passport
}

/**
 * Lightweight referential-integrity checks across the mock dataset — not a
 * validation framework, just plain TypeScript assertions over ids that are
 * easy to get out of sync by hand as seed data grows. Returns a list of
 * human-readable problems; empty means the dataset is internally consistent.
 */
export function validateSeedData(data: SeedDataInput): string[] {
  const errors: string[] = []
  const capabilityIds = new Set(data.capabilityDefinitions.map((c) => c.id))
  const evidenceIds = new Set(data.evidenceRecords.map((e) => e.id))
  const reviewedEvidenceIds = new Set(data.evidenceReviews.map((r) => r.evidenceId))

  const missingCapability = (id: string, where: string) => {
    if (!capabilityIds.has(id)) errors.push(`${where} references unknown capability "${id}"`)
  }
  const missingEvidence = (id: string, where: string) => {
    if (!evidenceIds.has(id)) errors.push(`${where} references unknown evidence "${id}"`)
  }

  // Evidence records reference real capabilities, and every record has exactly one review.
  for (const record of data.evidenceRecords) {
    record.capabilityIds.forEach((id) => missingCapability(id, `Evidence record "${record.id}"`))
    if (!reviewedEvidenceIds.has(record.id)) errors.push(`Evidence record "${record.id}" has no review`)
    if (record.supersedesEvidenceId && !evidenceIds.has(record.supersedesEvidenceId)) {
      errors.push(`Evidence record "${record.id}" supersedes unknown evidence "${record.supersedesEvidenceId}"`)
    }
  }
  // Every review points at a real record, exactly once.
  const seenReviewEvidenceIds = new Set<string>()
  for (const review of data.evidenceReviews) {
    missingEvidence(review.evidenceId, `Evidence review "${review.id}"`)
    if (seenReviewEvidenceIds.has(review.evidenceId)) errors.push(`Evidence "${review.evidenceId}" has more than one review`)
    seenReviewEvidenceIds.add(review.evidenceId)
    if (review.status !== 'pending' && !review.reviewedAt) errors.push(`Review "${review.id}" has status "${review.status}" but no reviewedAt`)
    if (review.status === 'pending' && (review.reviewedAt || review.reviewedBy)) errors.push(`Review "${review.id}" is pending but has review metadata set`)
  }

  // Capability claims reference real capabilities and real evidence.
  const claimIdsPerSubject = new Set<string>()
  for (const claim of data.capabilityClaims) {
    missingCapability(claim.capabilityId, `Capability claim "${claim.id}"`)
    claim.evidenceIds.forEach((id) => missingEvidence(id, `Capability claim "${claim.id}"`))
    const key = `${claim.subjectId}:${claim.capabilityId}`
    if (claimIdsPerSubject.has(key)) errors.push(`Duplicate capability claim for subject "${claim.subjectId}" and capability "${claim.capabilityId}"`)
    claimIdsPerSubject.add(key)
    if (claim.maturity === 'Revoked' && claim.evidenceIds.length > 0) errors.push(`Claim "${claim.id}" is Revoked but still lists active evidence`)
  }

  // Relation edges reference real capabilities on both ends.
  for (const edge of data.capabilityRelationEdges) {
    missingCapability(edge.fromCapabilityId, `Relation edge "${edge.id}"`)
    missingCapability(edge.toCapabilityId, `Relation edge "${edge.id}"`)
  }

  // Odyssey milestones reference real capabilities and evidence.
  for (const milestone of data.odysseyPlan.milestones) {
    milestone.requirements.forEach((req) => missingCapability(req.capabilityId, `Odyssey milestone "${milestone.id}"`))
    milestone.requiredEvidenceIds.forEach((id) => missingEvidence(id, `Odyssey milestone "${milestone.id}"`))
    if (milestone.status === 'blocked' && !milestone.blockedReason) errors.push(`Milestone "${milestone.id}" is blocked but has no blockedReason`)
    if (milestone.status !== 'blocked' && milestone.blockedReason) errors.push(`Milestone "${milestone.id}" has a blockedReason but is not blocked`)
  }
  data.odysseyPlan.recommendations.forEach((rec) => {
    missingCapability(rec.capabilityId, `Odyssey recommendation "${rec.id}"`)
    rec.evidenceIds.forEach((id) => missingEvidence(id, `Odyssey recommendation "${rec.id}"`))
  })

  // Passport claims/withheld reference real capabilities and evidence; claim ids unique per version.
  for (const version of data.passport.versions) {
    const seenClaimIds = new Set<string>()
    const claimedCapabilityIds = new Set<string>()
    for (const claim of version.claims) {
      missingCapability(claim.capabilityId, `Passport v${version.version} claim "${claim.id}"`)
      claim.evidenceIds.forEach((id) => missingEvidence(id, `Passport v${version.version} claim "${claim.id}"`))
      if (claim.strongestEvidenceId) missingEvidence(claim.strongestEvidenceId, `Passport v${version.version} claim "${claim.id}"`)
      if (seenClaimIds.has(claim.id)) errors.push(`Duplicate Passport claim id "${claim.id}" in v${version.version}`)
      seenClaimIds.add(claim.id)
      if (claimedCapabilityIds.has(claim.capabilityId)) errors.push(`Capability "${claim.capabilityId}" claimed twice in Passport v${version.version}`)
      claimedCapabilityIds.add(claim.capabilityId)
      if (claim.verificationState === 'revoked' && claim.evidenceIds.length > 0) errors.push(`Passport claim "${claim.id}" is revoked but still lists active evidence`)
    }
    version.withheld.forEach((w) => missingCapability(w.capabilityId, `Passport v${version.version} withheld entry`))
  }

  return errors
}
