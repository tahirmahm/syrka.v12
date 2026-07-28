/**
 * IAU-001 completion pass §2 — one coherent canonical event family, built
 * on the Economics chapter "Money and Credit" (ncert-chapter-eco-3),
 * concept "Formal vs. informal credit" (ncert-concept-eco-3-2) — a
 * distinct concept from the one the existing three-session adaptive
 * demonstration already covers (ncert-concept-eco-3-1, "Functions of
 * money", built in lib/mock-data/adaptive-learning-seed.ts and NOT
 * rebuilt here). This is the institutional-signal narrative: a small
 * labelled-synthetic cohort repeatedly confusing a lower advertised
 * short-term interest rate with lower overall risk when comparing
 * informal and formal credit — real enough to carry Student/Faculty/
 * Department/University/Odyssey/Passport/public projections, all
 * derived from this one array, never from four unrelated mock stories.
 *
 * Every event here is genuine demonstration data for a real concept
 * already in the NCERT curriculum (PR #16) — the misconception, the
 * transfer question, and the chapter/concept ids are all real; the
 * *cohort* beyond the representative student (student-1) is explicitly
 * synthetic and labelled as such (`synthetic: true`) so it is never
 * mistaken for genuine longitudinal data.
 */
import type { CanonicalEvent, CanonicalEventEntityRef } from '@/lib/campus-types'

export const MONEY_CREDIT_CORRELATION_ID = 'money-credit-signal-1'
export const MONEY_CREDIT_SPACE_ID = 'ncert-space-economics'
export const MONEY_CREDIT_CHAPTER_ID = 'ncert-chapter-eco-3'
export const MONEY_CREDIT_CONCEPT_ID = 'ncert-concept-eco-3-2'
export const MONEY_CREDIT_CAPABILITY_ID = 'cap-9'
export const REPRESENTATIVE_STUDENT_ID = 'student-1'
export const FACULTY_REVIEWER_ID = 'fac-1'
const TENANT_ID = 'tenant-meridian-demo'

/** Labelled synthetic cohort — never presented as real longitudinal data (see file header). */
export const SYNTHETIC_COHORT_STUDENT_IDS = ['demo-cohort-econ-2', 'demo-cohort-econ-3', 'demo-cohort-econ-4', 'demo-cohort-econ-5', 'demo-cohort-econ-6'] as const
export const SYNTHETIC_COHORT_LABEL = 'Labelled synthetic demonstration cohort — not real student records'

const T = {
  s1: '2026-07-06T09:00:00.000Z',
  s2: '2026-07-13T09:00:00.000Z',
  s3: '2026-07-20T09:00:00.000Z',
  review: '2026-07-21T10:00:00.000Z',
  detect: '2026-07-22T08:00:00.000Z',
  propose: '2026-07-22T09:00:00.000Z',
}

