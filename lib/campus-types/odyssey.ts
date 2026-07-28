import type { ConfidenceBand } from './confidence'
import type { CapabilityMaturity } from './capability'
import type { EvidenceSourceType } from './evidence'

/**
 * Odyssey — the growth/progression and navigation layer (UX-001, ADR-002 §3).
 * Sequence: Evidence -> Capability -> Odyssey -> Academic Passport.
 *
 * The domain model here is the source of truth. The visual roadmap
 * (lib/utilities/odyssey-projection.ts) is only a projection of it —
 * coordinates, renderer types, and viewport state never live on these
 * types, and never get written back into them.
 */

export type OdysseyMilestoneType =
  | 'goal'
  | 'capability_target'
  | 'capability_gap'
  | 'course'
  | 'module'
  | 'project'
  | 'assessment'
  | 'research_opportunity'
  | 'internship'
  | 'competition'
  | 'credential'
  | 'career_milestone'
  | 'human_review'
  // Added for the NCERT Class X curriculum-progression pathway (Odyssey
  // product correction) — a chapter/concept-level unit of progress is not
  // well described by 'course'/'module', which are university-scoped.
  | 'chapter_progress'
  | 'revision'
  | 'transfer_task'
  | 'evidence_mission'

export type OdysseyMilestoneStatus =
  | 'recommended'
  | 'accepted'
  | 'planned'
  | 'in_progress'
  | 'evidence_pending'
  | 'under_review'
  | 'completed'
  | 'verified'
  | 'deferred'
  | 'blocked'
  | 'superseded'
  | 'no_longer_relevant'

/**
 * One node in the plan. References canonical capabilities, evidence
 * requirements, actions, etc. by id — never duplicates their content.
 */
export interface OdysseyMilestone {
  id: string
  type: OdysseyMilestoneType
  title: string
  description: string

  capabilityIds: string[]
  prerequisiteMilestoneIds: string[]

  currentMaturity?: CapabilityMaturity
  targetMaturity?: CapabilityMaturity
  currentConfidence?: ConfidenceBand
  targetConfidence?: ConfidenceBand

  actionIds: string[]
  evidenceRequirementIds: string[]
  expectedImpactIds: string[]

  estimatedEffort?: string
  /** Concise, product-level reasoning — never raw model chain-of-thought. */
  reasoningSummary: string
  alternativeActionIds: string[]
  constraintIds: string[]

  recommendationConfidence: ConfidenceBand
  status: OdysseyMilestoneStatus

  /** What produced this milestone — recommendation factor ids, evidence ids, etc. */
  sourceSignalIds: string[]
  planVersionId: string

  /** Present only when status is 'blocked'. */
  blockedReason?: string
  /** What completing this milestone would change. */
  completionImpact: string

  /**
   * Curriculum-progression-pathway fields (Odyssey product correction) —
   * present only on milestones grounded in a real canonical NCERT chapter,
   * never invented for career-pathway milestones. `subjectLane` groups
   * milestones into the four collapsible subject lanes in the roadmap
   * view; `learningRoute` links directly to the canonical chapter page
   * (/student/learning/[spaceId]/[chapterId]) rather than duplicating its
   * content here.
   */
  subjectLane?: string
  learningRoute?: { spaceId: string; chapterId: string }
}

export type OdysseyActionType =
  | 'course'
  | 'module'
  | 'project'
  | 'research'
  | 'assessment'
  | 'competition'
  | 'internship'
  | 'simulation'
  | 'presentation'
  | 'collaboration'
  | 'laboratory'
  | 'faculty_review'

/** An Evidence-producing mission a milestone recommends. */
export interface OdysseyAction {
  id: string
  type: OdysseyActionType
  title: string
  description: string
  developsCapabilityIds: string[]
  producesEvidenceRequirementIds: string[]
  requiresReview: boolean
  /** Set when this action is a canonical institutional resource. */
  resourceId?: string
  /** True when DeepSeek proposed this action without a matching canonical record. */
  isAiProposed: boolean
  /** Present only when isAiProposed — an isolated, non-institutional identifier. */
  proposalId?: string
}

export interface OdysseyEvidenceRequirement {
  id: string
  description: string
  sourceTypeHint?: EvidenceSourceType
  /** Populated once real evidence has been submitted against this requirement. */
  satisfiedByEvidenceIds: string[]
}

