import type { CapabilityMaturity } from './capability'
import type { ConfidenceBand } from './confidence'
import type { EvidenceStatus, EvidenceSourceType } from './evidence'
import type { ReviewHealthLabel } from './department'
import type { PassportClaimVerificationState } from './passport'

/**
 * University Administration domain — institution-wide. Department
 * Administration is University Administration scoped to one department
 * (see AdministratorScope in user.ts); this module is the unscoped view
 * across all departments, reusing Department's own computed types and
 * repository rather than duplicating their logic. Strategy, intended
 * coverage, observed Evidence, Capability claims, inference, Passport
 * claims, Odyssey recommendations, governance policy, interventions,
 * expected effects, and observed outcomes are all kept as separate types —
 * never merged into one UniversityDashboard object.
 */

// --- Department portfolio -------------------------------------------------

export interface InstitutionalDepartmentSummary {
  departmentId: string
  departmentName: string
  programmeCount: number
  studentCount: number
  facultyCount: number
  intendedCapabilityCount: number
  observedCapabilityCoveragePercent: number
  evidenceHealthLabel: ReviewHealthLabel
  reviewCapacityConstrained: boolean
  passportReadinessBlockerCount: number
  odysseyBlockerCount: number
  activeInterventionCount: number
  governanceConcernCount: number
}

/** University-level perspective on a department — comparison against institutional expectations, not a copy of the Department user's own dashboard. */
export interface DepartmentInstitutionalDetail extends InstitutionalDepartmentSummary {
  expectedCapabilityCoveragePercent: number
  sharedCapabilityGapNames: string[]
  crossDepartmentDependencyNotes: string[]
  programmesRequiringSupport: { programmeId: string; programmeName: string; reason: string }[]
  institutionalInterventionsAffecting: string[]
  governanceEscalations: string[]
}

// --- Programme portfolio ---------------------------------------------------

/** Denormalized read-only row — institution-wide programme intelligence, reusing Department's ProgrammeHealthSummary fields rather than re-deriving them. */
export interface ProgrammePortfolioEntry {
  programmeId: string
  programmeName: string
  departmentId: string
  departmentName: string
  degreeLevel: 'undergraduate' | 'graduate' | 'doctoral'
  cohortSize: number
  intendedCapabilityCount: number
  observedCapabilityCoveragePercent: number
  evidenceProducingCourseCount: number
  totalCourseCount: number
  reviewHealth: ReviewHealthLabel
  curriculumAlignmentIssueCount: number
  odysseyBlockerCount: number
  passportReadinessBlockerCount: number
  interventionStatus: 'none' | 'planned' | 'active' | 'awaiting_evaluation'
}

// --- Institutional Capability strategy/architecture ------------------------

export interface InstitutionalCapabilityStrategy {
  domainCount: number
  maturityDistribution: Partial<Record<CapabilityMaturity, number>>
  confidenceBandDistribution: Partial<Record<ConfidenceBand, number>>
  staleClaimCount: number
  revokedClaimCount: number
  gapCount: number
  departmentCoverage: { departmentId: string; departmentName: string; capabilitiesCovered: number }[]
  programmeCoverage: { programmeId: string; programmeName: string; capabilitiesCovered: number }[]
  prerequisiteWeaknesses: string[]
  evidenceSourceTypeDiversity: Partial<Record<EvidenceSourceType, number>>
  investmentAreas: string[]
  strongSupportAreas: string[]
}

/** One layer of the institutional Capability architecture chain — used for the accessible layered-map/table view. */
export interface CapabilityArchitectureLayer {
  id: string
  title: string
  description: string
  exampleCount: number
}

// --- Evidence governance ---------------------------------------------------

export interface EvidenceGovernanceSummary {
  statusDistribution: Record<EvidenceStatus, number>
  typeDistribution: Partial<Record<EvidenceSourceType, number>>
  departmentSourceCounts: { departmentId: string; departmentName: string; evidenceCount: number }[]
  programmeGapCount: number
  departmentGapCount: number
  reviewAgeingBuckets: { bucketLabel: string; count: number }[]
  revisionRate: number
  disputedCount: number
  revokedCount: number
  supersededCount: number
  provenanceConcernCount: number
  assessmentConcentrationNotes: string[]
  reviewBottleneckDepartmentIds: string[]
  inconsistentReviewPatternNotes: string[]
}

// --- Faculty capacity -------------------------------------------------------

export interface FacultyCapacityRow {
  facultyId: string
  facultyName: string
  departmentId: string
  departmentName: string
  coursesTaught: { courseId: string; courseLabel: string }[]
  programmeResponsibilities: string[]
  pendingReviewCount: number
  overdueReviewCount: number
  capabilityDomainsCovered: string[]
  crossDepartment: boolean
  calibrationNeeded: boolean
  supportStatus: 'none_needed' | 'monitor' | 'support_recommended'
}

export interface InstitutionalFacultyCapacitySummary {
  totalFacultyCount: number
  totalPendingReviews: number
  totalOverdueReviews: number
  averageTurnaroundDays: number
  departmentsConstrained: string[]
  rows: FacultyCapacityRow[]
}

// --- Institutional cohort / student intelligence ---------------------------

export interface InstitutionalCohortSummary {
  cohortId: string
  cohortName: string
  programmeId: string
  programmeName: string
  departmentId: string
  departmentName: string
  studentCount: number
  capabilityGapCount: number
  unresolvedEvidenceCount: number
  staleClaimCount: number
  odysseyBlockerCount: number
  passportReadinessBlockerCount: number
}

// --- Odyssey aggregate intelligence -----------------------------------------

