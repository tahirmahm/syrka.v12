/**
 * Syrka Learning — IAU-001 bounded vertical slice. Full three-session
 * (diagnose -> change strategy -> transfer/retention) adaptive histories
 * for exactly four representative chapters already canonical from PR #16
 * (English "A Letter to God", Geography "Resources and Development",
 * Economics "Money and Credit", Political Science "Political Parties").
 * The remaining 22 chapters keep their existing curriculum structure and
 * chapter-aware Tutor but receive no fabricated session history here —
 * see IAU-001 §12.
 *
 * Every AdaptationDecision below is produced by an actual call to
 * PedagogicalPolicyEngine.selectNextAction() against that subject's real,
 * evolving ConceptLearningState — never hand-typed to fit a narrative.
 */
import type {
  LearningSession,
  LearningAttempt,
  TutorHint,
  MisconceptionRecord,
  LearningObservation,
  ConceptLearningState,
  AssistanceHistoryEntry,
  RetentionObservation,
  PedagogicalMemoryEntry,
  LearnerGoalContext,
  AdaptationDecision,
  AdaptiveSessionPlan,
  LearnerModelProjection,
  EvidenceCandidate,
  ProvenanceRecord,
  CapabilityInferenceBasis,
  CapabilityInference,
  DisclosurePermission,
  AIUseDisclosure,
  ModelOutputClaim,
  StudentVerificationAction,
  DetectedModelError,
  IndependentDefence,
  AssessmentTransferResult,
  AssessmentAssistanceRecord,
} from '@/lib/campus-types'
import { PedagogicalPolicyEngine } from '@/lib/services/learning/pedagogical-policy-engine'
import { computeInferenceConfidence } from '@/lib/services/profile/inference'

const STUDENT_ID = 'student-1'
const TEACHER_ID = 'fac-1'

export const SESSION_1_AT = '2026-07-06T00:00:00.000Z'
export const SESSION_2_AT = '2026-07-13T00:00:00.000Z'
export const SESSION_3_AT = '2026-07-20T00:00:00.000Z'
export const RETENTION_RETEST_AT = '2026-07-27T00:00:00.000Z'
const RETENTION_GAP_DAYS = 7

interface AdaptiveChapterSpec {
  code: string
  subject: string
  chapterId: string
  conceptId: string
  conceptTitle: string
  capabilityId: string
  session1: { activity: string; studentResponse: string; misconception: string; hintLevelUsed: number }
  session2: { changedApproach: string; studentResponse: string; hintLevelUsed: number }
  session3: { transferPrompt: string; explainBack: string; retentionPrompt: string }
  aiUse: {
    toolUsed: string
    declaredPurpose: string
    taskCategories: string[]
    acceptedClaim: string
    changedClaim: string
    verification: string
    detectedError: string
    independentDefence: string
  }
}

