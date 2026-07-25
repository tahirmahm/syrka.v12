import type {
  InstitutionalDepartmentSummary,
  DepartmentInstitutionalDetail,
  ProgrammePortfolioEntry,
  InstitutionalCapabilityStrategy,
  CapabilityArchitectureLayer,
  EvidenceGovernanceSummary,
  InstitutionalFacultyCapacitySummary,
  FacultyCapacityRow,
  InstitutionalCohortSummary,
  OdysseyAggregateInsight,
  PassportReadinessAggregate,
  PassportIssuanceStageCount,
  GovernancePolicy,
  GovernanceProposal,
  InstitutionalIntervention,
  CreateInstitutionalInterventionInput,
  InstitutionalPriority,
  UniversityAnalyticsResult,
} from '@/lib/campus-types'
import { institution, department, programme, courses, capabilityClaims, evidenceReviews, currentUser, passport } from '@/lib/mock-data/seed'
import { curriculumAlignmentIssues } from '@/lib/mock-data/department-seed'
import { governancePolicies, governanceProposals, institutionalInterventions } from '@/lib/mock-data/university-seed'
import { mockDepartmentRepository } from '@/lib/repositories/department-repository'
import { mockCapabilityRepository } from '@/lib/repositories/capability-repository'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'
import { mockPassportRepository } from '@/lib/repositories/passport-repository'
import { mockInstitutionRepository } from '@/lib/repositories/institution-repository'

/**
 * Session-scoped demo persistence for institutional interventions — same
 * disclosed pattern as department-repository.ts. Keyed by institution id.
 */
interface UniversityStore {
  interventionsById: Map<string, InstitutionalIntervention>
}

const globalStore = globalThis as unknown as { __universityStores?: Map<string, UniversityStore> }
const stores: Map<string, UniversityStore> = globalStore.__universityStores ?? new Map()
globalStore.__universityStores = stores

function getStore(institutionId: string): UniversityStore {
  let store = stores.get(institutionId)
  if (!store) {
    store = { interventionsById: new Map(institutionalInterventions.map((i) => [i.id, i])) }
    stores.set(institutionId, store)
  }
  return store
}

// This demo institution models exactly one department, one programme, and
// one real student across every Campus domain (see department-repository.ts's
// identical disclosure) — every institution-wide rollup below is honestly
// derived from that single real department rather than padded with
// fabricated peers, while the loops themselves are written generically over
// institution.departments so a multi-department institution works unchanged.

async function departmentSummaryFor(departmentId: string): Promise<InstitutionalDepartmentSummary | undefined> {
  const dept = await mockInstitutionRepository.getDepartment(departmentId)
  if (!dept) return undefined
  const [programmeHealth, capabilityIntel, reviewCapacity, interventions] = await Promise.all([
    mockDepartmentRepository.listProgrammeHealth(departmentId),
    mockDepartmentRepository.getCapabilityIntelligence(departmentId),
    mockDepartmentRepository.getReviewCapacitySummary(departmentId),
    mockDepartmentRepository.listInterventions(departmentId),
  ])
  const cohortsForDept = (await Promise.all(dept.programmeIds.map((id) => mockDepartmentRepository.listCohorts(id)))).flat()
  const flagsForDept = (await Promise.all(cohortsForDept.map((c) => mockDepartmentRepository.listCohortStudentFlags(c.id)))).flat()

  const observedCoveragePercent = programmeHealth.length > 0 ? Math.round(programmeHealth.reduce((sum, p) => sum + p.observedCapabilityCoveragePercent, 0) / programmeHealth.length) : 0
  const studentCount = new Set(cohortsForDept.flatMap((c) => c.studentIds)).size

  return {
    departmentId: dept.id,
    departmentName: dept.name,
    programmeCount: dept.programmeIds.length,
    studentCount,
    facultyCount: 1,
    intendedCapabilityCount: programmeHealth.reduce((sum, p) => sum + p.intendedCapabilityCount, 0),
    observedCapabilityCoveragePercent: observedCoveragePercent,
    evidenceHealthLabel: programmeHealth.some((p) => p.reviewHealth === 'at_risk') ? 'at_risk' : programmeHealth.some((p) => p.reviewHealth === 'attention_needed') ? 'attention_needed' : 'on_track',
    reviewCapacityConstrained: reviewCapacity.totalOverdueReviews > 0,
    passportReadinessBlockerCount: flagsForDept.reduce((sum, f) => sum + f.passportReadinessBlockerCount, 0),
    odysseyBlockerCount: flagsForDept.reduce((sum, f) => sum + f.odysseyBlockerCount, 0),
    activeInterventionCount: interventions.filter((i) => i.status === 'active' || i.status === 'planned').length,
    governanceConcernCount: capabilityIntel.staleClaimCount + capabilityIntel.revokedClaimCount,
  }
}

