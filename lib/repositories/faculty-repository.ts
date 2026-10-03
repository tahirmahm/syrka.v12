import type {
  FacultyProfile,
  FacultyCourseAssignment,
  ReviewCriteria,
  FacultyReviewDecision,
  ReviewHistoryEntry,
  ReviewDecisionType,
  EvidenceLimitationTag,
  ProvenanceConcernType,
  ReviewImpactPreview,
  CourseCapabilityCoverage,
  FacultyWorkloadSummary,
  FacultyVisibleStudentContext,
  ReviewQueueEntry,
  FacultyAnalyticsSummary,
  EvidenceStatus,
} from '@/lib/campus-types'
import { facultyProfile, facultyCourseAssignments, reviewCriteria, facultyReviewDecisions } from '@/lib/mock-data/faculty-seed'
import { currentUser, courses, programme } from '@/lib/mock-data/seed'
import { mockEvidenceRepository, type EvidenceWithReview } from '@/lib/repositories/evidence-repository'
import { mockCapabilityRepository } from '@/lib/repositories/capability-repository'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'

/**
 * Session-scoped demo persistence for review decisions — deliberately not a
 * database. A browser refresh keeps state (the server process doesn't
 * restart), but a real deploy restart resets it; this is disclosed in the
 * UI, never described as institutional permanence.
 */
interface FacultyStore {
  decisionsByEvidenceId: Map<string, FacultyReviewDecision[]>
  statusOverrideByEvidenceId: Map<string, EvidenceStatus>
}

const globalStore = globalThis as unknown as { __facultyStore?: FacultyStore }
const store: FacultyStore =
  globalStore.__facultyStore ??
  {
    decisionsByEvidenceId: new Map(facultyReviewDecisions.reduce<[string, FacultyReviewDecision[]][]>((acc, d) => {
      const existing = acc.find(([id]) => id === d.evidenceId)
      if (existing) existing[1].push(d)
      else acc.push([d.evidenceId, [d]])
      return acc
    }, [])),
    statusOverrideByEvidenceId: new Map(),
  }
globalStore.__facultyStore = store

const DECISION_TO_STATUS: Partial<Record<ReviewDecisionType, EvidenceStatus>> = {
  approve: 'verified',
  request_revision: 'disputed',
  dispute_attribution: 'disputed',
  revoke: 'revoked',
}

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

function effectiveStatus(evidenceId: string, baseStatus: EvidenceStatus): EvidenceStatus {
  return store.statusOverrideByEvidenceId.get(evidenceId) ?? baseStatus
}

export interface CommitReviewDecisionInput {
  evidenceId: string
  decisionType: ReviewDecisionType
  rationale: string
  limitations: EvidenceLimitationTag[]
  supportedCapabilityIds: string[]
  unsupportedCapabilityIds: string[]
  provenanceConcern?: ProvenanceConcernType
}

export interface ReviewQueueFilters {
  status?: EvidenceStatus | 'all'
  courseId?: string | 'all'
  sourceType?: string | 'all'
  studentId?: string | 'all'
}

export interface FacultyEvidenceReviewDetail {
  item: EvidenceWithReview
  effectiveStatus: EvidenceStatus
  studentName: string
  courseLabel?: string
  linkedCapabilities: { id: string; name: string; maturity?: string; confidenceBand?: string }[]
  criteria: ReviewCriteria[]
  history: ReviewHistoryEntry[]
  priorVersion?: EvidenceWithReview
  supersedingVersion?: EvidenceWithReview
}

async function studentNameFor(studentId: string): Promise<string> {
  return studentId === currentUser.id ? currentUser.name : studentId
}

async function courseLabelFor(courseId?: string): Promise<string | undefined> {
  if (!courseId) return undefined
  const course = courses.find((c) => c.id === courseId)
  return course ? `${course.code} ${course.title}` : undefined
}