function buildAdaptiveChapterFixture(spec: AdaptiveChapterSpec) {
  const { code, subject, chapterId, conceptId, conceptTitle, capabilityId } = spec

  const sessions: LearningSession[] = [
    { id: `ial-session-${code}-1`, studentId: STUDENT_ID, lessonId: chapterId, mode: 'socratic', currentState: 'diagnose', startedAt: SESSION_1_AT, endedAt: SESSION_1_AT },
    { id: `ial-session-${code}-2`, studentId: STUDENT_ID, lessonId: chapterId, mode: 'socratic', currentState: 'scaffold', startedAt: SESSION_2_AT, endedAt: SESSION_2_AT },
    { id: `ial-session-${code}-3`, studentId: STUDENT_ID, lessonId: chapterId, mode: 'socratic', currentState: 'transfer', startedAt: SESSION_3_AT, endedAt: SESSION_3_AT },
  ]

  const attempts: LearningAttempt[] = [
    { id: `ial-attempt-${code}-1`, sessionId: sessions[0].id, studentId: STUDENT_ID, questionId: `ial-question-${code}-diagnose`, hintLevelUsed: spec.session1.hintLevelUsed, independenceLevel: 'substantially_guided', submittedAt: SESSION_1_AT, correct: false },
    { id: `ial-attempt-${code}-2`, sessionId: sessions[1].id, studentId: STUDENT_ID, questionId: `ial-question-${code}-retry`, hintLevelUsed: spec.session2.hintLevelUsed, independenceLevel: 'partially_guided', submittedAt: SESSION_2_AT, correct: true },
    { id: `ial-attempt-${code}-3-transfer`, sessionId: sessions[2].id, studentId: STUDENT_ID, questionId: `ial-question-${code}-transfer`, hintLevelUsed: 0, independenceLevel: 'independent', submittedAt: SESSION_3_AT, correct: true },
    { id: `ial-attempt-${code}-3-retention`, sessionId: sessions[2].id, studentId: STUDENT_ID, questionId: `ial-question-${code}-retention`, hintLevelUsed: 0, independenceLevel: 'independent', submittedAt: RETENTION_RETEST_AT, correct: true },
  ]

  const hints: TutorHint[] = [
    { id: `ial-hint-${code}-1a`, sessionId: sessions[0].id, level: 1, issuedAt: SESSION_1_AT },
    { id: `ial-hint-${code}-1b`, sessionId: sessions[0].id, level: 2, issuedAt: SESSION_1_AT },
    ...(spec.session2.hintLevelUsed > 0 ? [{ id: `ial-hint-${code}-2a`, sessionId: sessions[1].id, level: spec.session2.hintLevelUsed as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, issuedAt: SESSION_2_AT }] : []),
  ]

  const misconceptions: MisconceptionRecord[] = [
    { id: `ial-misconception-${code}`, studentId: STUDENT_ID, conceptId, description: spec.session1.misconception, firstObservedAt: SESSION_1_AT, recurrenceCount: 1 },
  ]

  const observations: LearningObservation[] = [
    { id: `ial-obs-${code}-1`, studentId: STUDENT_ID, courseId: chapterId, lessonId: chapterId, conceptId, observationType: 'misconception', tutorMode: 'socratic', independenceLevel: 'substantially_guided', sourceReferences: [], attemptId: attempts[0].id, misconceptionIds: [misconceptions[0].id], hintLevel: spec.session1.hintLevelUsed, recordedAt: SESSION_1_AT },
    { id: `ial-obs-${code}-2`, studentId: STUDENT_ID, courseId: chapterId, lessonId: chapterId, conceptId, observationType: 'guided_solution', tutorMode: 'socratic', independenceLevel: 'partially_guided', sourceReferences: [], attemptId: attempts[1].id, hintLevel: spec.session2.hintLevelUsed, recordedAt: SESSION_2_AT },
    {
      id: `ial-obs-${code}-3-transfer`,
      studentId: STUDENT_ID,
      courseId: chapterId,
      lessonId: chapterId,
      conceptId,
      observationType: 'transfer_demonstrated',
      tutorMode: 'socratic',
      independenceLevel: 'independent',
      sourceReferences: [],
      attemptId: attempts[2].id,
      hintLevel: 0,
      followsMaterializedTransferAfterReveal: false,
      recordedAt: SESSION_3_AT,
    },
  ]

  // --- Learner model, threaded genuinely through the three stages ---

  const conceptStateAfterSession1: ConceptLearningState = {
    id: `ial-concept-state-${code}-1`,
    studentId: STUDENT_ID,
    conceptId,
    chapterId,
    currentIndependence: 'substantially_guided',
    recurringMisconceptionIds: [misconceptions[0].id],
    hintsUsedLastAttempt: spec.session1.hintLevelUsed,
    transferAttempted: false,
    delayedRetrievalAttempted: false,
    observedFrom: [observations[0].id],
    lastUpdatedAt: SESSION_1_AT,
  }

  const decision1 = PedagogicalPolicyEngine.selectNextAction({
    subject,
    conceptTitle,
    conceptState: conceptStateAfterSession1,
    priorDecisions: [],
    currentAttempt: { correct: false, hintLevelUsed: spec.session1.hintLevelUsed },
  })
  const adaptationDecision1: AdaptationDecision = { id: `ial-decision-${code}-1`, studentId: STUDENT_ID, conceptId, sessionId: sessions[0].id, decidedAt: SESSION_1_AT, ...decision1 }

  const conceptStateAfterSession2: ConceptLearningState = {
    ...conceptStateAfterSession1,
    id: `ial-concept-state-${code}-2`,
    currentIndependence: 'partially_guided',
    hintsUsedLastAttempt: spec.session2.hintLevelUsed,
    observedFrom: [...conceptStateAfterSession1.observedFrom, observations[1].id],
    lastUpdatedAt: SESSION_2_AT,
  }

  const decision2 = PedagogicalPolicyEngine.selectNextAction({
    subject,
    conceptTitle,
    conceptState: conceptStateAfterSession2,
    priorDecisions: [adaptationDecision1],
    currentAttempt: { correct: true, hintLevelUsed: spec.session2.hintLevelUsed },
  })
  const adaptationDecision2: AdaptationDecision = { id: `ial-decision-${code}-2`, studentId: STUDENT_ID, conceptId, sessionId: sessions[1].id, decidedAt: SESSION_2_AT, ...decision2 }

  const conceptStateAfterTransfer: ConceptLearningState = {
    ...conceptStateAfterSession2,
    id: `ial-concept-state-${code}-3-transfer`,
    currentIndependence: 'independent',
    transferAttempted: true,
    transferSucceeded: true,
    observedFrom: [...conceptStateAfterSession2.observedFrom, observations[2].id],
    lastUpdatedAt: SESSION_3_AT,
  }

  const decision3 = PedagogicalPolicyEngine.selectNextAction({
    subject,
    conceptTitle,
    conceptState: conceptStateAfterTransfer,
    priorDecisions: [adaptationDecision1, adaptationDecision2],
    currentAttempt: { correct: true, hintLevelUsed: 0 },
  })
  const adaptationDecision3: AdaptationDecision = { id: `ial-decision-${code}-3`, studentId: STUDENT_ID, conceptId, sessionId: sessions[2].id, decidedAt: SESSION_3_AT, ...decision3 }

  const conceptStateFinal: ConceptLearningState = {
    ...conceptStateAfterTransfer,
    id: `ial-concept-state-${code}-final`,
    delayedRetrievalAttempted: true,
    delayedRetrievalSucceeded: true,
    lastUpdatedAt: RETENTION_RETEST_AT,
  }

  const sessionPlans: AdaptiveSessionPlan[] = [
    { id: `ial-plan-${code}-1`, studentId: STUDENT_ID, chapterId, sessionNumber: 1, focusConceptId: conceptId, goal: 'diagnose', decisionId: adaptationDecision1.id, createdAt: SESSION_1_AT },
    { id: `ial-plan-${code}-2`, studentId: STUDENT_ID, chapterId, sessionNumber: 2, focusConceptId: conceptId, goal: 'change_strategy', decisionId: adaptationDecision2.id, createdAt: SESSION_2_AT },
    { id: `ial-plan-${code}-3`, studentId: STUDENT_ID, chapterId, sessionNumber: 3, focusConceptId: conceptId, goal: 'transfer_and_retention', decisionId: adaptationDecision3.id, createdAt: SESSION_3_AT },
  ]

  const assistanceHistory: AssistanceHistoryEntry[] = [
    { id: `ial-assist-${code}-1`, studentId: STUDENT_ID, conceptId, sessionId: sessions[0].id, hintLevel: spec.session1.hintLevelUsed, answerRevealed: false, recordedAt: SESSION_1_AT },
    { id: `ial-assist-${code}-2`, studentId: STUDENT_ID, conceptId, sessionId: sessions[1].id, hintLevel: spec.session2.hintLevelUsed, answerRevealed: false, recordedAt: SESSION_2_AT },
  ]

  const retentionObservations: RetentionObservation[] = [
    { id: `ial-retention-${code}`, studentId: STUDENT_ID, conceptId, firstDemonstratedAt: SESSION_3_AT, retestedAt: RETENTION_RETEST_AT, gapDays: RETENTION_GAP_DAYS, succeeded: true, sourceAttemptId: attempts[3].id },
  ]

  const memory: PedagogicalMemoryEntry[] = [
    {
      id: `ial-memory-${code}-issue`,
      studentId: STUDENT_ID,
      conceptId,
      kind: 'recurring_issue',
      summary: spec.session1.misconception,
      observedFromSessionIds: [sessions[0].id],
      provenance: 'direct_observation',
      confidence: 'high',
      lastUpdatedAt: SESSION_1_AT,
    },
    {
      id: `ial-memory-${code}-strategy`,
      studentId: STUDENT_ID,
      conceptId,
      kind: 'successful_strategy',
      summary: `${spec.session2.changedApproach} resolved the difficulty observed in the first session.`,
      observedFromSessionIds: [sessions[1].id],
      provenance: 'system_inference',
      confidence: 'moderate',
      lastUpdatedAt: SESSION_2_AT,
    },
    {
      id: `ial-memory-${code}-retention`,
      studentId: STUDENT_ID,
      conceptId,
      kind: 'retention_condition',
      summary: `Independent understanding held after a ${RETENTION_GAP_DAYS}-day gap, retested without any scaffolding.`,
      observedFromSessionIds: [sessions[2].id],
      provenance: 'direct_observation',
      confidence: 'high',
      lastUpdatedAt: RETENTION_RETEST_AT,
    },
  ]

  const learnerModel: LearnerModelProjection = {
    studentId: STUDENT_ID,
    chapterId,
    conceptStates: [conceptStateAfterSession1, conceptStateAfterSession2, conceptStateAfterTransfer, conceptStateFinal],
    assistanceHistory,
    retentionObservations,
    strategyPreferences: [],
    memory,
    goals: [],
    decisions: [adaptationDecision1, adaptationDecision2, adaptationDecision3],
    sessionPlans,
    generatedAt: RETENTION_RETEST_AT,
  }

  // --- Attempt -> Evidence -> Capability chain (mirrors learning-seed.ts's existing pattern exactly) ---

  const provenance: ProvenanceRecord = {
    id: `ial-prov-${code}`,
    source: 'campus_learning',
    sourceIdentifier: attempts[3].id,
    owner: STUDENT_ID,
    importMethod: 'native_syrka',
    importedAt: RETENTION_RETEST_AT,
    authorityClass: 'institutionally_reviewed',
    derivationType: 'human_reviewed',
    corroboratingSources: [],
    linkedArtefactIds: [],
    disclosurePermissionIds: [`ial-disclose-${code}`],
  }

  const evidenceCandidate: EvidenceCandidate = {
    id: `ial-candidate-${code}`,
    studentId: STUDENT_ID,
    learningOriginId: observations[2].id,
    learningEvidenceSubtype: 'independent_transfer',
    proposedCapabilityIds: [capabilityId],
    rationale: `Independent transfer to a new context, confirmed by a ${RETENTION_GAP_DAYS}-day delayed retention check, teacher-reviewed.`,
    provenanceId: provenance.id,
  }

  const inferenceBases: CapabilityInferenceBasis[] = [
    { id: `ial-basis-${code}-1`, description: 'Independent transfer following a genuine strategy change, teacher-reviewed.', evidenceCandidateId: evidenceCandidate.id, weight: 'primary' },
    { id: `ial-basis-${code}-2`, description: `Retention confirmed after a ${RETENTION_GAP_DAYS}-day gap.`, evidenceCandidateId: evidenceCandidate.id, weight: 'supporting' },
  ]

  const capabilityInference: CapabilityInference = {
    id: `ial-inference-${code}`,
    studentId: STUDENT_ID,
    capabilityId,
    basisIds: inferenceBases.map((b) => b.id),
    confidence: computeInferenceConfidence(inferenceBases),
    maturityEstimate: 'Developing',
    provenanceId: provenance.id,
    computedAt: RETENTION_RETEST_AT,
  }

  const disclosurePermission: DisclosurePermission = { id: `ial-disclose-${code}`, studentId: STUDENT_ID, recordType: 'evidence_candidate', recordId: evidenceCandidate.id, audience: 'passport', allowed: true, setAt: RETENTION_RETEST_AT }

  // --- AI-aware assessment (one representative record per subject) ---

  const disclosure: AIUseDisclosure = {
    id: `ial-ai-disclosure-${code}`,
    studentId: STUDENT_ID,
    conceptId,
    toolOrTutorUsed: spec.aiUse.toolUsed,
    declaredPurpose: spec.aiUse.declaredPurpose,
    taskCategories: spec.aiUse.taskCategories,
    disclosedAt: SESSION_3_AT,
  }
  const modelOutputClaim: ModelOutputClaim = { id: `ial-ai-claim-${code}`, disclosureId: disclosure.id, claimText: spec.aiUse.acceptedClaim, accepted: true, changed: true }
  const verificationAction: StudentVerificationAction = { id: `ial-ai-verify-${code}`, disclosureId: disclosure.id, description: spec.aiUse.verification, performedAt: SESSION_3_AT }
  const detectedError: DetectedModelError = { id: `ial-ai-error-${code}`, disclosureId: disclosure.id, description: spec.aiUse.detectedError, howDetected: spec.aiUse.verification }
  const independentDefence: IndependentDefence = { id: `ial-ai-defence-${code}`, disclosureId: disclosure.id, explanation: spec.aiUse.independentDefence, recordedAt: SESSION_3_AT }
  const transferResult: AssessmentTransferResult = { id: `ial-ai-transfer-${code}`, disclosureId: disclosure.id, transferPrompt: spec.session3.transferPrompt, succeededWithoutAssistance: true }
  const assistanceRecord: AssessmentAssistanceRecord = {
    id: `ial-ai-record-${code}`,
    studentId: STUDENT_ID,
    conceptId,
    disclosureId: disclosure.id,
    modelOutputClaimIds: [modelOutputClaim.id],
    verificationActionIds: [verificationAction.id],
    detectedErrorIds: [detectedError.id],
    independentDefenceId: independentDefence.id,
    transferResultId: transferResult.id,
    facultyReviewed: true,
    judgement: 'independent_orchestration',
    facultyNote: 'Verification trail and independent defence are both present — treated as orchestrated, reviewed use, not copied output.',
    recordedAt: SESSION_3_AT,
  }

  return {
    sessions,
    attempts,
    hints,
    misconceptions,
    observations,
    learnerModel,
    provenance,
    evidenceCandidate,
    inferenceBases,
    capabilityInference,
    disclosurePermission,
    aiUse: { disclosure, modelOutputClaim, verificationAction, detectedError, independentDefence, transferResult, assistanceRecord },
  }
}