export interface UniversityRepository {
  getPriorities(institutionId: string): Promise<InstitutionalPriority[]>
  listDepartmentSummaries(institutionId: string): Promise<InstitutionalDepartmentSummary[]>
  getDepartmentDetail(departmentId: string): Promise<DepartmentInstitutionalDetail | undefined>
  listProgrammePortfolio(institutionId: string): Promise<ProgrammePortfolioEntry[]>
  getCapabilityStrategy(institutionId: string): Promise<InstitutionalCapabilityStrategy>
  getCapabilityArchitectureLayers(): Promise<CapabilityArchitectureLayer[]>
  getEvidenceGovernance(institutionId: string): Promise<EvidenceGovernanceSummary>
  getFacultyCapacity(institutionId: string): Promise<InstitutionalFacultyCapacitySummary>
  listInstitutionalCohorts(institutionId: string): Promise<InstitutionalCohortSummary[]>
  getOdysseyAggregateInsight(institutionId: string): Promise<OdysseyAggregateInsight>
  getPassportReadinessAggregate(institutionId: string): Promise<PassportReadinessAggregate>
  getPassportIssuanceStages(institutionId: string): Promise<PassportIssuanceStageCount[]>
  listGovernancePolicies(): Promise<GovernancePolicy[]>
  listGovernanceProposals(): Promise<GovernanceProposal[]>
  getAnalytics(institutionId: string): Promise<UniversityAnalyticsResult>
  listInterventions(institutionId: string): Promise<InstitutionalIntervention[]>
  createIntervention(institutionId: string, input: CreateInstitutionalInterventionInput): Promise<InstitutionalIntervention>
}

