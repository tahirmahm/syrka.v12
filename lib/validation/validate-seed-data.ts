import type {
  CapabilityDefinition,
  CapabilityClaim,
  CapabilityRelationEdge,
  EvidenceRecord,
  EvidenceReview,
  Passport,
  OdysseyPlan,
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
  Course,
  ProgrammeOutcome,
  ProgrammeCapabilityRelationship,
  AssessmentEvidenceRequirement,
  Cohort,
  CurriculumAlignmentIssue,
  DepartmentIntervention,
  Department,
  Programme,
  GovernancePolicy,
  GovernanceProposal,
  InstitutionalIntervention,
} from '@/lib/campus-types'

export interface SeedDataInput {
  capabilityDefinitions: CapabilityDefinition[]
  capabilityClaims: CapabilityClaim[]
  capabilityRelationEdges: CapabilityRelationEdge[]
  evidenceRecords: EvidenceRecord[]
  evidenceReviews: EvidenceReview[]
  passport: Passport
  odysseyPlan: OdysseyPlan
  odysseyPlanVersions: OdysseyPlanVersion[]
  odysseyMilestones: OdysseyMilestone[]
  odysseyActions: OdysseyAction[]
  odysseyEvidenceRequirements: OdysseyEvidenceRequirement[]
  odysseyExpectedImpacts: OdysseyExpectedImpact[]
  odysseyRecommendationFactors: OdysseyRecommendationFactor[]
  odysseyConstraints: OdysseyConstraint[]
  odysseyBlockers: OdysseyBlocker[]
  odysseyAlternativeActions: OdysseyAlternativeAction[]
  odysseyInstitutionalResources: OdysseyInstitutionalResource[]
  courses: Course[]
  programmeOutcomes: ProgrammeOutcome[]
  programmeCapabilityRelationships: ProgrammeCapabilityRelationship[]
  assessmentEvidenceRequirements: AssessmentEvidenceRequirement[]
  cohorts: Cohort[]
  curriculumAlignmentIssues: CurriculumAlignmentIssue[]
  departmentInterventions: DepartmentIntervention[]
  departments: Department[]
  programmes: Programme[]
  governancePolicies: GovernancePolicy[]
  governanceProposals: GovernanceProposal[]
  institutionalInterventions: InstitutionalIntervention[]
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

  // --- Odyssey ---

  const resourceIds = new Set(data.odysseyInstitutionalResources.map((r) => r.id))
  const actionIds = new Set(data.odysseyActions.map((a) => a.id))
  const evidenceRequirementIds = new Set(data.odysseyEvidenceRequirements.map((r) => r.id))
  const expectedImpactIds = new Set(data.odysseyExpectedImpacts.map((i) => i.id))
  const recommendationFactorIds = new Set(data.odysseyRecommendationFactors.map((f) => f.id))
  const constraintIds = new Set(data.odysseyConstraints.map((c) => c.id))
  const alternativeActionIds = new Set(data.odysseyAlternativeActions.map((a) => a.id))
  const milestoneIds = new Set<string>()
  for (const m of data.odysseyMilestones) {
    if (milestoneIds.has(m.id)) errors.push(`Duplicate Odyssey milestone id "${m.id}"`)
    milestoneIds.add(m.id)
  }
  const planVersionIds = new Set(data.odysseyPlanVersions.map((v) => v.id))

  data.odysseyInstitutionalResources.forEach((r) => r.relatedCapabilityIds.forEach((id) => missingCapability(id, `Odyssey resource "${r.id}"`)))

  for (const action of data.odysseyActions) {
    action.developsCapabilityIds.forEach((id) => missingCapability(id, `Odyssey action "${action.id}"`))
    action.producesEvidenceRequirementIds.forEach((id) => {
      if (!evidenceRequirementIds.has(id)) errors.push(`Odyssey action "${action.id}" references unknown evidence requirement "${id}"`)
    })
    if (action.resourceId && !resourceIds.has(action.resourceId)) errors.push(`Odyssey action "${action.id}" references unknown resource "${action.resourceId}"`)
    if (action.isAiProposed && !action.proposalId) errors.push(`Odyssey action "${action.id}" is AI-proposed but has no proposalId`)
    if (!action.isAiProposed && action.proposalId) errors.push(`Odyssey action "${action.id}" is not AI-proposed but has a proposalId`)
  }