const ENGLISH_FIXTURE = buildAdaptiveChapterFixture({
  code: 'eng',
  subject: 'English',
  chapterId: 'ncert-chapter-eng-1',
  conceptId: 'ncert-concept-eng-1-1',
  conceptTitle: 'Narrative irony',
  capabilityId: 'cap-7',
  session1: {
    activity: 'Guided analysis: Lencho\'s expectation vs. the postmaster\'s response',
    studentResponse: 'Concluded "Lencho was naive to trust God" without citing a specific line from the story.',
    misconception: 'States an interpretive conclusion without citing supporting textual evidence.',
    hintLevelUsed: 2,
  },
  session2: {
    changedApproach: 'Removing the sentence starter and asking the student to select the supporting quote themselves, rather than supplying one',
    studentResponse: 'Cited the line about Lencho counting the money and reacting to the missing amount, correctly linking it to his faith being tested.',
    hintLevelUsed: 1,
  },
  session3: {
    transferPrompt: 'Apply the same evidence-based-interpretation method to a new short passage not covered in class.',
    explainBack: 'Explained, in their own words, why citing the exact moment Lencho reacts to the money is stronger evidence than a general claim about his character.',
    retentionPrompt: 'Re-explain, one week later and without notes, why the interpretation of the original story needs a specific cited line.',
  },
  aiUse: {
    toolUsed: 'Syrka Tutor',
    declaredPurpose: 'Check whether my written interpretation was clearly phrased before submitting it.',
    taskCategories: ['phrasing_review', 'fact_checking'],
    acceptedClaim: 'The Tutor suggested rephrasing my topic sentence for clarity.',
    changedClaim: 'Rewrote the supporting sentence myself after the Tutor\'s paraphrase slightly misquoted the story.',
    verification: 'Compared the Tutor\'s suggested quote against the actual story text directly.',
    detectedError: 'The Tutor\'s paraphrase of the quoted line changed a word from the original text.',
    independentDefence: 'I can explain why this specific line, not a general summary, is what proves Lencho\'s faith was tested — because it shows his exact reaction to a concrete number.',
  },
})

