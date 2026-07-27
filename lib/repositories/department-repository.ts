import type {
  CapabilityMaturity,
  EvidenceSourceType,
  EvidenceStatus,
  ProgrammeOutcome,
  ObservedProgrammeCoverage,
  ProgrammeCoverageState,
  ProgrammeHealthSummary,
  Cohort,
  CohortCapabilitySummary,
  CohortEvidenceSummary,
  CohortStudentFlag,
  CurriculumAlignmentIssue,
  EvidenceHealthSummary,
  ReviewCapacitySummary,
  CourseAdminSummary,
  CourseAdminDetail,
  CapabilityIntelligenceSummary,
  FacultyCoordinationRow,
  DepartmentAnalyticsResult,
  DepartmentPriority,
  DepartmentIntervention,
  CreateInterventionInput,
} from '@/lib/campus-types'
import {
  department,
  programme,
  courses,
  capabilityClaims,
  evidenceRecords,
  evidenceReviews,
  currentUser,
  programmeOutcomes,
  programmeCapabilityRelationships,
  assessmentEvidenceRequirements,
  cohorts,
  curriculumAlignmentIssues,
  departmentInterventions,
} from '@/lib/mock-data/seed'
import { facultyProfile, facultyCourseAssignments, facultyReviewDecisions } from '@/lib/mock-data/faculty-seed'
import { mockCapabilityRepository } from '@/lib/repositories/capability-repository'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'
import { mockPassportRepository } from '@/lib/repositories/passport-repository'

/**
 * Session-scoped demo persistence for interventions — same disclosed
 * pattern as faculty-repository.ts's review-decision store: a browser
 * refresh keeps state, a real deploy restart resets it, never described as
 * institutional permanence. Keyed by department id since interventions are
 * department-scoped (mirrors odyssey-repository.ts's per-student keying).
 */
interface DepartmentStore {
  interventionsById: Map<string, DepartmentIntervention>
}

const globalStore = globalThis as unknown as { __departmentStores?: Map<string, DepartmentStore> }
const stores: Map<string, DepartmentStore> = globalStore.__departmentStores ?? new Map()
globalStore.__departmentStores = stores

function getStore(departmentId: string): DepartmentStore {
  let store = stores.get(departmentId)
  if (!store) {
    store = { interventionsById: new Map(departmentInterventions.map((i) => [i.id, i])) }
    stores.set(departmentId, store)
  }
  return store
}

const MATURITY_ORDER: CapabilityMaturity[] = ['Exposed', 'Emerging', 'Developing', 'Proficient', 'Advanced', 'Expert']

function maturityRank(maturity: CapabilityMaturity): number {
  const idx = MATURITY_ORDER.indexOf(maturity)
  return idx === -1 ? -1 : idx // Stale/Revoked resolve to -1 (below every real progression step)
}

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

function courseLabel(courseId: string): string {
  const course = courses.find((c) => c.id === courseId)
  return course ? `${course.code} ${course.title}` : courseId
}

// This demo dataset models a single student (student-1) across every
// Campus domain (see faculty-repository.ts's identical disclosure) — every
// "department-wide"/"cohort-wide" computation below is honestly derived
// from that one real student's records, never padded with fabricated peers.
function allEvidenceForDepartment() {
  return evidenceRecords
    .filter((r) => r.studentId === currentUser.id)
    .map((record) => ({ record, review: evidenceReviews.find((r) => r.evidenceId === record.id) }))
    .filter((e): e is { record: (typeof evidenceRecords)[number]; review: (typeof evidenceReviews)[number] } => Boolean(e.review))
}

