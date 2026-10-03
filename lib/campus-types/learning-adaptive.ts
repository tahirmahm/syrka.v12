import type { IndependenceLevel } from './learning-observation'

/**
 * Syrka Learning — the longitudinal adaptive-learning domain (IAU-001).
 * Everything here is a rebuildable PROJECTION over the existing
 * interaction/observation domains (learning-interaction.ts,
 * learning-observation.ts) — never a second Person/Student/Evidence
 * system. `MisconceptionRecord` is reused directly from
 * learning-interaction.ts, not redefined here.
 */

export type PedagogicalStrategy =
  | 'direct_explanation'
  | 'socratic_question'
  | 'smallest_useful_hint'
  | 'worked_example'
  | 'counterexample'
  | 'analogy'
  | 'visual_representation'
  | 'comparison'
  | 'source_close_reading'
  | 'classification_task'
  | 'argument_counterargument'
  | 'explain_back'
  | 'transfer_task'
  | 'delayed_retrieval'
  | 'faculty_escalation'

/** How a fact entered the learner model — kept explicit everywhere, never collapsed. */
export type LearnerModelProvenance = 'direct_observation' | 'system_inference' | 'faculty_judgment' | 'student_self_report'

export interface ConceptLearningState {
  id: string
  studentId: string
  conceptId: string
  chapterId: string
  currentIndependence: IndependenceLevel
  /** Points at existing MisconceptionRecord ids (learning-interaction.ts) — never redefined here. */
  recurringMisconceptionIds: string[]
  hintsUsedLastAttempt: number
  transferAttempted: boolean
  transferSucceeded?: boolean
  delayedRetrievalAttempted: boolean
  delayedRetrievalSucceeded?: boolean
  /** LearningObservation/LearningAttempt ids this state was derived from — direct observation, never asserted without a source. */
  observedFrom: string[]
  lastUpdatedAt: string
}

export interface AssistanceHistoryEntry {
  id: string
  studentId: string
  conceptId: string
  sessionId: string
  hintLevel: number
  answerRevealed: boolean
  recordedAt: string
}

export interface RetentionObservation {
  id: string
  studentId: string
  conceptId: string
  firstDemonstratedAt: string
  retestedAt: string
  gapDays: number
  succeeded: boolean
  sourceAttemptId: string
}

export interface TeachingStrategyPreference {
  id: string
  studentId: string
  conceptId?: string
  subject: string
  strategy: PedagogicalStrategy
  effective: boolean
  provenance: LearnerModelProvenance
  observedFrom: string[]
  recordedAt: string
}

export type PedagogicalMemoryKind = 'recurring_issue' | 'successful_strategy' | 'independence_condition' | 'retention_condition' | 'language_accessibility_need'

/**
 * A structured, student-visible memory entry — never raw Tutor
 * transcript text. Every entry answers, directly: what is remembered,
 * why it's relevant, which observation produced it, and when it was
 * last updated (the brief's own required student-facing explanation).
 */
export interface PedagogicalMemoryEntry {
  id: string
  studentId: string
  conceptId?: string
  kind: PedagogicalMemoryKind
  summary: string
  observedFromSessionIds: string[]
  provenance: LearnerModelProvenance
  facultyConfirmed?: boolean
  confidence: 'low' | 'moderate' | 'high'
  lastUpdatedAt: string
}

export interface LearnerGoalContext {
  id: string
  studentId: string
  description: string
  source: 'self_reported' | 'system_inferred'
  relevantSubjects: string[]
  recordedAt: string
}

export interface RejectedStrategyAlternative {
  strategy: PedagogicalStrategy
  reasonRejected: string
}

/**
 * The full, inspectable output of one PedagogicalPolicyEngine decision —
 * this object IS the "Why Syrka adapted" explanation; there is no
 * separate narrative layer that could drift from what actually happened.
 */
export interface AdaptationDecision {
  id: string
  studentId: string
  conceptId: string
  sessionId: string
  strategy: PedagogicalStrategy
  reason: string
  supportingObservationIds: string[]
  rejectedAlternatives: RejectedStrategyAlternative[]
  uncertainty: 'low' | 'moderate' | 'high'
  expectedNextSignal: string
  decidedAt: string
}

export type AdaptiveSessionGoal = 'diagnose' | 'change_strategy' | 'transfer_and_retention'

export interface AdaptiveSessionPlan {
  id: string
  studentId: string
  chapterId: string
  sessionNumber: 1 | 2 | 3
  focusConceptId: string
  goal: AdaptiveSessionGoal
  decisionId: string
  createdAt: string
}

/**
 * The rebuildable, cross-session projection over one student's learning
 * history for one chapter (CEA-001 §2.8: a projection, never a source of
 * truth on its own). Built once, deterministically, from the fixed
 * demonstration session fixtures — never durably persisted in this pass.
 */
export interface LearnerModelProjection {
  studentId: string
  chapterId: string
  conceptStates: ConceptLearningState[]
  assistanceHistory: AssistanceHistoryEntry[]
  retentionObservations: RetentionObservation[]
  strategyPreferences: TeachingStrategyPreference[]
  memory: PedagogicalMemoryEntry[]
  goals: LearnerGoalContext[]
  decisions: AdaptationDecision[]
  sessionPlans: AdaptiveSessionPlan[]
  generatedAt: string
}