const GEOGRAPHY_FIXTURE = buildAdaptiveChapterFixture({
  code: 'geo',
  subject: 'Geography',
  chapterId: 'ncert-chapter-geo-1',
  conceptId: 'ncert-concept-geo-1-1',
  conceptTitle: 'Resource classification',
  capabilityId: 'cap-8',
  session1: {
    activity: 'Classification table: sorting five named resources by origin, exhaustibility, and ownership',
    studentResponse: 'Classified groundwater as simply "renewable" without noting that over-extraction can exhaust it faster than it replenishes.',
    misconception: 'Conflates a resource\'s renewable/non-renewable classification with an assumption that it cannot be depleted through overuse.',
    hintLevelUsed: 2,
  },
  session2: {
    changedApproach: 'A side-by-side comparison of groundwater against a genuinely non-renewable resource (a mineral), highlighting what "renewable" actually depends on',
    studentResponse: 'Correctly explained that groundwater is renewable in principle but can behave like a non-renewable resource under heavy extraction.',
    hintLevelUsed: 1,
  },
  session3: {
    transferPrompt: 'Classify a new resource not covered in the chapter using the same origin/exhaustibility/ownership framework.',
    explainBack: 'Explained why exhaustibility is about the rate of use relative to replenishment, not a fixed property of the resource type.',
    retentionPrompt: 'One week later, re-classify groundwater from memory and justify the classification.',
  },
  aiUse: {
    toolUsed: 'Syrka Tutor',
    declaredPurpose: 'Get a second check on my classification table before submitting.',
    taskCategories: ['classification_check'],
    acceptedClaim: 'The Tutor confirmed my ownership-category classification for two resources.',
    changedClaim: 'Corrected my own exhaustibility classification for groundwater after the Tutor\'s explanation, rather than copying its wording.',
    verification: 'Cross-checked the Tutor\'s explanation against the chapter\'s own definition of renewable resources.',
    detectedError: 'None found in this case — the Tutor\'s explanation matched the chapter\'s definition.',
    independentDefence: 'I can now explain in my own words why groundwater needs a usage-rate qualifier, not just a renewable/non-renewable label.',
  },
})