async function computeObservedCoverage(programmeId: string): Promise<ObservedProgrammeCoverage[]> {
  const relationships = programmeCapabilityRelationships.filter((r) => r.programmeId === programmeId)
  const allEvidence = allEvidenceForDepartment()
  const claims = await mockCapabilityRepository.listClaimsForSubject(currentUser.id)

  return Promise.all(
    relationships.map(async (rel): Promise<ObservedProgrammeCoverage> => {
      const outcome = programmeOutcomes.find((o) => o.id === rel.outcomeId)
      const definition = await mockCapabilityRepository.getDefinition(rel.capabilityId)
      const assessments = assessmentEvidenceRequirements.filter((a) => a.courseId === rel.courseId && a.capabilityIds.includes(rel.capabilityId))
      const relevantEvidence = allEvidence.filter((e) => e.record.courseId === rel.courseId && e.record.capabilityIds.includes(rel.capabilityId))
      const claim = claims.find((c) => c.capabilityId === rel.capabilityId)
      const reviewsPending = relevantEvidence.filter((e) => e.review.status === 'pending').length

      const intendedRank = rel.intendedMaturity ? maturityRank(rel.intendedMaturity) : -1
      const claimRank = claim ? maturityRank(claim.maturity) : -1
      const atOrAbove = claim && claimRank >= intendedRank && claim.maturity !== 'Stale' && claim.maturity !== 'Revoked' ? 1 : 0
      const below = claim && !atOrAbove ? 1 : 0

      let coverageState: ProgrammeCoverageState
      if (relevantEvidence.length === 0) coverageState = 'missing_evidence'
      else if (claim?.maturity === 'Stale') coverageState = 'stale_evidence'
      else if (reviewsPending > 0 && atOrAbove === 0) coverageState = 'review_bottleneck'
      else if (below > 0) coverageState = 'under_covered'
      else if (assessments.length > 2) coverageState = 'over_concentrated'
      else coverageState = 'covered'

      return {
        outcomeId: rel.outcomeId,
        outcomeTitle: outcome?.title ?? rel.outcomeId,
        capabilityId: rel.capabilityId,
        capabilityName: definition?.name ?? rel.capabilityId,
        courseIds: [rel.courseId],
        courseLabels: [courseLabel(rel.courseId)],
        intendedMaturity: rel.intendedMaturity,
        assessmentsDesigned: assessments.length,
        evidenceProduced: relevantEvidence.length,
        claimsAtOrAboveIntendedMaturity: atOrAbove,
        claimsBelowIntendedMaturity: below,
        reviewsPending,
        coverageState,
      }
    })
  )
}

export interface DepartmentRepository {
  getPriorities(departmentId: string): Promise<DepartmentPriority[]>
  listProgrammeHealth(departmentId: string): Promise<ProgrammeHealthSummary[]>
  getProgrammeHealth(programmeId: string): Promise<ProgrammeHealthSummary | undefined>
  listObservedCoverage(programmeId: string): Promise<ObservedProgrammeCoverage[]>
  listCurriculumAlignmentIssues(programmeId: string): Promise<CurriculumAlignmentIssue[]>
  listProgrammeOutcomes(programmeId: string): Promise<ProgrammeOutcome[]>
  listCourseAdminSummaries(departmentId: string): Promise<CourseAdminSummary[]>
  getCourseAdminDetail(courseId: string): Promise<CourseAdminDetail | undefined>
  getCapabilityIntelligence(departmentId: string): Promise<CapabilityIntelligenceSummary>
  getEvidenceHealth(departmentId: string): Promise<EvidenceHealthSummary>
  getReviewCapacitySummary(departmentId: string): Promise<ReviewCapacitySummary>
  listFacultyCoordination(departmentId: string): Promise<FacultyCoordinationRow[]>
  listCohorts(programmeId: string): Promise<Cohort[]>
  getCohort(cohortId: string): Promise<Cohort | undefined>
  listCohortStudentFlags(cohortId: string): Promise<CohortStudentFlag[]>
  getCohortCapabilitySummaries(cohortId: string): Promise<CohortCapabilitySummary[]>
  getCohortEvidenceSummary(cohortId: string): Promise<CohortEvidenceSummary | undefined>
  getAnalytics(departmentId: string): Promise<DepartmentAnalyticsResult>
  listInterventions(departmentId: string): Promise<DepartmentIntervention[]>
  getIntervention(departmentId: string, id: string): Promise<DepartmentIntervention | undefined>
  createIntervention(departmentId: string, input: CreateInterventionInput): Promise<DepartmentIntervention>
}