let seq = 0
function nextId(prefix: string): string {
  seq += 1
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

function ev(partial: {
  eventType: CanonicalEvent['eventType']
  occurredAt: string
  actor: CanonicalEventEntityRef
  subject: CanonicalEventEntityRef
  resource?: CanonicalEventEntityRef
  causationId?: string
  privacyClassification: CanonicalEvent['privacyClassification']
  producer: string
  sourceEventType: string
  payload: Record<string, unknown>
  synthetic?: boolean
}): CanonicalEvent {
  return {
    eventId: nextId('evt-money-credit'),
    eventType: partial.eventType,
    eventVersion: '1.0.0',
    occurredAt: partial.occurredAt,
    tenantId: TENANT_ID,
    sourceSystem: 'syrka',
    producer: partial.producer,
    actor: partial.actor,
    subject: partial.subject,
    resource: partial.resource,
    correlationId: MONEY_CREDIT_CORRELATION_ID,
    causationId: partial.causationId,
    privacyClassification: partial.privacyClassification,
    provenance: { sourceEventType: partial.sourceEventType, transformer: 'syrka-learning-native', transformerVersion: '1.0.0' },
    payload: partial.payload,
    synthetic: partial.synthetic,
  }
}

const student: CanonicalEventEntityRef = { type: 'student', id: REPRESENTATIVE_STUDENT_ID }
const tutor: CanonicalEventEntityRef = { type: 'ai_tutor', id: 'syrka-tutor' }
const faculty: CanonicalEventEntityRef = { type: 'faculty', id: FACULTY_REVIEWER_ID }
const chapterResource: CanonicalEventEntityRef = { type: 'learning_chapter', id: MONEY_CREDIT_CHAPTER_ID }
const conceptResource: CanonicalEventEntityRef = { type: 'learning_concept', id: MONEY_CREDIT_CONCEPT_ID }

const representativeEvents: CanonicalEvent[] = (() => {
  const sessionStarted = ev({
    eventType: 'AdaptiveSessionStarted',
    occurredAt: T.s1,
    actor: student,
    subject: student,
    resource: conceptResource,
    privacyClassification: 'restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'learning_session_started',
    payload: { chapterId: MONEY_CREDIT_CHAPTER_ID, conceptId: MONEY_CREDIT_CONCEPT_ID, sessionGoal: 'diagnose' },
  })
  const attempt1 = ev({
    eventType: 'AttemptSubmitted',
    occurredAt: T.s1,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: sessionStarted.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'attempt_submitted',
    payload: {
      activity: 'Guided comparison: is informal credit ever the better choice, even at a higher rate?',
      studentResponse: 'Said informal credit is worse because the interest rate is higher, without weighing collateral or urgency.',
      hintLevelUsed: 2,
      correct: false,
    },
  })
  const strategySelected = ev({
    eventType: 'TeachingStrategySelected',
    occurredAt: T.s1,
    actor: tutor,
    subject: student,
    resource: conceptResource,
    causationId: attempt1.eventId,
    privacyClassification: 'restricted',
    producer: 'pedagogical-policy-engine',
    sourceEventType: 'strategy_selected',
    payload: { strategy: 'smallest_useful_hint', reason: 'First attempt confuses one visible cost with the full comparison — start with the smallest hint before restructuring the whole framework.' },
  })
  const misconceptionObserved = ev({
    eventType: 'LearningObservationCreated',
    occurredAt: T.s1,
    actor: tutor,
    subject: student,
    resource: conceptResource,
    causationId: attempt1.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'observation_created',
    payload: { observationType: 'misconception', description: 'Confuses a single visible cost (interest rate) with the full risk/benefit comparison between formal and informal credit.' },
  })

  const session2Started = ev({
    eventType: 'AdaptiveSessionStarted',
    occurredAt: T.s2,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: strategySelected.eventId,
    privacyClassification: 'restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'learning_session_started',
    payload: { chapterId: MONEY_CREDIT_CHAPTER_ID, conceptId: MONEY_CREDIT_CONCEPT_ID, sessionGoal: 'change_strategy' },
  })
  const strategyChanged = ev({
    eventType: 'TeachingStrategyChanged',
    occurredAt: T.s2,
    actor: tutor,
    subject: student,
    resource: conceptResource,
    causationId: session2Started.eventId,
    privacyClassification: 'restricted',
    producer: 'pedagogical-policy-engine',
    sourceEventType: 'strategy_changed',
    payload: {
      previousStrategy: 'smallest_useful_hint',
      strategy: 'comparison',
      reason: 'A single hint did not resolve the confusion — a structured side-by-side comparison table is needed to force the distinction explicitly.',
    },
  })
  const attempt2 = ev({
    eventType: 'AttemptSubmitted',
    occurredAt: T.s2,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: strategyChanged.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'attempt_submitted',
    payload: {
      activity: 'Comparison table: interest rate, collateral requirement, documentation burden, and flexibility for formal vs. informal credit',
      studentResponse: 'Correctly identified that informal credit can be individually rational despite higher cost, when collateral is unavailable or urgency is high.',
      hintLevelUsed: 1,
      correct: true,
    },
  })
  const guidedObservation = ev({
    eventType: 'LearningObservationCreated',
    occurredAt: T.s2,
    actor: tutor,
    subject: student,
    resource: conceptResource,
    causationId: attempt2.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'observation_created',
    payload: { observationType: 'guided_solution', description: 'Correct comparison reached with a structured table still in front of the student.' },
  })

  const session3Started = ev({
    eventType: 'AdaptiveSessionStarted',
    occurredAt: T.s3,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: attempt2.eventId,
    privacyClassification: 'restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'learning_session_started',
    payload: { chapterId: MONEY_CREDIT_CHAPTER_ID, conceptId: MONEY_CREDIT_CONCEPT_ID, sessionGoal: 'transfer_and_retention' },
  })
  const transferAttempt = ev({
    eventType: 'AttemptSubmitted',
    occurredAt: T.s3,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: session3Started.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'attempt_submitted',
    payload: {
      activity: "Apply the formal/informal credit distinction to a borrowing situation you are aware of, real or hypothetical, outside the chapter's examples.",
      studentResponse: 'Applied the same collateral/urgency/documentation reasoning to a new, unprompted scenario without the comparison table in front of them.',
      hintLevelUsed: 0,
      correct: true,
    },
  })
  const transferCompleted = ev({
    eventType: 'TransferCompleted',
    occurredAt: T.s3,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: transferAttempt.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'transfer_completed',
    payload: { succeededWithoutAssistance: true },
  })
  const explainBack = ev({
    eventType: 'ExplainBackCompleted',
    occurredAt: T.s3,
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: transferCompleted.eventId,
    privacyClassification: 'restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'explain_back_completed',
    payload: { explanation: 'A lower advertised rate does not capture collateral risk or urgency, which is why some borrowers rationally choose informal credit.' },
  })
  const strategyChanged2 = ev({
    eventType: 'TeachingStrategyChanged',
    occurredAt: T.s3,
    actor: tutor,
    subject: student,
    resource: conceptResource,
    causationId: transferCompleted.eventId,
    privacyClassification: 'restricted',
    producer: 'pedagogical-policy-engine',
    sourceEventType: 'strategy_changed',
    payload: {
      previousStrategy: 'comparison',
      strategy: 'delayed_retrieval',
      reason: 'Independent transfer already succeeded — the open question is now whether the understanding holds after a genuine delay, not whether it exists right now.',
    },
  })
  const retentionAttempt = ev({
    eventType: 'AttemptSubmitted',
    occurredAt: '2026-07-27T09:00:00.000Z',
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: strategyChanged2.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'attempt_submitted',
    payload: { activity: 'One week later, re-justify the formal/informal credit distinction from memory, without notes.', hintLevelUsed: 0, correct: true },
  })
  const delayedRetrieval = ev({
    eventType: 'DelayedRetrievalCompleted',
    occurredAt: '2026-07-27T09:00:00.000Z',
    actor: student,
    subject: student,
    resource: conceptResource,
    causationId: retentionAttempt.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'delayed_retrieval_completed',
    payload: { gapDays: 7, succeeded: true },
  })

  const evidenceCandidateId = nextId('evidence-candidate-money-credit')
  const evidenceCreated = ev({
    eventType: 'EvidenceCandidateCreated',
    occurredAt: '2026-07-27T09:05:00.000Z',
    actor: student,
    subject: student,
    resource: { type: 'evidence_candidate', id: evidenceCandidateId },
    causationId: delayedRetrieval.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'learning-evidence-pipeline',
    sourceEventType: 'evidence_candidate_created',
    payload: { rationale: 'Independent transfer to a new borrowing scenario, confirmed by a 7-day delayed retention check, on Formal vs. informal credit.', evidenceCandidateId },
  })
  const evidenceReviewed = ev({
    eventType: 'EvidenceReviewed',
    occurredAt: T.review,
    actor: faculty,
    subject: student,
    resource: { type: 'evidence_candidate', id: evidenceCandidateId },
    causationId: evidenceCreated.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'faculty-evidence-review',
    sourceEventType: 'evidence_reviewed',
    payload: { decision: 'accepted', authorityClass: 'institutionally_reviewed', reviewerId: FACULTY_REVIEWER_ID },
  })
  const capabilityChanged = ev({
    eventType: 'CapabilitySupportChanged',
    occurredAt: T.review,
    actor: { type: 'inference_engine', id: 'capability-inference' },
    subject: student,
    resource: { type: 'capability', id: MONEY_CREDIT_CAPABILITY_ID },
    causationId: evidenceReviewed.eventId,
    privacyClassification: 'restricted',
    producer: 'capability-inference',
    sourceEventType: 'capability_support_changed',
    payload: { capabilityId: MONEY_CREDIT_CAPABILITY_ID, maturityEstimate: 'Developing', confidenceBand: 'Supported', additionalSupport: true },
  })
  const odysseyChanged = ev({
    eventType: 'OdysseyPreparednessChanged',
    occurredAt: T.review,
    actor: { type: 'odyssey_engine', id: 'odyssey-projection' },
    subject: student,
    resource: { type: 'capability', id: MONEY_CREDIT_CAPABILITY_ID },
    causationId: capabilityChanged.eventId,
    privacyClassification: 'restricted',
    producer: 'odyssey-projection',
    sourceEventType: 'odyssey_preparedness_changed',
    payload: { note: 'Additional independently-transferred, retention-confirmed Evidence corroborates the existing Economic Reasoning preparedness signal.' },
  })
  const passportEligible = ev({
    eventType: 'PassportClaimEligible',
    occurredAt: T.review,
    actor: { type: 'passport_engine', id: 'passport-evidence-bridge' },
    subject: student,
    resource: { type: 'capability', id: MONEY_CREDIT_CAPABILITY_ID },
    causationId: capabilityChanged.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'passport-evidence-bridge',
    sourceEventType: 'passport_claim_eligible',
    payload: { note: "Corroborates the already-issued Economic Reasoning Passport claim (from 'Functions of money') rather than creating a second, competing claim for the same capability.", capabilityId: MONEY_CREDIT_CAPABILITY_ID },
  })

  return [
    sessionStarted, attempt1, strategySelected, misconceptionObserved,
    session2Started, strategyChanged, attempt2, guidedObservation,
    session3Started, transferAttempt, transferCompleted, explainBack, strategyChanged2, retentionAttempt, delayedRetrieval,
    evidenceCreated, evidenceReviewed, capabilityChanged, odysseyChanged, passportEligible,
  ]
})()

/** Cohort outcome bucket per IAU-001-completion §4's five scaffolding-vs-transfer categories — deliberately one member short of "insufficient data" being fabricated: demo-cohort-econ-6 genuinely has no attempt yet. */
type CohortOutcome = 'heavy_support' | 'light_support' | 'independent_transfer' | 'failed_transfer' | 'insufficient_data'

const cohortSpecs: { id: (typeof SYNTHETIC_COHORT_STUDENT_IDS)[number]; outcome: CohortOutcome; hadMisconception: boolean }[] = [
  { id: 'demo-cohort-econ-2', outcome: 'heavy_support', hadMisconception: true },
  { id: 'demo-cohort-econ-3', outcome: 'independent_transfer', hadMisconception: false },
  { id: 'demo-cohort-econ-4', outcome: 'failed_transfer', hadMisconception: true },
  { id: 'demo-cohort-econ-5', outcome: 'light_support', hadMisconception: true },
  { id: 'demo-cohort-econ-6', outcome: 'insufficient_data', hadMisconception: false },
]

const syntheticCohortEvents: CanonicalEvent[] = cohortSpecs.flatMap((spec) => {
  const who: CanonicalEventEntityRef = { type: 'student', id: spec.id }
  const events: CanonicalEvent[] = []
  const started = ev({
    eventType: 'AdaptiveSessionStarted',
    occurredAt: T.s1,
    actor: who,
    subject: who,
    resource: conceptResource,
    privacyClassification: 'restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'learning_session_started',
    payload: { chapterId: MONEY_CREDIT_CHAPTER_ID, conceptId: MONEY_CREDIT_CONCEPT_ID, cohortLabel: SYNTHETIC_COHORT_LABEL },
    synthetic: true,
  })
  events.push(started)

  if (spec.hadMisconception) {
    events.push(
      ev({
        eventType: 'LearningObservationCreated',
        occurredAt: T.s1,
        actor: tutor,
        subject: who,
        resource: conceptResource,
        causationId: started.eventId,
        privacyClassification: 'highly_restricted',
        producer: 'syrka-tutor-session',
        sourceEventType: 'observation_created',
        payload: { observationType: 'misconception', description: 'Confuses a single visible cost (interest rate) with the full risk/benefit comparison between formal and informal credit.', cohortLabel: SYNTHETIC_COHORT_LABEL },
        synthetic: true,
      })
    )
  }

  if (spec.outcome === 'insufficient_data') return events

  const outcomePayload: Record<CohortOutcome, { hintLevelUsed: number; correct: boolean; activity: string }> = {
    heavy_support: { hintLevelUsed: 3, correct: true, activity: 'Comparison table, completed only with full worked-through guidance at every step.' },
    light_support: { hintLevelUsed: 1, correct: true, activity: 'Comparison table, completed with one clarifying hint.' },
    independent_transfer: { hintLevelUsed: 0, correct: true, activity: "Apply the formal/informal credit distinction to a new borrowing situation, outside the chapter's examples." },
    failed_transfer: { hintLevelUsed: 0, correct: false, activity: "Apply the formal/informal credit distinction to a new borrowing situation, outside the chapter's examples." },
    insufficient_data: { hintLevelUsed: 0, correct: false, activity: '' },
  }
  const attempt = ev({
    eventType: 'AttemptSubmitted',
    occurredAt: T.s2,
    actor: who,
    subject: who,
    resource: conceptResource,
    causationId: started.eventId,
    privacyClassification: 'highly_restricted',
    producer: 'syrka-tutor-session',
    sourceEventType: 'attempt_submitted',
    payload: { ...outcomePayload[spec.outcome], cohortLabel: SYNTHETIC_COHORT_LABEL },
    synthetic: true,
  })
  events.push(attempt)

  if (spec.outcome === 'independent_transfer') {
    events.push(
      ev({
        eventType: 'TransferCompleted',
        occurredAt: T.s2,
        actor: who,
        subject: who,
        resource: conceptResource,
        causationId: attempt.eventId,
        privacyClassification: 'highly_restricted',
        producer: 'syrka-tutor-session',
        sourceEventType: 'transfer_completed',
        payload: { succeededWithoutAssistance: true, cohortLabel: SYNTHETIC_COHORT_LABEL },
        synthetic: true,
      })
    )
  }

  return events
})

const misconceptionRecurrenceCount = 1 + cohortSpecs.filter((s) => s.hadMisconception).length // representative student + labelled cohort
const sampledStudentCount = 1 + cohortSpecs.length

const conditionDetected = ev({
  eventType: 'CurriculumConditionDetected',
  occurredAt: T.detect,
  actor: { type: 'department_analytics', id: 'department-learning-intelligence' },
  subject: { type: 'concept', id: MONEY_CREDIT_CONCEPT_ID },
  resource: chapterResource,
  causationId: representativeEvents[3].eventId,
  privacyClassification: 'internal',
  producer: 'department-learning-intelligence',
  sourceEventType: 'curriculum_condition_detected',
  payload: {
    description: `${misconceptionRecurrenceCount} of ${sampledStudentCount} sampled students confused a lower advertised short-term interest rate with lower overall risk when comparing formal and informal credit.`,
    recurrenceCount: misconceptionRecurrenceCount,
    sampledStudentCount,
    conceptId: MONEY_CREDIT_CONCEPT_ID,
  },
})

export const MONEY_CREDIT_CURRICULUM_CONDITION_EVENT_ID = conditionDetected.eventId

export const MONEY_CREDIT_SIGNAL_EVENTS: CanonicalEvent[] = [...representativeEvents, ...syntheticCohortEvents, conditionDetected]

export const MONEY_CREDIT_COHORT_OUTCOMES = cohortSpecs