/** A projected — never guaranteed — capability effect of completing an action or milestone. */
export interface OdysseyExpectedImpact {
  id: string
  capabilityId: string
  projectedMaturity: CapabilityMaturity
  projectedConfidence: ConfidenceBand
  /** Always true — expected impact is a projection, not an outcome. */
  isProjection: true
}

export type OdysseyRecommendationFactorType =
  | 'intent'
  | 'programme_context'
  | 'capability_claim'
  | 'maturity_gap'
  | 'confidence_gap'
  | 'evidence_gap'
  | 'prerequisite'
  | 'completed_work'
  | 'institutional_constraint'
  | 'workload_constraint'
  | 'time_constraint'
  | 'student_preference'
  | 'uncertainty'

export interface OdysseyRecommendationFactor {
  id: string
  type: OdysseyRecommendationFactorType
  summary: string
  relatedCapabilityId?: string
}

export type OdysseyConstraintType = 'workload' | 'time' | 'financial' | 'geography' | 'accessibility' | 'preference' | 'institutional'

export interface OdysseyConstraint {
  id: string
  type: OdysseyConstraintType
  description: string
}

export interface OdysseyBlocker {
  id: string
  milestoneId: string
  reason: string
  unblockedBy?: string
}

/** A milestone-level alternative to the recommended action — not a whole competing plan. */
export interface OdysseyAlternativeAction {
  id: string
  milestoneId: string
  title: string
  description: string
  tradeoff: string
}

export type OdysseyResourceType =
  | 'course'
  | 'module'
  | 'reading'
  | 'workshop'
  | 'laboratory'
  | 'project'
  | 'research_opportunity'
  | 'competition'
  | 'internship'
  | 'mentor'
  | 'faculty_support'
  | 'institutional_service'
  | 'chapter'

/** A canonical, institution-provided resource DeepSeek may select from — never invented. */
export interface OdysseyInstitutionalResource {
  id: string
  type: OdysseyResourceType
  title: string
  description: string
  relatedCapabilityIds: string[]
  workloadEstimate?: string
  deliveryMode?: string
}

/**
 * What kind of pathway Odyssey is planning toward — the Odyssey product
 * correction's central distinction. A secondary/Class-X learner's default
 * pathway is 'curriculum_progression'; 'career_pathway' (the original
 * university-oriented behaviour, preserved unchanged) only activates when
 * the learner's stage supports it and a destination is explicitly chosen.
 */
export type OdysseyPathwayType = 'curriculum_progression' | 'capability_development' | 'academic_exploration' | 'career_pathway'

export type OdysseyEducationStage = 'secondary_class_10' | 'university'

export interface OdysseyDestination {
  id: string
  title: string
  description: string
  pathwayType: OdysseyPathwayType
}

/**
 * The stage-aware framing Odyssey plans within — never inferred from a
 * job title. Drives which fixture set the deterministic planner draws
 * from and what the destination-planning form offers.
 */
export interface OdysseyLearnerStageContext {
  stage: OdysseyEducationStage
  curriculumLabel: string
  institutionLabel: string
  defaultPathwayType: OdysseyPathwayType
}

export type OdysseyPlanVersionTrigger =
  | 'initial_generation'
  | 'replan_request'
  | 'evidence_update'
  | 'capability_update'
  | 'manual_adjustment'
  | 'faculty_intervention'

export type OdysseyProviderStatus = 'ai_generated' | 'fallback_typed' | 'previous_preserved'
export type OdysseyValidationStatus = 'valid' | 'invalid' | 'fallback'

/**
 * A single versioned snapshot of the plan — the unit that actually carries
 * plan content. OdysseyPlan itself is just a stable anchor pointing at the
 * current version; history lives here, not by mutating milestones in place.
 */
export interface OdysseyPlanVersion {
  id: string
  planId: string
  version: number
  createdAt: string
  trigger: OdysseyPlanVersionTrigger
  triggerSummary: string
  previousVersionId?: string

  title: string
  destinationId: string
  reasoningSummary: string
  recommendationConfidence: ConfidenceBand

  milestoneIds: string[]
  milestonesAddedIds: string[]
  milestonesRemovedIds: string[]
  milestonesReorderedIds: string[]
  milestonesChangedIds: string[]
  milestonesSupersededIds: string[]

  validationStatus: OdysseyValidationStatus
  providerStatus: OdysseyProviderStatus
}

export interface OdysseyPlan {
  id: string
  studentId: string
  currentVersionId: string
}

export interface OdysseyAdjustmentRequest {
  id: string
  planId: string
  requestedAt: string
  instructionText: string
}