export const mockDepartmentRepository: DepartmentRepository = {
  async getPriorities(departmentId) {
    if (department.id !== departmentId) return []
    const priorities: DepartmentPriority[] = []
    const allEvidence = allEvidenceForDepartment()
    const agingPending = allEvidence.filter((e) => e.review.status === 'pending' && ageDays(e.record.submittedAt) > 7)

    if (agingPending.length > 0) {
      priorities.push({
        id: 'priority-ageing-review',
        urgency: 'high',
        summary: `${agingPending.length} Evidence submission${agingPending.length === 1 ? '' : 's'} awaiting review for over 7 days`,
        detail: agingPending.map((e) => `"${e.record.title}" (${ageDays(e.record.submittedAt)} days)`).join(', '),
        actionLabel: 'Review Evidence health',
        actionHref: '/department/evidence',
      })
    }

    for (const issue of curriculumAlignmentIssues) {
      priorities.push({
        id: `priority-${issue.id}`,
        urgency: issue.breakType === 'assessment_without_sufficient_evidence' ? 'high' : 'medium',
        summary: `${issue.capabilityName}: ${issue.breakType.replace(/_/g, ' ')}`,
        detail: issue.description,
        relatedProgrammeId: issue.programmeId,
        actionLabel: 'View programme',
        actionHref: `/department/programmes/${issue.programmeId}`,
      })
    }

    const staleClaims = capabilityClaims.filter((c) => c.subjectId === currentUser.id && c.maturity === 'Stale')
    for (const claim of staleClaims) {
      const def = await mockCapabilityRepository.getDefinition(claim.capabilityId)
      priorities.push({
        id: `priority-stale-${claim.id}`,
        urgency: 'low',
        summary: `${def?.name ?? claim.capabilityId} confidence has decayed to Stale`,
        detail: 'Refreshing this claim requires new, reviewed Evidence — see Capability Intelligence.',
        actionLabel: 'View Capability Intelligence',
        actionHref: '/department/capabilities',
      })
    }

    const activeInterventions = Array.from(getStore(departmentId).interventionsById.values()).filter((i) => i.status === 'active' || i.status === 'planned')
    if (activeInterventions.length > 0) {
      priorities.push({
        id: 'priority-interventions',
        urgency: 'low',
        summary: `${activeInterventions.length} departmental intervention${activeInterventions.length === 1 ? '' : 's'} in progress`,
        detail: activeInterventions.map((i) => i.title).join(', '),
        actionLabel: 'View interventions',
        actionHref: '/department/analytics',
      })
    }

    return priorities.sort((a, b) => (a.urgency === b.urgency ? 0 : a.urgency === 'high' ? -1 : b.urgency === 'high' ? 1 : a.urgency === 'medium' ? -1 : 1))
  },

  async listProgrammeHealth(departmentId) {
    if (department.id !== departmentId) return []
    const results = await Promise.all(department.programmeIds.map((id) => this.getProgrammeHealth(id)))
    return results.filter((r): r is ProgrammeHealthSummary => Boolean(r))
  },

  async getProgrammeHealth(programmeId) {
    if (programme.id !== programmeId) return undefined
    const [coverage, issues, programmeCohorts] = await Promise.all([
      this.listObservedCoverage(programmeId),
      this.listCurriculumAlignmentIssues(programmeId),
      this.listCohorts(programmeId),
    ])
    const cohortSize = programmeCohorts.reduce((sum, c) => sum + c.studentIds.length, 0)
    const intendedCapabilityIds = new Set(programmeCapabilityRelationships.filter((r) => r.programmeId === programmeId).map((r) => r.capabilityId))
    const evidenceProducingCourseIds = new Set(coverage.filter((c) => c.evidenceProduced > 0).flatMap((c) => c.courseIds))
    const totalCourseCount = courses.filter((c) => c.programmeId === programmeId).length
    const allEvidence = allEvidenceForDepartment()
    const programmeCourseIds = new Set(courses.filter((c) => c.programmeId === programmeId).map((c) => c.id))
    const unresolvedEvidenceCount = allEvidence.filter((e) => e.record.courseId && programmeCourseIds.has(e.record.courseId) && (e.review.status === 'pending' || e.review.status === 'disputed')).length
    const interventions = Array.from(getStore(department.id).interventionsById.values()).filter((i) => i.programmeId === programmeId)

    const coveredCount = coverage.filter((c) => c.coverageState === 'covered').length
    const observedCapabilityCoveragePercent = coverage.length > 0 ? Math.round((coveredCount / coverage.length) * 100) : 0
    const bottlenecks = coverage.filter((c) => c.coverageState === 'review_bottleneck').length
    const reviewHealth: ProgrammeHealthSummary['reviewHealth'] = bottlenecks > 0 ? 'at_risk' : unresolvedEvidenceCount > 0 ? 'attention_needed' : 'on_track'

    return {
      programmeId,
      programmeName: programme.name,
      degreeLevel: programme.degreeLevel,
      activeTerm: facultyCourseAssignments[0]?.term ?? 'Unspecified term',
      cohortSize,
      intendedCapabilityCount: intendedCapabilityIds.size,
      observedCapabilityCoveragePercent,
      evidenceProducingCourseCount: evidenceProducingCourseIds.size,
      totalCourseCount,
      unresolvedEvidenceCount,
      reviewHealth,
      gapCount: issues.length,
      activeInterventionCount: interventions.filter((i) => i.status === 'active' || i.status === 'planned').length,
    }
  },

  async listObservedCoverage(programmeId) {
    return computeObservedCoverage(programmeId)
  },

  async listCurriculumAlignmentIssues(programmeId) {
    return curriculumAlignmentIssues.filter((i) => i.programmeId === programmeId)
  },

  async listProgrammeOutcomes(programmeId) {
    return programmeOutcomes.filter((o) => o.programmeId === programmeId)
  },

  async listCourseAdminSummaries(departmentId) {
    if (department.id !== departmentId) return []
    const departmentCourses = courses.filter((c) => department.programmeIds.includes(c.programmeId))
    return Promise.all(departmentCourses.map(async (c) => (await this.getCourseAdminDetail(c.id))!))
  },

  async getCourseAdminDetail(courseId) {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return undefined
    const coverage = (await computeObservedCoverage(course.programmeId)).filter((c) => c.courseIds.includes(courseId))
    const assessments = assessmentEvidenceRequirements.filter((a) => a.courseId === courseId)
    const evidenceProducingAssessmentCount = assessments.filter((a) => evidenceRecords.some((e) => e.courseId === courseId && e.title === a.assessmentTitle)).length
    const allEvidence = allEvidenceForDepartment().filter((e) => e.record.courseId === courseId)
    const unresolvedEvidenceCount = allEvidence.filter((e) => e.review.status === 'pending' || e.review.status === 'disputed').length
    const reviewed = allEvidence.filter((e) => e.review.status !== 'pending').length
    const reviewCompletionPercent = allEvidence.length > 0 ? Math.round((reviewed / allEvidence.length) * 100) : 100
    const outcomeIds = new Set(programmeCapabilityRelationships.filter((r) => r.courseId === courseId).map((r) => r.outcomeId))
    const outcomeTitles = programmeOutcomes.filter((o) => outcomeIds.has(o.id)).map((o) => o.title)
    const interventions = Array.from(getStore(department.id).interventionsById.values()).filter((i) => i.courseId === courseId)
    const decisionsForCourseEvidence = facultyReviewDecisions.filter((d) => allEvidence.some((e) => e.record.id === d.evidenceId))
    const commonLimitations = Array.from(new Set(decisionsForCourseEvidence.flatMap((d) => d.limitations)))
    const cohort = cohorts.find((c) => c.programmeId === course.programmeId)
    const facultyNames = facultyCourseAssignments.filter((a) => a.courseId === courseId).map(() => facultyProfile.name)

    return {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      programmeId: course.programmeId,
      programmeName: programme.name,
      responsibleFacultyNames: Array.from(new Set(facultyNames)),
      term: facultyCourseAssignments.find((a) => a.courseId === courseId)?.term ?? 'Unspecified term',
      enrolledStudentCount: cohort?.studentIds.length ?? 0,
      intendedCapabilityCount: course.capabilityIds.length,
      evidenceProducingAssessmentCount,
      totalAssessmentCount: assessments.length,
      unresolvedEvidenceCount,
      reviewCompletionPercent,
      activeInterventionCount: interventions.filter((i) => i.status === 'active' || i.status === 'planned').length,
      outcomeTitles,
      coverage,
      commonLimitations,
      interventions,
    }
  },

  async getCapabilityIntelligence(departmentId) {
    if (department.id !== departmentId) {
      return {
        domainCount: 0,
        maturityDistribution: {},
        confidenceBandDistribution: {},
        staleClaimCount: 0,
        revokedClaimCount: 0,
        gapCount: 0,
        courseContribution: [],
        evidenceSourceTypeDiversity: {},
        recommendedAttentionAreas: [],
      }
    }
    const claims = capabilityClaims.filter((c) => c.subjectId === currentUser.id)
    const domains = new Set(await Promise.all(claims.map(async (c) => (await mockCapabilityRepository.getDefinition(c.capabilityId))?.domain ?? 'Unknown')))

    const maturityDistribution: Partial<Record<CapabilityMaturity, number>> = {}
    const confidenceBandDistribution: CapabilityIntelligenceSummary['confidenceBandDistribution'] = {}
    for (const claim of claims) {
      maturityDistribution[claim.maturity] = (maturityDistribution[claim.maturity] ?? 0) + 1
      confidenceBandDistribution[claim.confidence.band] = (confidenceBandDistribution[claim.confidence.band] ?? 0) + 1
    }

    const allEvidence = allEvidenceForDepartment()
    const evidenceSourceTypeDiversity: Partial<Record<EvidenceSourceType, number>> = {}
    for (const { record } of allEvidence) {
      evidenceSourceTypeDiversity[record.sourceType] = (evidenceSourceTypeDiversity[record.sourceType] ?? 0) + 1
    }

    const courseContribution = await Promise.all(
      courses.map(async (c) => ({
        courseId: c.id,
        courseLabel: courseLabel(c.id),
        capabilitiesCovered: c.capabilityIds.filter((id) => claims.some((claim) => claim.capabilityId === id && claim.evidenceCount > 0)).length,
      }))
    )

    const gapClaims = claims.filter((c) => c.evidenceCount === 0)
    const staleClaims = claims.filter((c) => c.maturity === 'Stale')
    const recommendedAttentionAreas: string[] = []
    for (const c of gapClaims) {
      const def = await mockCapabilityRepository.getDefinition(c.capabilityId)
      recommendedAttentionAreas.push(`${def?.name ?? c.capabilityId} has no supporting Evidence yet.`)
    }
    for (const c of staleClaims) {
      const def = await mockCapabilityRepository.getDefinition(c.capabilityId)
      recommendedAttentionAreas.push(`${def?.name ?? c.capabilityId} confidence has decayed (Stale) — new Evidence would refresh it.`)
    }

    return {
      domainCount: domains.size,
      maturityDistribution,
      confidenceBandDistribution,
      staleClaimCount: staleClaims.length,
      revokedClaimCount: claims.filter((c) => c.maturity === 'Revoked').length,
      gapCount: gapClaims.length,
      courseContribution,
      evidenceSourceTypeDiversity,
      recommendedAttentionAreas,
    }
  },

  async getEvidenceHealth(departmentId) {
    if (department.id !== departmentId) {
      return {
        statusDistribution: { pending: 0, verified: 0, disputed: 0, revoked: 0 },
        typeDistribution: {},
        courseSourceCounts: [],
        reviewAgeingBuckets: [],
        revisionRate: 0,
        disputedCount: 0,
        revokedCount: 0,
        supersededCount: 0,
        provenanceConcernCount: 0,
        weakestSourceCourseIds: [],
        strongestSourceCourseIds: [],
        reviewBottleneckCourseIds: [],
      }
    }
    // Reflects the canonical seed review state; review decisions made live
    // through /faculty in the same demo session are tracked in that
    // route's own session store and are not re-joined here in this phase.
    const allEvidence = allEvidenceForDepartment()
    const statusDistribution: Record<EvidenceStatus, number> = { pending: 0, verified: 0, disputed: 0, revoked: 0 }
    const typeDistribution: Partial<Record<EvidenceSourceType, number>> = {}
    for (const { record, review } of allEvidence) {
      statusDistribution[review.status] += 1
      typeDistribution[record.sourceType] = (typeDistribution[record.sourceType] ?? 0) + 1
    }

    const courseIds = Array.from(new Set(allEvidence.map((e) => e.record.courseId).filter((id): id is string => Boolean(id))))
    const courseSourceCounts = courseIds.map((id) => ({ courseId: id, courseLabel: courseLabel(id), evidenceCount: allEvidence.filter((e) => e.record.courseId === id).length }))

    const pendingEvidence = allEvidence.filter((e) => e.review.status === 'pending')
    const buckets = [
      { bucketLabel: '0-3 days', min: 0, max: 3 },
      { bucketLabel: '4-7 days', min: 4, max: 7 },
      { bucketLabel: '8-14 days', min: 8, max: 14 },
      { bucketLabel: '15+ days', min: 15, max: Infinity },
    ]
    const reviewAgeingBuckets = buckets.map((b) => ({
      bucketLabel: b.bucketLabel,
      count: pendingEvidence.filter((e) => {
        const age = ageDays(e.record.submittedAt)
        return age >= b.min && age <= b.max
      }).length,
    }))

    const supersededCount = allEvidence.filter((e) => allEvidence.some((other) => other.record.supersedesEvidenceId === e.record.id)).length
    const revisionDecisions = facultyReviewDecisions.filter((d) => d.decisionType === 'request_revision' || d.decisionType === 'dispute_attribution')
    const provenanceConcernCount = facultyReviewDecisions.filter((d) => Boolean(d.provenanceConcern)).length

    const courseHealth = courseIds.map((id) => {
      const items = allEvidence.filter((e) => e.record.courseId === id)
      const problemRatio = items.length > 0 ? items.filter((e) => e.review.status === 'disputed' || (e.review.status === 'pending' && ageDays(e.record.submittedAt) > 7)).length / items.length : 0
      return { id, problemRatio, allVerified: items.length > 0 && items.every((e) => e.review.status === 'verified') }
    })

    return {
      statusDistribution,
      typeDistribution,
      courseSourceCounts,
      reviewAgeingBuckets,
      revisionRate: facultyReviewDecisions.length > 0 ? Math.round((revisionDecisions.length / facultyReviewDecisions.length) * 100) / 100 : 0,
      disputedCount: statusDistribution.disputed,
      revokedCount: statusDistribution.revoked,
      supersededCount,
      provenanceConcernCount,
      weakestSourceCourseIds: courseHealth.filter((c) => c.problemRatio > 0).map((c) => c.id),
      strongestSourceCourseIds: courseHealth.filter((c) => c.allVerified).map((c) => c.id),
      reviewBottleneckCourseIds: courseHealth.filter((c) => c.problemRatio >= 0.5).map((c) => c.id),
    }
  },

  async getReviewCapacitySummary(departmentId) {
    if (department.id !== departmentId) return { departmentId, facultyCount: 0, totalPendingReviews: 0, totalOverdueReviews: 0, averageTurnaroundDays: 0, facultyNeedingSupport: [] }
    const allEvidence = allEvidenceForDepartment()
    const pending = allEvidence.filter((e) => e.review.status === 'pending')
    const overdue = pending.filter((e) => ageDays(e.record.submittedAt) > 7)
    const decided = facultyReviewDecisions
    const turnarounds = decided
      .map((d) => {
        const record = evidenceRecords.find((r) => r.id === d.evidenceId)
        return record ? Math.max(0, (new Date(d.decidedAt).getTime() - new Date(record.submittedAt).getTime()) / 86_400_000) : undefined
      })
      .filter((n): n is number => typeof n === 'number')
    const averageTurnaroundDays = turnarounds.length > 0 ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10) / 10 : 0

    return {
      departmentId,
      facultyCount: 1,
      totalPendingReviews: pending.length,
      totalOverdueReviews: overdue.length,
      averageTurnaroundDays,
      facultyNeedingSupport:
        overdue.length > 0 ? [{ facultyId: facultyProfile.id, facultyName: facultyProfile.name, pendingReviewCount: pending.length, overdueReviewCount: overdue.length }] : [],
    }
  },

  async listFacultyCoordination(departmentId) {
    if (department.id !== departmentId) return []
    const assignments = facultyCourseAssignments
    const allEvidence = allEvidenceForDepartment()
    const pending = allEvidence.filter((e) => e.review.status === 'pending')
    const overdue = pending.filter((e) => ageDays(e.record.submittedAt) > 7)
    const reviewed = allEvidence.filter((e) => e.review.status !== 'pending')
    const reviewCompletionPercent = allEvidence.length > 0 ? Math.round((reviewed.length / allEvidence.length) * 100) : 100
    const domains = new Set(
      await Promise.all(
        courses
          .filter((c) => assignments.some((a) => a.courseId === c.id))
          .flatMap((c) => c.capabilityIds)
          .map(async (id) => (await mockCapabilityRepository.getDefinition(id))?.domain ?? 'Unknown')
      )
    )

    return [
      {
        facultyId: facultyProfile.id,
        facultyName: facultyProfile.name,
        title: facultyProfile.title,
        coursesTaught: assignments.map((a) => ({ courseId: a.courseId, courseLabel: courseLabel(a.courseId) })),
        pendingReviewCount: pending.length,
        overdueReviewCount: overdue.length,
        reviewCompletionPercent,
        capabilityDomainsCovered: Array.from(domains),
        supportStatus: overdue.length > 1 ? 'support_recommended' : overdue.length === 1 ? 'monitor' : 'none_needed',
      },
    ]
  },

  async listCohorts(programmeId) {
    return cohorts.filter((c) => c.programmeId === programmeId)
  },

  async getCohort(cohortId) {
    return cohorts.find((c) => c.id === cohortId)
  },

  async listCohortStudentFlags(cohortId) {
    const cohort = cohorts.find((c) => c.id === cohortId)
    if (!cohort) return []
    return Promise.all(
      cohort.studentIds.map(async (studentId): Promise<CohortStudentFlag> => {
        const claims = await mockCapabilityRepository.listClaimsForSubject(studentId)
        const gapCount = claims.filter((c) => c.evidenceCount === 0).length
        const staleCount = claims.filter((c) => c.maturity === 'Stale').length
        const studentEvidence = evidenceRecords.filter((e) => e.studentId === studentId).map((r) => ({ record: r, review: evidenceReviews.find((rv) => rv.evidenceId === r.id) }))
        const unresolvedEvidenceCount = studentEvidence.filter((e) => e.review?.status === 'pending' || e.review?.status === 'disputed').length
        const currentVersion = await mockOdysseyRepository.getCurrentPlanVersion(studentId)
        const milestones = currentVersion ? await mockOdysseyRepository.getMilestonesForVersion(studentId, currentVersion.id) : []
        const odysseyBlockerCount = milestones.filter((m) => m.status === 'blocked').length
        const passport = await mockPassportRepository.getForStudent(studentId)
        const latestVersion = passport?.versions.find((v) => v.version === passport.currentVersion)
        const passportReadinessBlockerCount = latestVersion?.withheld.length ?? 0

        return {
          studentId,
          studentName: studentId === currentUser.id ? currentUser.name : studentId,
          cohortId,
          programmeId: cohort.programmeId,
          capabilityGapCount: gapCount,
          unresolvedEvidenceCount,
          staleClaimCount: staleCount,
          passportReadinessBlockerCount,
          odysseyBlockerCount,
          needsIntervention: gapCount > 0 || staleCount > 0 || unresolvedEvidenceCount > 2 || odysseyBlockerCount > 0,
        }
      })
    )
  },

  async getCohortCapabilitySummaries(cohortId) {
    const cohort = cohorts.find((c) => c.id === cohortId)
    if (!cohort) return []
    const relevantCapabilityIds = new Set(courses.filter((c) => c.programmeId === cohort.programmeId).flatMap((c) => c.capabilityIds))
    const claims = capabilityClaims.filter((c) => cohort.studentIds.includes(c.subjectId) && relevantCapabilityIds.has(c.capabilityId))

    return Promise.all(
      Array.from(relevantCapabilityIds).map(async (capabilityId): Promise<CohortCapabilitySummary> => {
        const def = await mockCapabilityRepository.getDefinition(capabilityId)
        const relevantClaims = claims.filter((c) => c.capabilityId === capabilityId)
        const maturityDistribution: Partial<Record<CapabilityMaturity, number>> = {}
        for (const claim of relevantClaims) maturityDistribution[claim.maturity] = (maturityDistribution[claim.maturity] ?? 0) + 1
        return {
          cohortId,
          capabilityId,
          capabilityName: def?.name ?? capabilityId,
          maturityDistribution,
          studentsWithoutEvidence: cohort.studentIds.length - relevantClaims.filter((c) => c.evidenceCount > 0).length,
        }
      })
    )
  },

  async getCohortEvidenceSummary(cohortId) {
    const cohort = cohorts.find((c) => c.id === cohortId)
    if (!cohort) return undefined
    const studentEvidence = evidenceRecords
      .filter((r) => cohort.studentIds.includes(r.studentId))
      .map((record) => ({ record, review: evidenceReviews.find((r) => r.evidenceId === record.id) }))
    return {
      cohortId,
      totalEvidenceRecords: studentEvidence.length,
      pendingReviewCount: studentEvidence.filter((e) => e.review?.status === 'pending').length,
      disputedCount: studentEvidence.filter((e) => e.review?.status === 'disputed').length,
      agingOver7DaysCount: studentEvidence.filter((e) => e.review?.status === 'pending' && ageDays(e.record.submittedAt) > 7).length,
      studentsAwaitingReviewCount: new Set(studentEvidence.filter((e) => e.review?.status === 'pending').map((e) => e.record.studentId)).size,
    }
  },

  async getAnalytics(departmentId) {
    const [evidenceHealth, capabilityIntelligence, issues] = await Promise.all([
      this.getEvidenceHealth(departmentId),
      this.getCapabilityIntelligence(departmentId),
      this.listCurriculumAlignmentIssues(programme.id),
    ])
    const currentVersion = await mockOdysseyRepository.getCurrentPlanVersion(currentUser.id)
    const milestones = currentVersion ? await mockOdysseyRepository.getMilestonesForVersion(currentUser.id, currentVersion.id) : []
    const passport = await mockPassportRepository.getForStudent(currentUser.id)
    const latestVersion = passport?.versions.find((v) => v.version === passport.currentVersion)

    const decided = facultyReviewDecisions
    const turnaroundByMonth = new Map<string, number[]>()
    for (const d of decided) {
      const record = evidenceRecords.find((r) => r.id === d.evidenceId)
      if (!record) continue
      const monthLabel = new Date(d.decidedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      const days = Math.max(0, (new Date(d.decidedAt).getTime() - new Date(record.submittedAt).getTime()) / 86_400_000)
      turnaroundByMonth.set(monthLabel, [...(turnaroundByMonth.get(monthLabel) ?? []), days])
    }
    const reviewTurnaroundTrend = Array.from(turnaroundByMonth.entries())
      .map(([periodLabel, days]) => ({ periodLabel, averageDays: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 }))
      .sort((a, b) => new Date(a.periodLabel).getTime() - new Date(b.periodLabel).getTime())

    return {
      reviewTurnaroundTrend,
      evidenceStatusDistribution: evidenceHealth.statusDistribution,
      evidenceTypeDistribution: evidenceHealth.typeDistribution,
      maturityDistribution: capabilityIntelligence.maturityDistribution,
      confidenceBandDistribution: capabilityIntelligence.confidenceBandDistribution,
      revisionRate: evidenceHealth.revisionRate,
      staleClaimCount: capabilityIntelligence.staleClaimCount,
      curriculumCoverageGapCount: issues.length,
      passportBlockerCount: latestVersion?.withheld.length ?? 0,
      odysseyBlockerCount: milestones.filter((m) => m.status === 'blocked').length,
      generatedFrom: '1 department, 1 programme, 2 courses, 6 capability domains, 1 modeled student — small demo dataset, not a production-scale sample.',
    }
  },

  async listInterventions(departmentId) {
    return Array.from(getStore(departmentId).interventionsById.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getIntervention(departmentId, id) {
    return getStore(departmentId).interventionsById.get(id)
  },

  async createIntervention(departmentId, input) {
    const store = getStore(departmentId)
    const intervention: DepartmentIntervention = {
      id: `di-${Date.now().toString(36)}`,
      type: input.type,
      title: input.title,
      rationale: input.rationale,
      programmeId: input.programmeId,
      courseId: input.courseId,
      capabilityIds: input.capabilityIds,
      cohortId: input.cohortId,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      status: 'planned',
      createdAt: new Date().toISOString(),
      expectedEffect: input.expectedEffect,
      evidenceRequiredToEvaluate: input.evidenceRequiredToEvaluate,
      limitations: input.limitations,
      reviewDate: input.reviewDate,
    }
    store.interventionsById.set(intervention.id, intervention)
    return intervention
  },
}