const ECONOMICS_FIXTURE = buildAdaptiveChapterFixture({
  code: 'eco',
  subject: 'Economics',
  chapterId: 'ncert-chapter-eco-3',
  conceptId: 'ncert-concept-eco-3-1',
  conceptTitle: 'Functions of money',
  capabilityId: 'cap-9',
  session1: {
    activity: 'Guided analysis: why a farmer might still borrow informally',
    studentResponse: 'Explained money as "generally useful for buying things" without identifying the specific double-coincidence-of-wants problem it solves.',
    misconception: 'Confuses money\'s specific medium-of-exchange function with a general notion of usefulness.',
    hintLevelUsed: 2,
  },
  session2: {
    changedApproach: 'A concrete counterexample — a barter attempt that fails because neither party wants what the other offers — to isolate exactly what money fixes',
    studentResponse: 'Correctly identified that money removes the need for both parties to want each other\'s specific goods at the same time.',
    hintLevelUsed: 1,
  },
  session3: {
    transferPrompt: 'Apply the same reasoning to a new credit scenario (a shopkeeper extending credit) not covered in class.',
    explainBack: 'Explained, unprompted, why the double-coincidence-of-wants problem is the specific gap money closes.',
    retentionPrompt: 'One week later, explain from memory why barter is harder than a money-based exchange.',
  },
  aiUse: {
    toolUsed: 'Syrka Tutor',
    declaredPurpose: 'Check my reasoning about the new credit scenario before writing my final answer.',
    taskCategories: ['reasoning_check'],
    acceptedClaim: 'The Tutor confirmed the shopkeeper-credit scenario counts as informal credit.',
    changedClaim: 'Added my own explanation of why the interest-rate difference matters, which the Tutor had not covered.',
    verification: 'Checked the formal/informal credit distinction against the chapter\'s own definitions.',
    detectedError: 'None found — the Tutor\'s classification was consistent with the chapter.',
    independentDefence: 'I can defend why this specific scenario is informal credit using the chapter\'s own criteria, not just because the Tutor said so.',
  },
})