  for (const req of data.odysseyEvidenceRequirements) {
    req.satisfiedByEvidenceIds.forEach((id) => missingEvidence(id, `Odyssey evidence requirement "${req.id}"`))
  }

  for (const impact of data.odysseyExpectedImpacts) {
    missingCapability(impact.capabilityId, `Odyssey expected impact "${impact.id}"`)
  }

  data.odysseyRecommendationFactors.forEach((f) => {
    if (f.relatedCapabilityId) missingCapability(f.relatedCapabilityId, `Odyssey recommendation factor "${f.id}"`)
  })

  for (const alt of data.odysseyAlternativeActions) {
    if (!milestoneIds.has(alt.milestoneId)) errors.push(`Odyssey alternative action "${alt.id}" references unknown milestone "${alt.milestoneId}"`)
  }

  for (const blocker of data.odysseyBlockers) {
    if (!milestoneIds.has(blocker.milestoneId)) errors.push(`Odyssey blocker "${blocker.id}" references unknown milestone "${blocker.milestoneId}"`)
  }

  for (const version of data.odysseyPlanVersions) {
    if (version.planId !== data.odysseyPlan.id) errors.push(`Odyssey plan version "${version.id}" references unknown plan "${version.planId}"`)
    if (version.previousVersionId && !planVersionIds.has(version.previousVersionId)) {
      errors.push(`Odyssey plan version "${version.id}" references unknown previous version "${version.previousVersionId}"`)
    }
    version.milestoneIds.forEach((id) => {
      if (!milestoneIds.has(id)) errors.push(`Odyssey plan version "${version.id}" references unknown milestone "${id}"`)
    })
    for (const idListName of ['milestonesAddedIds', 'milestonesChangedIds', 'milestonesReorderedIds'] as const) {
      version[idListName].forEach((id) => {
        if (!version.milestoneIds.includes(id)) errors.push(`Odyssey plan version "${version.id}" lists "${id}" in ${idListName} but not in milestoneIds`)
      })
    }
  }
  if (!planVersionIds.has(data.odysseyPlan.currentVersionId)) {
    errors.push(`Odyssey plan "${data.odysseyPlan.id}" currentVersionId references unknown version "${data.odysseyPlan.currentVersionId}"`)
  }