async function buildQueueEntry(item: EvidenceWithReview): Promise<ReviewQueueEntry> {
  const { record, review } = item
  const status = effectiveStatus(record.id, review.status)
  const [capabilities, studentName, courseLabel] = await Promise.all([
    Promise.all(record.capabilityIds.map((id) => mockCapabilityRepository.getDefinition(id))),
    studentNameFor(record.studentId),
    courseLabelFor(record.courseId),
  ])
  const linkedCapabilityNames = capabilities.filter((c): c is NonNullable<typeof c> => Boolean(c)).map((c) => c.name)

  const likelyImpactSummary =
    status === 'pending'
      ? linkedCapabilityNames.length > 0
        ? `Awaiting review — could strengthen ${linkedCapabilityNames.join(', ')} if approved.`
        : 'Awaiting review.'
      : status === 'disputed'
        ? 'Under revision — no capability effect until resubmitted.'
        : status === 'verified'
          ? `Already contributing to ${linkedCapabilityNames.join(', ') || 'linked capabilities'}.`
          : 'Revoked — no active capability contribution.'

  return {
    evidenceId: record.id,
    title: record.title,
    studentId: record.studentId,
    studentName,
    courseId: record.courseId,
    courseLabel,
    sourceType: record.sourceType,
    submittedAt: record.submittedAt,
    status,
    ageDays: ageDays(record.submittedAt),
    linkedCapabilityNames,
    likelyImpactSummary,
    hasRevisionHistory: Boolean(record.supersedesEvidenceId) || (store.decisionsByEvidenceId.get(record.id)?.length ?? 0) > 1,
    provenanceSummary: record.provenance,
  }
}

export interface FacultyRepository {
  getProfile(facultyId: string): Promise<FacultyProfile | undefined>
  listCourseAssignments(facultyId: string): Promise<FacultyCourseAssignment[]>
  listReviewCriteriaForCourse(courseId: string): Promise<ReviewCriteria[]>
  getCourseCapabilityCoverage(courseId: string): Promise<CourseCapabilityCoverage[]>
  listReviewQueue(facultyId: string, filters?: ReviewQueueFilters): Promise<ReviewQueueEntry[]>
  getEvidenceReviewDetail(evidenceId: string): Promise<FacultyEvidenceReviewDetail | undefined>
  listReviewHistory(evidenceId: string): Promise<ReviewHistoryEntry[]>
  computeImpactPreview(evidenceId: string, decisionType: ReviewDecisionType): Promise<ReviewImpactPreview>
  commitReviewDecision(facultyId: string, input: CommitReviewDecisionInput): Promise<{ decision: FacultyReviewDecision; updatedStatus: EvidenceStatus }>
  listFacultyStudents(facultyId: string): Promise<FacultyVisibleStudentContext[]>
  getFacultyStudentDetail(facultyId: string, studentId: string): Promise<FacultyVisibleStudentContext | undefined>
  getWorkloadSummary(facultyId: string): Promise<FacultyWorkloadSummary>
  getAnalyticsSummary(facultyId: string): Promise<FacultyAnalyticsSummary>
}