const POLISCI_FIXTURE = buildAdaptiveChapterFixture({
  code: 'pol',
  subject: 'Political Science',
  chapterId: 'ncert-chapter-pol-4',
  conceptId: 'ncert-concept-pol-4-1',
  conceptTitle: 'Functions of political parties',
  capabilityId: 'cap-10',
  session1: {
    activity: 'Guided analysis: why elections alone are not enough',
    studentResponse: 'Listed "winning elections" as the only real function of a political party, collapsing several distinct functions into one.',
    misconception: 'Collapses the distinct functions of political parties (forming government, shaping policy, providing opposition) into one generic "winning elections" function.',
    hintLevelUsed: 2,
  },
  session2: {
    changedApproach: 'A direct side-by-side comparison of two named functions (forming government vs. providing opposition) to force the distinction',
    studentResponse: 'Correctly distinguished the accountability function (opposition) from the governing function, with a specific example of each.',
    hintLevelUsed: 1,
  },
  session3: {
    transferPrompt: 'Apply the same functions framework to evaluate a different party system not covered in class.',
    explainBack: 'Explained why a democracy with elections but no organised opposition would struggle to hold government accountable.',
    retentionPrompt: 'One week later, re-list the distinct functions of political parties from memory.',
  },
  aiUse: {
    toolUsed: 'Syrka Tutor',
    declaredPurpose: 'Get feedback on my argument comparing two party systems before submitting.',
    taskCategories: ['argument_review'],
    acceptedClaim: 'The Tutor agreed my comparison correctly applied the functions framework.',
    changedClaim: 'Added a counterargument the Tutor had not raised, about coalition governments diluting the opposition function.',
    verification: 'Checked my counterargument against the chapter\'s own discussion of coalition politics.',
    detectedError: 'The Tutor\'s example of an opposition party was outdated relative to the chapter\'s own case; corrected using the chapter\'s example instead.',
    independentDefence: 'I can explain, independent of the Tutor\'s wording, why the opposition function specifically requires more than one viable party.',
  },
})

export const ADAPTIVE_LEARNING_FIXTURES = {
  english: ENGLISH_FIXTURE,
  geography: GEOGRAPHY_FIXTURE,
  economics: ECONOMICS_FIXTURE,
  politicalScience: POLISCI_FIXTURE,
}

export const adaptiveLearnerModels: Record<string, LearnerModelProjection> = {
  'ncert-chapter-eng-1': ENGLISH_FIXTURE.learnerModel,
  'ncert-chapter-geo-1': GEOGRAPHY_FIXTURE.learnerModel,
  'ncert-chapter-eco-3': ECONOMICS_FIXTURE.learnerModel,
  'ncert-chapter-pol-4': POLISCI_FIXTURE.learnerModel,
}

export const TEACHER_ACTOR_ID = TEACHER_ID