  for (const milestone of data.odysseyMilestones) {
    milestone.capabilityIds.forEach((id) => missingCapability(id, `Odyssey milestone "${milestone.id}"`))
    milestone.actionIds.forEach((id) => {
      if (!actionIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown action "${id}"`)
    })
    milestone.evidenceRequirementIds.forEach((id) => {
      if (!evidenceRequirementIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown evidence requirement "${id}"`)
    })
    milestone.expectedImpactIds.forEach((id) => {
      if (!expectedImpactIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown expected impact "${id}"`)
    })
    milestone.alternativeActionIds.forEach((id) => {
      if (!alternativeActionIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown alternative action "${id}"`)
    })
    milestone.constraintIds.forEach((id) => {
      if (!constraintIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown constraint "${id}"`)
    })
    milestone.sourceSignalIds.forEach((id) => {
      if (!recommendationFactorIds.has(id) && !evidenceIds.has(id)) {
        errors.push(`Odyssey milestone "${milestone.id}" references unknown source signal "${id}"`)
      }
    })
    if (!planVersionIds.has(milestone.planVersionId)) {
      errors.push(`Odyssey milestone "${milestone.id}" references unknown plan version "${milestone.planVersionId}"`)
    }
    milestone.prerequisiteMilestoneIds.forEach((id) => {
      if (!milestoneIds.has(id)) errors.push(`Odyssey milestone "${milestone.id}" references unknown prerequisite milestone "${id}"`)
      if (id === milestone.id) errors.push(`Odyssey milestone "${milestone.id}" lists itself as a prerequisite`)
    })
    if (milestone.status === 'blocked' && !milestone.blockedReason) errors.push(`Odyssey milestone "${milestone.id}" is blocked but has no blockedReason`)
    if (milestone.status !== 'blocked' && milestone.blockedReason) errors.push(`Odyssey milestone "${milestone.id}" has a blockedReason but is not blocked`)
    if (milestone.status === 'verified' && milestone.evidenceRequirementIds.some((id) => {
      const req = data.odysseyEvidenceRequirements.find((r) => r.id === id)
      return req && req.satisfiedByEvidenceIds.length === 0
    })) {
      errors.push(`Odyssey milestone "${milestone.id}" is verified but has an unsatisfied evidence requirement`)
    }
  }

  // Circular prerequisite detection (DFS with recursion-stack tracking).
  const milestoneById = new Map(data.odysseyMilestones.map((m) => [m.id, m]))
  const visitState = new Map<string, 'visiting' | 'done'>()
  const reportedCycles = new Set<string>()
  const detectCycle = (id: string, path: string[]) => {
    const state = visitState.get(id)
    if (state === 'done') return
    if (state === 'visiting') {
      const cycleKey = [...path, id].sort().join('>')
      if (!reportedCycles.has(cycleKey)) {
        reportedCycles.add(cycleKey)
        errors.push(`Circular prerequisite chain detected involving milestone "${id}"`)
      }
      return
    }
    visitState.set(id, 'visiting')
    const milestone = milestoneById.get(id)
    milestone?.prerequisiteMilestoneIds.forEach((prereqId) => {
      if (milestoneById.has(prereqId)) detectCycle(prereqId, [...path, id])
    })
    visitState.set(id, 'done')
  }
  data.odysseyMilestones.forEach((m) => detectCycle(m.id, []))

  // --- Department ---

  const courseIds = new Set(data.courses.map((c) => c.id))
  const outcomeIds = new Set(data.programmeOutcomes.map((o) => o.id))
  const cohortIds = new Set(data.cohorts.map((c) => c.id))
  const facultyIds = new Set(['fac-1']) // no separate faculty-directory seed yet; extend when one exists

  const seenOutcomeIds = new Set<string>()
  for (const outcome of data.programmeOutcomes) {
    if (seenOutcomeIds.has(outcome.id)) errors.push(`Duplicate programme outcome id "${outcome.id}"`)
    seenOutcomeIds.add(outcome.id)
    outcome.capabilityIds.forEach((id) => missingCapability(id, `Programme outcome "${outcome.id}"`))
  }

  const seenRelationshipIds = new Set<string>()
  for (const rel of data.programmeCapabilityRelationships) {
    if (seenRelationshipIds.has(rel.id)) errors.push(`Duplicate programme-capability relationship id "${rel.id}"`)
    seenRelationshipIds.add(rel.id)
    if (!courseIds.has(rel.courseId)) errors.push(`Programme-capability relationship "${rel.id}" references unknown course "${rel.courseId}"`)
    if (!outcomeIds.has(rel.outcomeId)) errors.push(`Programme-capability relationship "${rel.id}" references unknown outcome "${rel.outcomeId}"`)
    missingCapability(rel.capabilityId, `Programme-capability relationship "${rel.id}"`)
  }

  const seenAssessmentIds = new Set<string>()
  for (const assessment of data.assessmentEvidenceRequirements) {
    if (seenAssessmentIds.has(assessment.id)) errors.push(`Duplicate assessment evidence requirement id "${assessment.id}"`)
    seenAssessmentIds.add(assessment.id)
    if (!courseIds.has(assessment.courseId)) errors.push(`Assessment evidence requirement "${assessment.id}" references unknown course "${assessment.courseId}"`)
    assessment.capabilityIds.forEach((id) => missingCapability(id, `Assessment evidence requirement "${assessment.id}"`))
  }

  const seenCohortIds = new Set<string>()
  for (const cohort of data.cohorts) {
    if (seenCohortIds.has(cohort.id)) errors.push(`Duplicate cohort id "${cohort.id}"`)
    seenCohortIds.add(cohort.id)
  }

  const seenAlignmentIssueIds = new Set<string>()
  for (const issue of data.curriculumAlignmentIssues) {
    if (seenAlignmentIssueIds.has(issue.id)) errors.push(`Duplicate curriculum alignment issue id "${issue.id}"`)
    seenAlignmentIssueIds.add(issue.id)
    if (!outcomeIds.has(issue.outcomeId)) errors.push(`Curriculum alignment issue "${issue.id}" references unknown outcome "${issue.outcomeId}"`)
    missingCapability(issue.capabilityId, `Curriculum alignment issue "${issue.id}"`)
    issue.affectedCourseIds.forEach((id) => {
      if (!courseIds.has(id)) errors.push(`Curriculum alignment issue "${issue.id}" references unknown course "${id}"`)
    })
    issue.affectedCohortIds.forEach((id) => {
      if (!cohortIds.has(id)) errors.push(`Curriculum alignment issue "${issue.id}" references unknown cohort "${id}"`)
    })
  }

  const validInterventionStatuses = new Set(['planned', 'active', 'awaiting_evaluation', 'complete', 'discontinued'])
  const seenInterventionIds = new Set<string>()
  for (const intervention of data.departmentInterventions) {
    if (seenInterventionIds.has(intervention.id)) errors.push(`Duplicate intervention id "${intervention.id}"`)
    seenInterventionIds.add(intervention.id)
    if (!validInterventionStatuses.has(intervention.status)) errors.push(`Intervention "${intervention.id}" has invalid status "${intervention.status}"`)
    if (intervention.courseId && !courseIds.has(intervention.courseId)) errors.push(`Intervention "${intervention.id}" references unknown course "${intervention.courseId}"`)
    if (intervention.cohortId && !cohortIds.has(intervention.cohortId)) errors.push(`Intervention "${intervention.id}" references unknown cohort "${intervention.cohortId}"`)
    if (!facultyIds.has(intervention.ownerId) && !intervention.ownerId.startsWith('admin-')) {
      errors.push(`Intervention "${intervention.id}" references unknown owner "${intervention.ownerId}"`)
    }
    intervention.capabilityIds.forEach((id) => missingCapability(id, `Intervention "${intervention.id}"`))
    if (!intervention.rationale) errors.push(`Intervention "${intervention.id}" has no rationale`)
    if (!intervention.expectedEffect) errors.push(`Intervention "${intervention.id}" has no expectedEffect`)
  }

  // --- University ---

  const departmentIds = new Set(data.departments.map((d) => d.id))
  const programmeIdsForUniversity = new Set(data.programmes.map((p) => p.id))

  const seenPolicyIds = new Set<string>()
  const validPolicyStates = new Set(['active_policy', 'proposed_policy', 'demo_configuration', 'requires_backend_integration'])
  for (const policy of data.governancePolicies) {
    if (seenPolicyIds.has(policy.id)) errors.push(`Duplicate governance policy id "${policy.id}"`)
    seenPolicyIds.add(policy.id)
    if (!validPolicyStates.has(policy.state)) errors.push(`Governance policy "${policy.id}" has invalid state "${policy.state}"`)
  }

  const seenProposalIds = new Set<string>()
  const validProposalStatuses = new Set(['draft', 'under_review', 'accepted', 'rejected'])
  for (const proposal of data.governanceProposals) {
    if (seenProposalIds.has(proposal.id)) errors.push(`Duplicate governance proposal id "${proposal.id}"`)
    seenProposalIds.add(proposal.id)
    if (!validProposalStatuses.has(proposal.status)) errors.push(`Governance proposal "${proposal.id}" has invalid status "${proposal.status}"`)
  }

  const validInstitutionalStatuses = new Set(['planned', 'active', 'awaiting_evaluation', 'complete', 'discontinued'])
  const seenInstitutionalInterventionIds = new Set<string>()
  for (const intervention of data.institutionalInterventions) {
    if (seenInstitutionalInterventionIds.has(intervention.id)) errors.push(`Duplicate institutional intervention id "${intervention.id}"`)
    seenInstitutionalInterventionIds.add(intervention.id)
    if (!validInstitutionalStatuses.has(intervention.status)) errors.push(`Institutional intervention "${intervention.id}" has invalid status "${intervention.status}"`)
    intervention.affectedDepartmentIds.forEach((id) => {
      if (!departmentIds.has(id)) errors.push(`Institutional intervention "${intervention.id}" references unknown department "${id}"`)
    })
    intervention.affectedProgrammeIds.forEach((id) => {
      if (!programmeIdsForUniversity.has(id)) errors.push(`Institutional intervention "${intervention.id}" references unknown programme "${id}"`)
    })
    intervention.affectedCapabilityIds.forEach((id) => missingCapability(id, `Institutional intervention "${intervention.id}"`))
    intervention.affectedCohortIds.forEach((id) => {
      if (!cohortIds.has(id)) errors.push(`Institutional intervention "${intervention.id}" references unknown cohort "${id}"`)
    })
    if (!intervention.rationale) errors.push(`Institutional intervention "${intervention.id}" has no rationale`)
    if (!intervention.expectedEffect) errors.push(`Institutional intervention "${intervention.id}" has no expectedEffect`)
  }

  return errors
}