export const mockFacultyRepository: FacultyRepository = {
  async getProfile(facultyId) {
    return facultyProfile.id === facultyId ? facultyProfile : undefined
  },

  async listCourseAssignments(facultyId) {
    return facultyCourseAssignments.filter((a) => a.facultyId === facultyId)
  },

  async listReviewCriteriaForCourse(courseId) {
    return reviewCriteria.filter((c) => c.courseId === courseId)
  },

  async getCourseCapabilityCoverage(courseId) {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return []
    const criteria = reviewCriteria.filter((c) => c.courseId === courseId)
    const allEvidence = await mockEvidenceRepository.listForStudent(currentUser.id)
    const claims = await mockCapabilityRepository.listClaimsForSubject(currentUser.id)

    return Promise.all(
      course.capabilityIds.map(async (capabilityId): Promise<CourseCapabilityCoverage> => {
        const definition = await mockCapabilityRepository.getDefinition(capabilityId)
        const criterion = criteria.find((c) => c.capabilityId === capabilityId)
        const relevantEvidence = allEvidence.filter((e) => e.record.courseId === courseId && e.record.capabilityIds.includes(capabilityId))
        const claim = claims.find((c) => c.capabilityId === capabilityId)
        const awaitingReview = relevantEvidence.filter((e) => effectiveStatus(e.record.id, e.review.status) === 'pending').length

        return {
          courseId,
          capabilityId,
          capabilityName: definition?.name ?? capabilityId,
          intended: Boolean(criterion),
          evidenceRequirementDescription: criterion?.description ?? 'No formal review criteria on record for this capability.',
          expectedMaturityRange: criterion?.expectedMaturity ? [criterion.expectedMaturity, criterion.expectedMaturity] : undefined,
          evidenceProducedCount: relevantEvidence.length,
          studentsWithInsufficientEvidence: claim && relevantEvidence.length === 0 ? 1 : 0,
          claimsAwaitingReview: awaitingReview,
        }
      })
    )
  },

  async listReviewQueue(facultyId, filters) {
    const assignments = await this.listCourseAssignments(facultyId)
    const courseIds = new Set(assignments.map((a) => a.courseId))
    const allEvidence = await mockEvidenceRepository.listForStudent(currentUser.id)
    const relevant = allEvidence.filter((e) => !e.record.courseId || courseIds.has(e.record.courseId))

    let entries = await Promise.all(relevant.map(buildQueueEntry))

    if (filters?.status && filters.status !== 'all') entries = entries.filter((e) => e.status === filters.status)
    if (filters?.courseId && filters.courseId !== 'all') entries = entries.filter((e) => e.courseId === filters.courseId)
    if (filters?.sourceType && filters.sourceType !== 'all') entries = entries.filter((e) => e.sourceType === filters.sourceType)
    if (filters?.studentId && filters.studentId !== 'all') entries = entries.filter((e) => e.studentId === filters.studentId)

    return entries.sort((a, b) => b.ageDays - a.ageDays)
  },

  async getEvidenceReviewDetail(evidenceId) {
    const item = await mockEvidenceRepository.get(evidenceId)
    if (!item) return undefined
    const { record } = item

    const [capabilityDefs, claims, criteria, history, predecessor, superseding, studentName, courseLabel] = await Promise.all([
      Promise.all(record.capabilityIds.map((id) => mockCapabilityRepository.getDefinition(id))),
      mockCapabilityRepository.listClaimsForSubject(record.studentId),
      record.courseId ? this.listReviewCriteriaForCourse(record.courseId) : Promise.resolve([]),
      this.listReviewHistory(evidenceId),
      record.supersedesEvidenceId ? mockEvidenceRepository.get(record.supersedesEvidenceId) : Promise.resolve(undefined),
      mockEvidenceRepository.getSupersedingRecord(evidenceId),
      studentNameFor(record.studentId),
      courseLabelFor(record.courseId),
    ])

    const linkedCapabilities = record.capabilityIds.map((id, i) => {
      const def = capabilityDefs[i]
      const claim = claims.find((c) => c.capabilityId === id)
      return { id, name: def?.name ?? id, maturity: claim?.maturity, confidenceBand: claim?.confidence.band }
    })

    return {
      item,
      effectiveStatus: effectiveStatus(evidenceId, item.review.status),
      studentName,
      courseLabel,
      linkedCapabilities,
      criteria,
      history,
      priorVersion: predecessor,
      supersedingVersion: superseding,
    }
  },

  async listReviewHistory(evidenceId) {
    const decisions = store.decisionsByEvidenceId.get(evidenceId) ?? []
    return [...decisions].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()).map((decision) => ({ decision, evidenceVersionId: evidenceId }))
  },

  async computeImpactPreview(evidenceId, decisionType) {
    const item = await mockEvidenceRepository.get(evidenceId)
    if (!item) {
      return { evidenceId, decisionType, likelyAffectedCapabilities: [], newlyEligibleForPassportCapabilityNames: [], odysseyMilestonesLikelyUnblocked: [], remainingEvidenceGaps: [], isPreview: true }
    }
    const { record } = item
    const claims = await mockCapabilityRepository.listClaimsForSubject(record.studentId)
    const capabilityDefs = await Promise.all(record.capabilityIds.map((id) => mockCapabilityRepository.getDefinition(id)))

    const direction: 'increase' | 'no_change' | 'decrease' =
      decisionType === 'approve' ? 'increase' : decisionType === 'revoke' ? 'decrease' : 'no_change'

    const likelyAffectedCapabilities = record.capabilityIds.map((id, i) => {
      const def = capabilityDefs[i]
      const claim = claims.find((c) => c.capabilityId === id)
      const rationale =
        direction === 'increase'
          ? `Approving would count as additional supporting evidence toward ${def?.name ?? id}.`
          : direction === 'decrease'
            ? `Revoking would remove this evidence's contribution to ${def?.name ?? id}.`
            : `${decisionType === 'request_revision' || decisionType === 'dispute_attribution' ? 'No capability effect until revised and resubmitted.' : 'No capability effect from this action alone.'}`
      return {
        capabilityId: id,
        capabilityName: def?.name ?? id,
        currentMaturity: claim?.maturity ?? 'Exposed',
        currentConfidence: claim?.confidence.band ?? 'Unsupported',
        likelyDirection: direction,
        rationale,
      }
    })

    const newlyEligibleForPassportCapabilityNames =
      decisionType === 'approve'
        ? likelyAffectedCapabilities.filter((c) => c.currentConfidence === 'Supported' || c.currentConfidence === 'Strong').map((c) => c.capabilityName)
        : []

    const odysseyMilestones = await mockOdysseyRepository.getCurrentPlanVersion(record.studentId).then((v) =>
      v ? mockOdysseyRepository.getMilestonesForVersion(record.studentId, v.id) : []
    )
    const odysseyMilestonesLikelyUnblocked =
      decisionType === 'approve'
        ? odysseyMilestones.filter((m) => m.status === 'blocked' && m.capabilityIds.some((id) => record.capabilityIds.includes(id))).map((m) => m.title)
        : []

    const criteria = record.courseId ? reviewCriteria.filter((c) => c.courseId === record.courseId && record.capabilityIds.includes(c.capabilityId)) : []
    const remainingEvidenceGaps = criteria
      .filter((c) => {
        const claim = claims.find((cl) => cl.capabilityId === c.capabilityId)
        return !claim || claim.maturity === 'Exposed' || claim.maturity === 'Emerging'
      })
      .map((c) => `Additional evidence still needed for: ${c.description}`)

    return {
      evidenceId,
      decisionType,
      likelyAffectedCapabilities,
      newlyEligibleForPassportCapabilityNames,
      odysseyMilestonesLikelyUnblocked,
      remainingEvidenceGaps,
      isPreview: true,
    }
  },

  async commitReviewDecision(facultyId, input) {
    const decision: FacultyReviewDecision = {
      id: `frd-${Date.now().toString(36)}`,
      evidenceId: input.evidenceId,
      decisionType: input.decisionType,
      rationale: input.rationale,
      limitations: input.limitations,
      supportedCapabilityIds: input.supportedCapabilityIds,
      unsupportedCapabilityIds: input.unsupportedCapabilityIds,
      provenanceConcern: input.provenanceConcern,
      decidedBy: facultyId,
      decidedAt: new Date().toISOString(),
    }
    store.decisionsByEvidenceId.set(input.evidenceId, [...(store.decisionsByEvidenceId.get(input.evidenceId) ?? []), decision])

    const newStatus = DECISION_TO_STATUS[input.decisionType]
    const item = await mockEvidenceRepository.get(input.evidenceId)
    const baseStatus = item?.review.status ?? 'pending'
    if (newStatus) store.statusOverrideByEvidenceId.set(input.evidenceId, newStatus)

    return { decision, updatedStatus: effectiveStatus(input.evidenceId, baseStatus) }
  },

  async listFacultyStudents(facultyId) {
    const assignments = await this.listCourseAssignments(facultyId)
    const courseIds = new Set(assignments.map((a) => a.courseId))
    // This mock dataset models a single student; a real institution would join enrollment records here.
    const detail = await this.getFacultyStudentDetail(facultyId, currentUser.id)
    return detail && Array.from(courseIds).length > 0 ? [detail] : []
  },

  async getFacultyStudentDetail(facultyId, studentId) {
    if (studentId !== currentUser.id) return undefined
    const assignments = await this.listCourseAssignments(facultyId)
    const relevantCourseIds = assignments.map((a) => a.courseId)
    const evidence = await mockEvidenceRepository.listForStudent(studentId)
    const relevantEvidence = evidence.filter((e) => e.record.courseId && relevantCourseIds.includes(e.record.courseId))
    const claims = await mockCapabilityRepository.listClaimsForSubject(studentId)
    const relevantCapabilityIds = new Set(courses.filter((c) => relevantCourseIds.includes(c.id)).flatMap((c) => c.capabilityIds))
    const capabilityClaimsInFacultyCourses = await Promise.all(
      claims
        .filter((c) => relevantCapabilityIds.has(c.capabilityId))
        .map(async (c) => ({
          capabilityId: c.capabilityId,
          capabilityName: (await mockCapabilityRepository.getDefinition(c.capabilityId))?.name ?? c.capabilityId,
          maturity: c.maturity,
          confidence: c.confidence.band,
        }))
    )

    const currentPlanVersion = await mockOdysseyRepository.getCurrentPlanVersion(studentId)
    const milestones = currentPlanVersion ? await mockOdysseyRepository.getMilestonesForVersion(studentId, currentPlanVersion.id) : []
    const odysseyMilestoneTitlesLinkedToFacultyCourses = milestones
      .filter((m) => m.capabilityIds.some((id) => relevantCapabilityIds.has(id)))
      .map((m) => m.title)

    return {
      studentId,
      studentName: currentUser.name,
      programmeName: programme.name,
      relevantCourseIds,
      evidenceSubmittedCount: relevantEvidence.length,
      pendingEvidenceCount: relevantEvidence.filter((e) => effectiveStatus(e.record.id, e.review.status) === 'pending').length,
      evidenceNeedingRevisionCount: relevantEvidence.filter((e) => effectiveStatus(e.record.id, e.review.status) === 'disputed').length,
      capabilityClaimsInFacultyCourses,
      odysseyMilestoneTitlesLinkedToFacultyCourses,
    }
  },

  async getWorkloadSummary(facultyId) {
    const queue = await this.listReviewQueue(facultyId)
    const pending = queue.filter((e) => e.status === 'pending')
    const overdue = pending.filter((e) => e.ageDays > 7)
    const decidedRecently = Array.from(store.decisionsByEvidenceId.values())
      .flat()
      .filter((d) => d.decidedBy === facultyId && ageDays(d.decidedAt) <= 30)
    const turnarounds = decidedRecently
      .map((d) => {
        const record = queue.find((e) => e.evidenceId === d.evidenceId)
        return record ? Math.max(0, (new Date(d.decidedAt).getTime() - new Date(record.submittedAt).getTime()) / 86_400_000) : undefined
      })
      .filter((n): n is number => typeof n === 'number')

    return {
      facultyId,
      pendingReviewCount: pending.length,
      overdueReviewCount: overdue.length,
      averageTurnaroundDays: turnarounds.length > 0 ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10) / 10 : 0,
      reviewsCompletedLast30Days: decidedRecently.length,
      coursesTaught: (await this.listCourseAssignments(facultyId)).length,
    }
  },

  async getAnalyticsSummary(facultyId) {
    const queue = await this.listReviewQueue(facultyId)
    const decisions = Array.from(store.decisionsByEvidenceId.values()).flat()
    const decidedLast30 = decisions.filter((d) => ageDays(d.decidedAt) <= 30)
    const revisionDecisions = decisions.filter((d) => d.decisionType === 'request_revision' || d.decisionType === 'dispute_attribution')

    const statusDistribution = queue.reduce(
      (acc, e) => ({ ...acc, [e.status]: (acc[e.status] ?? 0) + 1 }),
      { pending: 0, verified: 0, disputed: 0, revoked: 0 } as Record<EvidenceStatus, number>
    )
    const evidenceTypeDistribution = queue.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.sourceType]: (acc[e.sourceType] ?? 0) + 1 }), {})

    const assignments = await this.listCourseAssignments(facultyId)
    const courseCoverage = await Promise.all(
      assignments.map(async (a) => {
        const coverage = await this.getCourseCapabilityCoverage(a.courseId)
        const course = courses.find((c) => c.id === a.courseId)
        return {
          courseId: a.courseId,
          courseLabel: course ? `${course.code} ${course.title}` : a.courseId,
          capabilitiesCovered: coverage.filter((c) => c.evidenceProducedCount > 0).length,
          evidenceGaps: coverage.filter((c) => c.evidenceProducedCount === 0).length,
        }
      })
    )

    const turnarounds = decidedLast30
      .map((d) => {
        const entry = queue.find((e) => e.evidenceId === d.evidenceId)
        return entry ? Math.max(0, (new Date(d.decidedAt).getTime() - new Date(entry.submittedAt).getTime()) / 86_400_000) : undefined
      })
      .filter((n): n is number => typeof n === 'number')

    return {
      reviewVolumeLast30Days: decidedLast30.length,
      reviewsCompletedLast30Days: decidedLast30.length,
      averageTurnaroundDays: turnarounds.length > 0 ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10) / 10 : 0,
      agingSubmissionsOver7Days: queue.filter((e) => e.status === 'pending' && e.ageDays > 7).length,
      revisionRate: decisions.length > 0 ? Math.round((revisionDecisions.length / decisions.length) * 100) / 100 : 0,
      statusDistribution,
      evidenceTypeDistribution: evidenceTypeDistribution as FacultyAnalyticsSummary['evidenceTypeDistribution'],
      courseCoverage,
      studentsAwaitingReviewCount: new Set(queue.filter((e) => e.status === 'pending').map((e) => e.studentId)).size,
    }
  },
}