export interface OdysseyAggregateInsight {
  activeDestinationTitles: string[]
  commonCapabilityGapNames: string[]
  commonMilestoneBlockerReasons: string[]
  evidenceRequirementsCausingDelay: string[]
  frequentlyRecommendedResourceTitles: string[]
  unavailableInstitutionalResourceNotes: string[]
  reviewGateDelayNotes: string[]
  alternativePathwaysRequestedCount: number
  programmePatterns: { programmeId: string; programmeName: string; blockedMilestoneCount: number }[]
  departmentPatterns: { departmentId: string; departmentName: string; blockedMilestoneCount: number }[]
}

// --- Passport readiness / issuance boundary ---------------------------------

export interface PassportReadinessAggregate {
  verificationStateDistribution: Record<PassportClaimVerificationState, number>
  readyClaimCount: number
  withheldClaimCount: number
  claimsAwaitingReviewCount: number
  staleClaimCount: number
  revokedClaimCount: number
  commonReadinessBlockerReasons: string[]
  programmeReadiness: { programmeId: string; programmeName: string; readyClaimCount: number; withheldClaimCount: number }[]
  departmentReadiness: { departmentId: string; departmentName: string; readyClaimCount: number; withheldClaimCount: number }[]
  evidenceGapsPreventingInclusion: string[]
  reissuePatternNotes: string[]
}

/** The explicit, never-collapsed issuance boundary chain (spec section 14). */
export type PassportIssuanceStage = 'evidence_reviewed' | 'capability_claim_supported' | 'passport_claim_eligible' | 'passport_version_prepared' | 'passport_issued' | 'passport_claim_updated'

export interface PassportIssuanceStageCount {
  stage: PassportIssuanceStage
  label: string
  count: number
}

// --- Governance --------------------------------------------------------------

export type GovernancePolicyArea =
  | 'capability_taxonomy'
  | 'programme_capability_mapping'
  | 'evidence_standards'
  | 'review_criteria'
  | 'review_calibration'
  | 'evidence_provenance'
  | 'passport_issuance'
  | 'disclosure_policy'
  | 'odyssey_recommendation_authority'
  | 'ai_authority_boundaries'
  | 'data_access_purpose'
  | 'role_boundaries'
  | 'versioning'

export type GovernancePolicyState = 'active_policy' | 'proposed_policy' | 'demo_configuration' | 'requires_backend_integration'

export interface GovernancePolicy {
  id: string
  area: GovernancePolicyArea
  title: string
  description: string
  state: GovernancePolicyState
  lastReviewedAt?: string
}

export interface GovernanceProposal {
  id: string
  area: GovernancePolicyArea
  title: string
  rationale: string
  proposedBy: string
  proposedAt: string
  status: 'draft' | 'under_review' | 'accepted' | 'rejected'
}

// --- Institutional interventions (extends the Department intervention model) ---

export type InstitutionalInterventionType =
  | 'institution_wide_calibration'
  | 'cross_department_curriculum_review'
  | 'evidence_project_framework'
  | 'shared_research_opportunity'
  | 'central_review_capacity_programme'
  | 'capability_taxonomy_revision'
  | 'passport_readiness_initiative'
  | 'odyssey_resource_expansion'
  | 'evidence_provenance_audit'
  | 'stale_evidence_refresh_programme'

export type InstitutionalInterventionStatus = 'planned' | 'active' | 'awaiting_evaluation' | 'complete' | 'discontinued'

export interface InstitutionalIntervention {
  id: string
  type: InstitutionalInterventionType
  title: string
  rationale: string
  affectedDepartmentIds: string[]
  affectedProgrammeIds: string[]
  affectedCapabilityIds: string[]
  affectedCohortIds: string[]
  ownerId: string
  ownerName: string
  status: InstitutionalInterventionStatus
  createdAt: string
  reviewDate: string
  /** Always a projection — never a guarantee. */
  expectedEffect: string
  evidenceRequiredToEvaluate: string
  limitations: string
  outcomeSummary?: string
}

export interface CreateInstitutionalInterventionInput {
  type: InstitutionalInterventionType
  title: string
  rationale: string
  affectedDepartmentIds: string[]
  affectedProgrammeIds: string[]
  affectedCapabilityIds: string[]
  affectedCohortIds: string[]
  ownerId: string
  ownerName: string
  expectedEffect: string
  evidenceRequiredToEvaluate: string
  limitations: string
  reviewDate: string
}

// --- Institutional priorities -----------------------------------------------

export type InstitutionalPriorityUrgency = 'high' | 'medium' | 'low'

export interface InstitutionalPriority {
  id: string
  title: string
  rationale: string
  supportingSignals: string[]
  urgency: InstitutionalPriorityUrgency
  affectedDepartmentIds: string[]
  owner: string
  recommendedIntervention: string
  expectedEffect: string
  reviewState: 'identified' | 'intervention_proposed' | 'intervention_active'
  limitations: string
  actionHref: string
}

// --- University analytics ----------------------------------------------------

export interface UniversityAnalyticsResult {
  reviewTurnaroundTrend: { periodLabel: string; averageDays: number }[]
  evidenceStatusDistribution: Record<EvidenceStatus, number>
  maturityDistribution: Partial<Record<CapabilityMaturity, number>>
  confidenceBandDistribution: Partial<Record<ConfidenceBand, number>>
  revisionRate: number
  staleClaimCount: number
  curriculumAlignmentIssueCount: number
  passportReadinessBlockerCount: number
  odysseyBlockerCount: number
  departmentCount: number
  programmeCount: number
  generatedFrom: string
}