export const mockUniversityRepository: UniversityRepository = {
  async getPriorities(institutionId) {
    if (institution.id !== institutionId) return []
    const priorities: InstitutionalPriority[] = []
    const deptPriorities = await mockDepartmentRepository.getPriorities(department.id)

    for (const p of deptPriorities.filter((p) => p.urgency === 'high')) {
      priorities.push({
        id: `uni-${p.id}`,
        title: p.summary,
        rationale: p.detail,
        supportingSignals: [`Department of ${department.name}`],
        urgency: 'high',
        affectedDepartmentIds: [department.id],
        owner: 'Jordan Reyes',
        recommendedIntervention: 'Review with the affected department and consider an institutional intervention if the pattern recurs across departments.',
        expectedEffect: 'Projected — resolving the underlying department-level issue would remove this institutional priority.',
        reviewState: 'identified',
        limitations: 'This institution models a single department, so institution-wide prevalence cannot yet be confirmed.',
        actionHref: `/university/departments/${department.id}`,
      })
    }

    const proposalsUnderReview = governanceProposals.filter((p) => p.status === 'under_review')
    for (const proposal of proposalsUnderReview) {
      priorities.push({
        id: `uni-proposal-${proposal.id}`,
        title: `Governance proposal awaiting decision: ${proposal.title}`,
        rationale: proposal.rationale,
        supportingSignals: [`Proposed by ${proposal.proposedBy}`],
        urgency: 'medium',
        affectedDepartmentIds: [],
        owner: proposal.proposedBy,
        recommendedIntervention: 'Review and accept or reject the proposal in Governance.',
        expectedEffect: 'Projected — depends on the resulting policy decision.',
        reviewState: 'identified',
        limitations: 'Demo governance workflow; decisions are not yet persisted.',
        actionHref: '/university/governance',
      })
    }

    const activeInstitutional = Array.from(getStore(institutionId).interventionsById.values()).filter((i) => i.status === 'active' || i.status === 'planned')
    if (activeInstitutional.length > 0) {
      priorities.push({
        id: 'uni-interventions',
        title: `${activeInstitutional.length} institutional intervention${activeInstitutional.length === 1 ? '' : 's'} in progress`,
        rationale: activeInstitutional.map((i) => i.title).join(', '),
        supportingSignals: activeInstitutional.map((i) => i.title),
        urgency: 'low',
        affectedDepartmentIds: Array.from(new Set(activeInstitutional.flatMap((i) => i.affectedDepartmentIds))),
        owner: activeInstitutional[0].ownerName,
        recommendedIntervention: 'Continue tracking through to each review date.',
        expectedEffect: 'Projected — see each intervention for its stated expected effect.',
        reviewState: 'intervention_active',
        limitations: 'Session-only demo state.',
        actionHref: '/university/analytics',
      })
    }

    return priorities
  },

  async listDepartmentSummaries(institutionId) {
    if (institution.id !== institutionId) return []
    const results = await Promise.all(institution.departments.map((id) => departmentSummaryFor(id)))
    return results.filter((r): r is InstitutionalDepartmentSummary => Boolean(r))
  },

  async getDepartmentDetail(departmentId) {
    const summary = await departmentSummaryFor(departmentId)
    if (!summary) return undefined
    const [capabilityIntel, programmeHealth] = await Promise.all([
      mockDepartmentRepository.getCapabilityIntelligence(departmentId),
      mockDepartmentRepository.listProgrammeHealth(departmentId),
    ])
    const affecting = Array.from(getStore(institution.id).interventionsById.values()).filter((i) => i.affectedDepartmentIds.includes(departmentId))
    const escalations = governanceProposals.filter((p) => p.status === 'under_review').map((p) => `${p.title} (${p.area.replace(/_/g, ' ')})`)

    return {
      ...summary,
      expectedCapabilityCoveragePercent: 50,
      sharedCapabilityGapNames: capabilityIntel.recommendedAttentionAreas,
      crossDepartmentDependencyNotes: ['This institution models a single department in this demo, so cross-department dependencies are not yet observable — the structure is ready for a second department to be added.'],
      programmesRequiringSupport: programmeHealth.filter((p) => p.reviewHealth !== 'on_track').map((p) => ({ programmeId: p.programmeId, programmeName: p.programmeName, reason: p.reviewHealth === 'at_risk' ? 'Review bottleneck identified' : 'Unresolved Evidence accumulating' })),
      institutionalInterventionsAffecting: affecting.map((i) => i.title),
      governanceEscalations: escalations,
    }
  },

  async listProgrammePortfolio(institutionId) {
    if (institution.id !== institutionId) return []
    const entries: ProgrammePortfolioEntry[] = []
    for (const departmentId of institution.departments) {
      const dept = await mockInstitutionRepository.getDepartment(departmentId)
      if (!dept) continue
      const [programmeHealth, allInterventions] = await Promise.all([mockDepartmentRepository.listProgrammeHealth(departmentId), mockDepartmentRepository.listInterventions(departmentId)])
      for (const p of programmeHealth) {
        const issues = await mockDepartmentRepository.listCurriculumAlignmentIssues(p.programmeId)
        const programmeCohorts = await mockDepartmentRepository.listCohorts(p.programmeId)
        const flags = (await Promise.all(programmeCohorts.map((c) => mockDepartmentRepository.listCohortStudentFlags(c.id)))).flat()
        const relevantInterventions = allInterventions.filter((i) => i.programmeId === p.programmeId)
        const interventionStatus = relevantInterventions.some((i) => i.status === 'active')
          ? 'active'
          : relevantInterventions.some((i) => i.status === 'awaiting_evaluation')
            ? 'awaiting_evaluation'
            : relevantInterventions.some((i) => i.status === 'planned')
              ? 'planned'
              : 'none'

        entries.push({
          programmeId: p.programmeId,
          programmeName: p.programmeName,
          departmentId,
          departmentName: dept.name,
          degreeLevel: p.degreeLevel,
          cohortSize: p.cohortSize,
          intendedCapabilityCount: p.intendedCapabilityCount,
          observedCapabilityCoveragePercent: p.observedCapabilityCoveragePercent,
          evidenceProducingCourseCount: p.evidenceProducingCourseCount,
          totalCourseCount: p.totalCourseCount,
          reviewHealth: p.reviewHealth,
          curriculumAlignmentIssueCount: issues.length,
          odysseyBlockerCount: flags.reduce((sum, f) => sum + f.odysseyBlockerCount, 0),
          passportReadinessBlockerCount: flags.reduce((sum, f) => sum + f.passportReadinessBlockerCount, 0),
          interventionStatus,
        })
      }
    }
    return entries
  },

  async getCapabilityStrategy(institutionId) {
    if (institution.id !== institutionId) {
      return { domainCount: 0, maturityDistribution: {}, confidenceBandDistribution: {}, staleClaimCount: 0, revokedClaimCount: 0, gapCount: 0, departmentCoverage: [], programmeCoverage: [], prerequisiteWeaknesses: [], evidenceSourceTypeDiversity: {}, investmentAreas: [], strongSupportAreas: [] }
    }
    const capabilityIntel = await mockDepartmentRepository.getCapabilityIntelligence(department.id)
    const departmentCoverage = [{ departmentId: department.id, departmentName: department.name, capabilitiesCovered: capabilityIntel.courseContribution.reduce((sum, c) => sum + c.capabilitiesCovered, 0) }]
    const programmeCoverage = [{ programmeId: programme.id, programmeName: programme.name, capabilitiesCovered: departmentCoverage[0].capabilitiesCovered }]

    return {
      domainCount: capabilityIntel.domainCount,
      maturityDistribution: capabilityIntel.maturityDistribution,
      confidenceBandDistribution: capabilityIntel.confidenceBandDistribution,
      staleClaimCount: capabilityIntel.staleClaimCount,
      revokedClaimCount: capabilityIntel.revokedClaimCount,
      gapCount: capabilityIntel.gapCount,
      departmentCoverage,
      programmeCoverage,
      prerequisiteWeaknesses: curriculumAlignmentIssues.filter((i) => i.breakType === 'reviewed_but_insufficient_confidence').map((i) => `${i.capabilityName}: ${i.description}`),
      evidenceSourceTypeDiversity: capabilityIntel.evidenceSourceTypeDiversity,
      investmentAreas: capabilityIntel.recommendedAttentionAreas,
      strongSupportAreas: Object.entries(capabilityIntel.maturityDistribution)
        .filter(([m]) => m === 'Proficient' || m === 'Advanced' || m === 'Expert')
        .map(([m, count]) => `${count} claim(s) at ${m}`),
    }
  },

  async getCapabilityArchitectureLayers() {
    const claimCount = capabilityClaims.length
    const evidenceReviewedCount = evidenceReviews.filter((r) => r.status !== 'pending').length
    return [
      { id: 'strategy', title: 'University strategy', description: 'Institutional Capability priorities and governance policy set the frame every department operates within.', exampleCount: governancePolicies.length },
      { id: 'departments', title: 'Departments', description: 'Departments own programmes and declare which Capabilities their curriculum intends to develop.', exampleCount: institution.departments.length },
      { id: 'programmes', title: 'Programmes', description: 'Each programme declares outcomes and the Capabilities that support them.', exampleCount: department.programmeIds.length },
      { id: 'courses', title: 'Courses', description: 'Courses contribute to one or more declared Capabilities via their assessments.', exampleCount: courses.length },
      { id: 'assessments', title: 'Assessments', description: 'Assessments are designed to produce Evidence for specific Capabilities.', exampleCount: courses.length },
      { id: 'evidence', title: 'Reviewed Evidence', description: 'Evidence is submitted, then reviewed by Faculty before it can support a Capability claim.', exampleCount: evidenceReviewedCount },
      { id: 'claims', title: 'Capability claims', description: 'Reviewed Evidence accumulates into a Capability claim with a maturity level and calibrated confidence.', exampleCount: claimCount },
      { id: 'odyssey', title: 'Odyssey progression', description: 'Capability state, declared intent, and institutional opportunity shape a directed sequence of milestones.', exampleCount: claimCount },
      { id: 'passport', title: 'Academic Passport', description: 'Sufficiently confident, reviewed claims become a portable, disclosure-controlled Passport claim.', exampleCount: passport.versions[passport.currentVersion - 1]?.claims.length ?? 0 },
    ]
  },

  async getEvidenceGovernance(institutionId) {
    if (institution.id !== institutionId) {
      return { statusDistribution: { pending: 0, verified: 0, disputed: 0, revoked: 0 }, typeDistribution: {}, departmentSourceCounts: [], programmeGapCount: 0, departmentGapCount: 0, reviewAgeingBuckets: [], revisionRate: 0, disputedCount: 0, revokedCount: 0, supersededCount: 0, provenanceConcernCount: 0, assessmentConcentrationNotes: [], reviewBottleneckDepartmentIds: [], inconsistentReviewPatternNotes: [] }
    }
    const health = await mockDepartmentRepository.getEvidenceHealth(department.id)
    const issues = await mockDepartmentRepository.listCurriculumAlignmentIssues(programme.id)

    return {
      statusDistribution: health.statusDistribution,
      typeDistribution: health.typeDistribution,
      departmentSourceCounts: [{ departmentId: department.id, departmentName: department.name, evidenceCount: health.courseSourceCounts.reduce((sum, c) => sum + c.evidenceCount, 0) }],
      programmeGapCount: issues.filter((i) => i.breakType === 'assessment_without_sufficient_evidence' || i.breakType === 'course_without_evidence_producing_assessment').length,
      departmentGapCount: health.weakestSourceCourseIds.length > 0 ? 1 : 0,
      reviewAgeingBuckets: health.reviewAgeingBuckets,
      revisionRate: health.revisionRate,
      disputedCount: health.disputedCount,
      revokedCount: health.revokedCount,
      supersededCount: health.supersededCount,
      provenanceConcernCount: health.provenanceConcernCount,
      assessmentConcentrationNotes: health.courseSourceCounts.length > 0 ? [`${health.courseSourceCounts[0]?.courseLabel ?? 'One course'} accounts for a notable share of institutional Evidence volume in this small demo dataset.`] : [],
      reviewBottleneckDepartmentIds: health.reviewBottleneckCourseIds.length > 0 ? [department.id] : [],
      inconsistentReviewPatternNotes: health.provenanceConcernCount > 0 ? [`${health.provenanceConcernCount} Evidence record(s) carry a recorded provenance concern.`] : [],
    }
  },

  async getFacultyCapacity(institutionId) {
    if (institution.id !== institutionId) return { totalFacultyCount: 0, totalPendingReviews: 0, totalOverdueReviews: 0, averageTurnaroundDays: 0, departmentsConstrained: [], rows: [] }
    const [coordination, capacity] = await Promise.all([mockDepartmentRepository.listFacultyCoordination(department.id), mockDepartmentRepository.getReviewCapacitySummary(department.id)])

    const rows: FacultyCapacityRow[] = coordination.map((f) => ({
      facultyId: f.facultyId,
      facultyName: f.facultyName,
      departmentId: department.id,
      departmentName: department.name,
      coursesTaught: f.coursesTaught,
      programmeResponsibilities: [programme.name],
      pendingReviewCount: f.pendingReviewCount,
      overdueReviewCount: f.overdueReviewCount,
      capabilityDomainsCovered: f.capabilityDomainsCovered,
      crossDepartment: false,
      calibrationNeeded: false,
      supportStatus: f.supportStatus,
    }))

    return {
      totalFacultyCount: capacity.facultyCount,
      totalPendingReviews: capacity.totalPendingReviews,
      totalOverdueReviews: capacity.totalOverdueReviews,
      averageTurnaroundDays: capacity.averageTurnaroundDays,
      departmentsConstrained: capacity.totalOverdueReviews > 0 ? [department.name] : [],
      rows,
    }
  },

  async listInstitutionalCohorts(institutionId) {
    if (institution.id !== institutionId) return []
    const results: InstitutionalCohortSummary[] = []
    for (const departmentId of institution.departments) {
      const dept = await mockInstitutionRepository.getDepartment(departmentId)
      if (!dept) continue
      for (const programmeId of dept.programmeIds) {
        const prog = await mockInstitutionRepository.getProgramme(programmeId)
        const cohortsForProgramme = await mockDepartmentRepository.listCohorts(programmeId)
        for (const cohort of cohortsForProgramme) {
          const [evidenceSummary, flags] = await Promise.all([mockDepartmentRepository.getCohortEvidenceSummary(cohort.id), mockDepartmentRepository.listCohortStudentFlags(cohort.id)])
          results.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            programmeId,
            programmeName: prog?.name ?? programmeId,
            departmentId,
            departmentName: dept.name,
            studentCount: cohort.studentIds.length,
            capabilityGapCount: flags.reduce((sum, f) => sum + f.capabilityGapCount, 0),
            unresolvedEvidenceCount: evidenceSummary?.pendingReviewCount ?? 0,
            staleClaimCount: flags.reduce((sum, f) => sum + f.staleClaimCount, 0),
            odysseyBlockerCount: flags.reduce((sum, f) => sum + f.odysseyBlockerCount, 0),
            passportReadinessBlockerCount: flags.reduce((sum, f) => sum + f.passportReadinessBlockerCount, 0),
          })
        }
      }
    }
    return results
  },

  async getOdysseyAggregateInsight(institutionId) {
    if (institution.id !== institutionId) {
      return { activeDestinationTitles: [], commonCapabilityGapNames: [], commonMilestoneBlockerReasons: [], evidenceRequirementsCausingDelay: [], frequentlyRecommendedResourceTitles: [], unavailableInstitutionalResourceNotes: [], reviewGateDelayNotes: [], alternativePathwaysRequestedCount: 0, programmePatterns: [], departmentPatterns: [] }
    }
    const destination = await mockOdysseyRepository.getDestination(currentUser.id)
    const currentVersion = await mockOdysseyRepository.getCurrentPlanVersion(currentUser.id)
    const milestones = currentVersion ? await mockOdysseyRepository.getMilestonesForVersion(currentUser.id, currentVersion.id) : []
    const blockedMilestones = milestones.filter((m) => m.status === 'blocked')
    const blockers = await mockOdysseyRepository.getBlockersForMilestones(currentUser.id, blockedMilestones.map((m) => m.id))
    const underReviewMilestones = milestones.filter((m) => m.status === 'under_review' || m.status === 'evidence_pending')
    const resources = await mockOdysseyRepository.listInstitutionalResources(currentUser.id)
    const alternatives = await mockOdysseyRepository.getAlternativeActionsForMilestones(currentUser.id, milestones.map((m) => m.id))

    const capabilityGapNames = await Promise.all(
      Array.from(new Set(blockedMilestones.flatMap((m) => m.capabilityIds))).map(async (id) => (await mockCapabilityRepository.getDefinition(id))?.name ?? id)
    )

    return {
      activeDestinationTitles: destination ? [destination.title] : [],
      commonCapabilityGapNames: capabilityGapNames,
      commonMilestoneBlockerReasons: blockers.map((b) => b.reason),
      evidenceRequirementsCausingDelay: underReviewMilestones.map((m) => m.title),
      frequentlyRecommendedResourceTitles: resources.slice(0, 5).map((r) => r.title),
      unavailableInstitutionalResourceNotes: [],
      reviewGateDelayNotes: underReviewMilestones.map((m) => `"${m.title}" is awaiting Evidence review before it can progress.`),
      alternativePathwaysRequestedCount: alternatives.length,
      programmePatterns: [{ programmeId: programme.id, programmeName: programme.name, blockedMilestoneCount: blockedMilestones.length }],
      departmentPatterns: [{ departmentId: department.id, departmentName: department.name, blockedMilestoneCount: blockedMilestones.length }],
    }
  },

  async getPassportReadinessAggregate(institutionId) {
    if (institution.id !== institutionId) {
      return { verificationStateDistribution: { verified: 0, strong_unverified: 0, supported: 0, stale: 0, revoked: 0 }, readyClaimCount: 0, withheldClaimCount: 0, claimsAwaitingReviewCount: 0, staleClaimCount: 0, revokedClaimCount: 0, commonReadinessBlockerReasons: [], programmeReadiness: [], departmentReadiness: [], evidenceGapsPreventingInclusion: [], reissuePatternNotes: [] }
    }
    const p = await mockPassportRepository.getForStudent(currentUser.id)
    const latest = p?.versions.find((v) => v.version === p.currentVersion)
    const verificationStateDistribution: Record<import('@/lib/campus-types').PassportClaimVerificationState, number> = { verified: 0, strong_unverified: 0, supported: 0, stale: 0, revoked: 0 }
    for (const claim of latest?.claims ?? []) verificationStateDistribution[claim.verificationState] += 1

    const readyClaimCount = verificationStateDistribution.verified
    const withheldClaimCount = latest?.withheld.length ?? 0

    return {
      verificationStateDistribution,
      readyClaimCount,
      withheldClaimCount,
      claimsAwaitingReviewCount: 0,
      staleClaimCount: verificationStateDistribution.stale,
      revokedClaimCount: verificationStateDistribution.revoked,
      commonReadinessBlockerReasons: (latest?.withheld ?? []).map((w) => w.reason),
      programmeReadiness: [{ programmeId: programme.id, programmeName: programme.name, readyClaimCount, withheldClaimCount }],
      departmentReadiness: [{ departmentId: department.id, departmentName: department.name, readyClaimCount, withheldClaimCount }],
      evidenceGapsPreventingInclusion: (latest?.withheld ?? []).map((w) => `${w.capabilityName}: ${w.reason}`),
      reissuePatternNotes: (p?.versions ?? []).filter((v) => v.reissueReason).map((v) => `v${v.version}: ${v.reissueReason}`),
    }
  },

  async getPassportIssuanceStages(institutionId) {
    if (institution.id !== institutionId) return []
    const p = await mockPassportRepository.getForStudent(currentUser.id)
    const latest = p?.versions.find((v) => v.version === p.currentVersion)
    const claims = await mockCapabilityRepository.listClaimsForSubject(currentUser.id)

    const evidenceReviewedCount = evidenceReviews.filter((r) => r.status !== 'pending').length
    const supportedClaims = claims.filter((c) => c.confidence.band === 'Supported' || c.confidence.band === 'Strong' || c.confidence.band === 'Verified').length
    const eligibleClaims = claims.filter((c) => c.confidence.band === 'Strong' || c.confidence.band === 'Verified').length
    const updatedCount = (p?.versions ?? []).reduce((sum, v) => sum + v.claimsUpdatedCapabilityIds.length, 0)

    const stages: PassportIssuanceStageCount[] = [
      { stage: 'evidence_reviewed', label: 'Evidence reviewed', count: evidenceReviewedCount },
      { stage: 'capability_claim_supported', label: 'Capability claim supported', count: supportedClaims },
      { stage: 'passport_claim_eligible', label: 'Passport claim eligible', count: eligibleClaims },
      { stage: 'passport_version_prepared', label: 'Passport version prepared', count: p?.versions.length ?? 0 },
      { stage: 'passport_issued', label: 'Passport claim issued', count: latest?.claims.length ?? 0 },
      { stage: 'passport_claim_updated', label: 'Passport claim later updated', count: updatedCount },
    ]
    return stages
  },

  async listGovernancePolicies() {
    return governancePolicies
  },

  async listGovernanceProposals() {
    return governanceProposals
  },

  async getAnalytics(institutionId) {
    if (institution.id !== institutionId) {
      return { reviewTurnaroundTrend: [], evidenceStatusDistribution: { pending: 0, verified: 0, disputed: 0, revoked: 0 }, maturityDistribution: {}, confidenceBandDistribution: {}, revisionRate: 0, staleClaimCount: 0, curriculumAlignmentIssueCount: 0, passportReadinessBlockerCount: 0, odysseyBlockerCount: 0, departmentCount: 0, programmeCount: 0, generatedFrom: '' }
    }
    const deptAnalytics = await mockDepartmentRepository.getAnalytics(department.id)
    const passportAggregate = await this.getPassportReadinessAggregate(institutionId)
    const odysseyInsight = await this.getOdysseyAggregateInsight(institutionId)

    return {
      reviewTurnaroundTrend: deptAnalytics.reviewTurnaroundTrend,
      evidenceStatusDistribution: deptAnalytics.evidenceStatusDistribution,
      maturityDistribution: deptAnalytics.maturityDistribution,
      confidenceBandDistribution: deptAnalytics.confidenceBandDistribution,
      revisionRate: deptAnalytics.revisionRate,
      staleClaimCount: deptAnalytics.staleClaimCount,
      curriculumAlignmentIssueCount: deptAnalytics.curriculumCoverageGapCount,
      passportReadinessBlockerCount: passportAggregate.withheldClaimCount,
      odysseyBlockerCount: odysseyInsight.programmePatterns.reduce((sum, p) => sum + p.blockedMilestoneCount, 0),
      departmentCount: institution.departments.length,
      programmeCount: department.programmeIds.length,
      generatedFrom: `${institution.departments.length} department, ${department.programmeIds.length} programme, 1 modeled student — small demo dataset, not a production-scale institution.`,
    }
  },

  async listInterventions(institutionId) {
    return Array.from(getStore(institutionId).interventionsById.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async createIntervention(institutionId, input) {
    const store = getStore(institutionId)
    const intervention: InstitutionalIntervention = {
      id: `ii-${Date.now().toString(36)}`,
      type: input.type,
      title: input.title,
      rationale: input.rationale,
      affectedDepartmentIds: input.affectedDepartmentIds,
      affectedProgrammeIds: input.affectedProgrammeIds,
      affectedCapabilityIds: input.affectedCapabilityIds,
      affectedCohortIds: input.affectedCohortIds,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      status: 'planned',
      createdAt: new Date().toISOString(),
      reviewDate: input.reviewDate,
      expectedEffect: input.expectedEffect,
      evidenceRequiredToEvaluate: input.evidenceRequiredToEvaluate,
      limitations: input.limitations,
    }
    store.interventionsById.set(intervention.id, intervention)
    return intervention
  },
}
