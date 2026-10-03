import type { Programme } from './institution'
import type { CapabilityMaturity } from './capability'
import type { ConfidenceBand } from './confidence'
import type { EvidenceStatus, EvidenceSourceType } from './evidence'

/**
 * Department Administration domain — "University Administration scoped to a
 * department" (see AdministratorScope in user.ts), not a new persona or
 * ontology concept. This module adds only what Institution/Programme/Course/
 * Capability/Evidence/Faculty/Odyssey/Passport don't already model:
 * programme-level intent, intended-vs-observed coverage, cohorts,
 * curriculum-alignment breakdown, and interventions. Intended coverage,
 * observed Evidence, Capability claims, Evidence reviews, interventions,
 * expected effects, and final institutional outcomes are kept as separate
 * types on purpose — never collapsed into one convenience object.
 */

// --- Programme intent -------------------------------------------------

export interface ProgrammeOutcome {
  id: string
  programmeId: string
  title: string
  description: string
  capabilityIds: string[]
}

/** Declared intent: this course is meant to contribute to this capability, in service of this outcome. Design-time, not observed. */
export interface ProgrammeCapabilityRelationship {
  id: string
  programmeId: string
  courseId: string
  capabilityId: string
  outcomeId: string
  intendedMaturity?: CapabilityMaturity
}

/** What an assessment is designed to produce Evidence for — the design-time counterpart to the EvidenceRecords it actually yields. */
export interface AssessmentEvidenceRequirement {
  id: string
  courseId: string
  assessmentTitle: string
  capabilityIds: string[]
  description: string
}

export type ProgrammeCoverageState = 'covered' | 'under_covered' | 'over_concentrated' | 'missing_evidence' | 'stale_evidence' | 'review_bottleneck'

/**
 * A denormalized, read-only row merging intent (ProgrammeCapabilityRelationship)
 * with observed reality (Evidence + CapabilityClaim) for one outcome/capability
 * pair — built by the repository, never stored as its own entity. Backs both
 * the programme capability map and the curriculum-alignment breakdown.
 */
export interface ObservedProgrammeCoverage {
  outcomeId: string
  outcomeTitle: string
  capabilityId: string
  capabilityName: string
  courseIds: string[]
  courseLabels: string[]
  intendedMaturity?: CapabilityMaturity
  assessmentsDesigned: number
  evidenceProduced: number
  claimsAtOrAboveIntendedMaturity: number
  claimsBelowIntendedMaturity: number
  reviewsPending: number
  coverageState: ProgrammeCoverageState
}

// --- Programme health (list/overview row) -----------------------------

export type ReviewHealthLabel = 'on_track' | 'attention_needed' | 'at_risk'

export interface ProgrammeHealthSummary {
  programmeId: string
  programmeName: string
  degreeLevel: Programme['degreeLevel']
  activeTerm: string
  cohortSize: number
  intendedCapabilityCount: number
  observedCapabilityCoveragePercent: number
  evidenceProducingCourseCount: number
  totalCourseCount: number
  unresolvedEvidenceCount: number
  reviewHealth: ReviewHealthLabel
  gapCount: number
  activeInterventionCount: number
}

// --- Cohorts ------------------------------------------------------------

export interface Cohort {
  id: string
  programmeId: string
  name: string
  startYear: number
  studentIds: string[]
}

export interface CohortCapabilitySummary {
  cohortId: string
  capabilityId: string
  capabilityName: string
  maturityDistribution: Partial<Record<CapabilityMaturity, number>>
  studentsWithoutEvidence: number
}

export interface CohortEvidenceSummary {
  cohortId: string
  totalEvidenceRecords: number
  pendingReviewCount: number
  disputedCount: number
  agingOver7DaysCount: number
  studentsAwaitingReviewCount: number
}

/** Denormalized per-student row for the cohort/intervention student surface — read-only, built by the repository. */
export interface CohortStudentFlag {
  studentId: string
  studentName: string
  cohortId: string
  programmeId: string
  capabilityGapCount: number
  unresolvedEvidenceCount: number
  staleClaimCount: number
  passportReadinessBlockerCount: number
  odysseyBlockerCount: number
  needsIntervention: boolean
}

// --- Curriculum alignment (section 15's break-point chain) -------------

export type CurriculumAlignmentBreakType =
  | 'no_course_addresses_outcome'
  | 'course_without_evidence_producing_assessment'
  | 'assessment_without_sufficient_evidence'
  | 'evidence_awaiting_review'
  | 'reviewed_but_insufficient_confidence'
  | 'capability_stale'
  | 'capability_not_in_passport'

export interface CurriculumAlignmentIssue {
  id: string
  programmeId: string
  outcomeId: string
  capabilityId: string
  capabilityName: string
  breakType: CurriculumAlignmentBreakType
  description: string
  affectedCourseIds: string[]
  affectedCohortIds: string[]
}

// --- Evidence health / governance ---------------------------------------

export interface EvidenceHealthSummary {
  statusDistribution: Record<EvidenceStatus, number>
  typeDistribution: Partial<Record<EvidenceSourceType, number>>
  courseSourceCounts: { courseId: string; courseLabel: string; evidenceCount: number }[]
  reviewAgeingBuckets: { bucketLabel: string; count: number }[]
  revisionRate: number
  disputedCount: number
  revokedCount: number
  supersededCount: number
  provenanceConcernCount: number
  weakestSourceCourseIds: string[]
  strongestSourceCourseIds: string[]
  reviewBottleneckCourseIds: string[]
}

// --- Faculty coordination -------------------------------------------------

export interface ReviewCapacitySummary {
  departmentId: string
  facultyCount: number
  totalPendingReviews: number
  totalOverdueReviews: number
  averageTurnaroundDays: number
  facultyNeedingSupport: { facultyId: string; facultyName: string; pendingReviewCount: number; overdueReviewCount: number }[]
}

// --- Interventions (sections 13-14) -------------------------------------

export type InterventionType =
  | 'revise_assessment'
  | 'add_evidence_project'
  | 'increase_review_capacity'
  | 'require_reviewer_calibration'
  | 'add_prerequisite_module'
  | 'modify_course_capability_mapping'
  | 'support_cohort'
  | 'commission_curriculum_review'
  | 'address_provenance_concern'
  | 'refresh_stale_evidence'

export type InterventionStatus = 'planned' | 'active' | 'awaiting_evaluation' | 'complete' | 'discontinued'

/**
 * A departmental intervention — session-only demo persistence (mirrors the
 * Faculty review-decision store). Expected effects are always framed as
 * projections; creating an intervention never itself changes any Capability,
 * Evidence, or Passport outcome.
 */
export interface DepartmentIntervention {
  id: string
  type: InterventionType
  title: string
  rationale: string
  programmeId?: string
  courseId?: string
  capabilityIds: string[]
  cohortId?: string
  ownerId: string
  ownerName: string
  status: InterventionStatus
  createdAt: string
  /** Always a projection — never a guarantee, and always labelled as such in the UI. */
  expectedEffect: string
  evidenceRequiredToEvaluate: string
  limitations: string
  reviewDate: string
}

export interface CreateInterventionInput {
  type: InterventionType
  title: string
  rationale: string
  programmeId?: string
  courseId?: string
  capabilityIds: string[]
  cohortId?: string
  ownerId: string
  ownerName: string
  expectedEffect: string
  evidenceRequiredToEvaluate: string
  limitations: string
  reviewDate: string
}

// --- Department analytics -------------------------------------------------

export interface DepartmentAnalyticsResult {
  reviewTurnaroundTrend: { periodLabel: string; averageDays: number }[]
  evidenceStatusDistribution: Record<EvidenceStatus, number>
  evidenceTypeDistribution: Partial<Record<EvidenceSourceType, number>>
  maturityDistribution: Partial<Record<CapabilityMaturity, number>>
  confidenceBandDistribution: Partial<Record<ConfidenceBand, number>>
  revisionRate: number
  staleClaimCount: number
  curriculumCoverageGapCount: number
  passportBlockerCount: number
  odysseyBlockerCount: number
  /** Explicit source/context explanation shown next to every visualization. */
  generatedFrom: string
}

// --- Course administration (distinct from the Faculty course view) -----

/** Denormalized read-only row — the Department's perspective on a course as part of a wider programme/Capability architecture, not the Faculty teaching/review view. */
export interface CourseAdminSummary {
  courseId: string
  courseCode: string
  courseTitle: string
  programmeId: string
  programmeName: string
  responsibleFacultyNames: string[]
  term: string
  enrolledStudentCount: number
  intendedCapabilityCount: number
  evidenceProducingAssessmentCount: number
  totalAssessmentCount: number
  unresolvedEvidenceCount: number
  reviewCompletionPercent: number
  activeInterventionCount: number
}

export interface CourseAdminDetail extends CourseAdminSummary {
  outcomeTitles: string[]
  coverage: ObservedProgrammeCoverage[]
  commonLimitations: string[]
  interventions: DepartmentIntervention[]
}

// --- Capability intelligence (department-scoped) ------------------------

export interface CapabilityIntelligenceSummary {
  domainCount: number
  maturityDistribution: Partial<Record<CapabilityMaturity, number>>
  confidenceBandDistribution: Partial<Record<ConfidenceBand, number>>
  staleClaimCount: number
  revokedClaimCount: number
  gapCount: number
  courseContribution: { courseId: string; courseLabel: string; capabilitiesCovered: number }[]
  evidenceSourceTypeDiversity: Partial<Record<EvidenceSourceType, number>>
  recommendedAttentionAreas: string[]
}

// --- Faculty coordination (workload/process-health, never a ranking) ---

export interface FacultyCoordinationRow {
  facultyId: string
  facultyName: string
  title?: string
  coursesTaught: { courseId: string; courseLabel: string }[]
  pendingReviewCount: number
  overdueReviewCount: number
  reviewCompletionPercent: number
  capabilityDomainsCovered: string[]
  supportStatus: 'none_needed' | 'monitor' | 'support_recommended'
}

// --- Department overview (operational priorities, not a metric grid) ----

export type DepartmentPriorityUrgency = 'high' | 'medium' | 'low'

/** One actionable, interpretable operational item — the overview's core unit, not a KPI tile. */
export interface DepartmentPriority {
  id: string
  urgency: DepartmentPriorityUrgency
  summary: string
  detail: string
  relatedProgrammeId?: string
  relatedCourseId?: string
  actionLabel: string
  actionHref: string
}
