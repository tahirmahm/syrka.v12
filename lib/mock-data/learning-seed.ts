import type {
  LearningCurriculum,
  LearningCourse,
  LearningUnit,
  LearningChapter,
  LearningLesson,
  LearningSection,
  LearningConcept,
  LearningPrerequisite,
  LearningExplanation,
  WorkedExample,
  LearningActivity,
  LearningQuestion,
  LearningFigure,
  LearningEquation,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  SourceRegion,
  SourceReference,
  ExtractionWarning,
  TeacherCorrection,
  LearningSpace,
  LearningSpaceVersion,
  CurriculumOwner,
  CurriculumReview,
  CurriculumPublication,
  AssessmentPolicy,
  LearningAssessment,
  AssessmentAttempt,
  AnswerKeyEntry,
  AnswerKeyAccessLog,
  AnswerKeyAccessPolicy,
  LearningSession,
  LearningAttempt,
  TutorHint,
  TutorResponse,
  MisconceptionRecord,
  LearningObservation,
  LearningObservationSummary,
  ObservationVisibilityPolicy,
  InstructionalDisclosureRule,
  LearningVisualRequest,
  DeterministicVisualDefinition,
  GenerativeVisualRequest,
  LearningVisualRecord,
  EvidenceCandidate,
  ProvenanceRecord,
  CapabilityInferenceBasis,
  CapabilityInference,
  DisclosurePermission,
} from '@/lib/campus-types'
import { validateLearningData } from '@/lib/validation/validate-learning-data'
import { computeInferenceConfidence } from '@/lib/services/profile/inference'

const STUDENT_ID = 'student-1'
const TEACHER_ID = 'fac-1'
export const LEARNING_NOW = '2026-07-20T00:00:00.000Z'

// ---------------------------------------------------------------------------
// Content — the Chapter 1 vertical-slice curriculum, architected (not
// implemented as a live workspace). NCERT Class X Science is used strictly
// as a private development/demonstration corpus (see the copyright
// posture in the checkpoint) — nothing here is the source textbook text.
// ---------------------------------------------------------------------------

export const learningCurricula: LearningCurriculum[] = [
  { id: 'lc-curriculum-1', title: 'NCERT Class X Science', subjectLabel: 'Class X Science', ownerId: TEACHER_ID },
]

export const learningCourses: LearningCourse[] = [{ id: 'lc-course-1', curriculumId: 'lc-curriculum-1', title: 'Class X Science', gradeLevel: 'Grade 10' }]

export const learningUnits: LearningUnit[] = [{ id: 'lc-unit-1', courseId: 'lc-course-1', title: 'Chemistry', order: 1 }]

export const learningChapters: LearningChapter[] = [
  { id: 'lc-chapter-1', unitId: 'lc-unit-1', title: 'Chemical Reactions and Equations', order: 1, sourceDocumentId: 'lsrc-doc-1' },
]

export const learningLessons: LearningLesson[] = [
  { id: 'lc-lesson-1', chapterId: 'lc-chapter-1', title: 'Balancing Chemical Equations', order: 1, conceptIds: ['lc-concept-1', 'lc-concept-2'] },
]

export const learningSections: LearningSection[] = [{ id: 'lc-section-1', lessonId: 'lc-lesson-1', title: 'Why equations must balance', order: 1, sourceReferenceIds: ['lsrc-ref-1'] }]

export const learningConcepts: LearningConcept[] = [
  { id: 'lc-concept-1', title: 'Balancing chemical equations', description: 'Adjusting coefficients so atom counts match on both sides.', domain: 'Chemistry' },
  { id: 'lc-concept-2', title: 'Conservation of mass', description: 'Matter is neither created nor destroyed in a chemical reaction.', domain: 'Chemistry' },
]

export const learningPrerequisites: LearningPrerequisite[] = [{ id: 'lc-prereq-1', conceptId: 'lc-concept-1', requiresConceptId: 'lc-concept-2' }]

export const learningExplanations: LearningExplanation[] = [
  {
    id: 'lc-explanation-1',
    conceptId: 'lc-concept-1',
    body: 'Original Syrka explanation: count atoms of each element on both sides of the arrow, then adjust coefficients (never subscripts) until every element balances.',
    sourceReferenceIds: ['lsrc-ref-1'],
  },
]

export const workedExamples: WorkedExample[] = [
  { id: 'lc-example-1', conceptId: 'lc-concept-1', prompt: 'Balance: Fe + H2O -> Fe3O4 + H2', steps: ['Count Fe, H, O on each side.', 'Adjust Fe coefficient to 3.', 'Adjust H2O and H2 coefficients to balance H and O.'], sourceReferenceIds: ['lsrc-ref-1'] },
]

export const learningActivities: LearningActivity[] = [
  {
    id: 'lc-activity-1',
    lessonId: 'lc-lesson-1',
    kind: 'practical',
    title: 'Heating a test tube of iron filings and sulphur',
    instructions: 'Demonstration only — do not perform unsupervised.',
    safetyClassification: 'teacher_supervision_required',
    safetyWarningSourceReferenceId: 'lsrc-ref-1',
  },
]

export const learningQuestions: LearningQuestion[] = [
  { id: 'lc-question-diagnostic', conceptId: 'lc-concept-1', kind: 'diagnostic', prompt: 'What does it mean for an equation to be "balanced"?', answerKeyEntryId: 'lak-entry-diagnostic', sourceReferenceIds: ['lsrc-ref-1'] },
  { id: 'lc-question-practice', conceptId: 'lc-concept-1', kind: 'practice', prompt: 'Balance: Fe + H2O -> Fe3O4 + H2', answerKeyEntryId: 'lak-entry-practice', sourceReferenceIds: ['lsrc-ref-1'] },
  { id: 'lc-question-transfer', conceptId: 'lc-concept-1', kind: 'transfer', prompt: 'Balance a materially different equation: N2 + H2 -> NH3', answerKeyEntryId: 'lak-entry-transfer', sourceReferenceIds: ['lsrc-ref-1'] },
]

export const learningFigures: LearningFigure[] = [{ id: 'lc-figure-1', conceptId: 'lc-concept-1', caption: 'Reactants and products, atom-for-atom.', sourceReferenceId: 'lsrc-ref-1', origin: 'syrka_deterministic_visual' }]

export const learningEquations: LearningEquation[] = [{ id: 'lc-equation-1', conceptId: 'lc-concept-1', expression: 'Fe + 4H2O -> Fe3O4 + 4H2', sourceReferenceId: 'lsrc-ref-1' }]

// ---------------------------------------------------------------------------
// Source & provenance
// ---------------------------------------------------------------------------

export const learningDocuments: LearningDocument[] = [
  { id: 'lsrc-doc-1', title: 'NCERT Class X Science', sourceLabel: 'NCERT Class X Science — private development/demonstration corpus only', ownerId: TEACHER_ID, currentVersionId: 'lsrc-docver-1', publicationStatus: 'published' },
  { id: 'lsrc-doc-2', title: 'A different source document (for the mismatched-version scenario)', sourceLabel: 'Unrelated document', ownerId: TEACHER_ID, publicationStatus: 'draft' },
]

export const learningDocumentVersions: LearningDocumentVersion[] = [
  { id: 'lsrc-docver-1', documentId: 'lsrc-doc-1', version: 1, createdAt: '2026-05-01T00:00:00.000Z', extractionMethod: 'native_pdf' },
  { id: 'lsrc-docver-2', documentId: 'lsrc-doc-2', version: 1, createdAt: '2026-05-01T00:00:00.000Z', extractionMethod: 'native_pdf' },
]

export const learningPages: LearningPage[] = [
  { id: 'lsrc-page-1', documentVersionId: 'lsrc-docver-1', pageNumber: 12, extractedText: '[private demonstration excerpt — not reproduced publicly]', extractionConfidence: 0.95 },
  { id: 'lsrc-page-2', documentVersionId: 'lsrc-docver-1', pageNumber: 13, extractedText: '[low-confidence OCR fallback text]', extractionConfidence: 0.4 },
]

export const sourceRegions: SourceRegion[] = [{ id: 'lsrc-region-1', pageId: 'lsrc-page-1', boundingBox: { x: 0.1, y: 0.2, width: 0.6, height: 0.15 } }]

export const sourceReferences: SourceReference[] = [
  // Valid citation.
  { id: 'lsrc-ref-1', documentId: 'lsrc-doc-1', documentVersionId: 'lsrc-docver-1', chapterId: 'lc-chapter-1', sectionId: 'lc-section-1', pageId: 'lsrc-page-1', regionId: 'lsrc-region-1', excerpt: '[demonstration excerpt]', extractionConfidence: 0.95 },
  // Invalid: documentVersionId points at a version belonging to a different document.
  { id: 'lsrc-ref-mismatched-version', documentId: 'lsrc-doc-1', documentVersionId: 'lsrc-docver-2', pageId: 'lsrc-page-1', extractionConfidence: 0.9 },
]

export const extractionWarnings: ExtractionWarning[] = [
  { id: 'lsrc-warning-1', pageId: 'lsrc-page-2', severity: 'high', description: 'Low-confidence OCR fallback — table structure not confirmed.', resolved: false },
]

export const teacherCorrections: TeacherCorrection[] = [
  { id: 'lsrc-correction-1', targetType: 'page', targetId: 'lsrc-page-1', teacherId: TEACHER_ID, correctedAt: '2026-05-05T00:00:00.000Z', note: 'Confirmed reading order.', changeSummary: 'Reordered two paragraphs that OCR had swapped.' },
]

// ---------------------------------------------------------------------------
// Curriculum governance
// ---------------------------------------------------------------------------

export const curriculumOwners: CurriculumOwner[] = [{ id: 'lg-owner-1', learningSpaceId: 'lg-space-1', primaryOwnerId: TEACHER_ID, contributorIds: [] }]

export const learningSpaces: LearningSpace[] = [{ id: 'lg-space-1', title: 'Class X Science — Chapter 1', curriculumId: 'lc-curriculum-1', ownerId: 'lg-owner-1', currentVersionId: 'lg-version-1', lifecycleState: 'published' }]

export const learningSpaceVersions: LearningSpaceVersion[] = [{ id: 'lg-version-1', learningSpaceId: 'lg-space-1', version: 1, createdAt: '2026-05-06T00:00:00.000Z' }]

export const curriculumReviews: CurriculumReview[] = [{ id: 'lg-review-1', learningSpaceVersionId: 'lg-version-1', reviewerId: TEACHER_ID, decision: 'approved', note: 'Structure and citations checked against source.', reviewedAt: '2026-05-06T00:00:00.000Z' }]

export const curriculumPublications: CurriculumPublication[] = [{ id: 'lg-publication-1', learningSpaceVersionId: 'lg-version-1', publishedAt: '2026-05-07T00:00:00.000Z' }]

// ---------------------------------------------------------------------------
// Assessment authority — Tutor-generated practice, teacher-authored
// formative, institution-authored summative, each a distinct AssessmentPolicy.
// ---------------------------------------------------------------------------

export const tutorGeneratedPracticePolicy: AssessmentPolicy = {
  purpose: 'practice',
  authority: 'tutor_generated',
  hintsAllowed: true,
  answerRevealAllowed: true,
  retriesAllowed: null,
  teacherReviewRequired: false,
  mayProduceEvidenceCandidate: false,
  mayProduceInstitutionalGrade: false,
}

export const teacherAuthoredFormativePolicy: AssessmentPolicy = {
  purpose: 'formative',
  authority: 'teacher_authored',
  hintsAllowed: false,
  answerRevealAllowed: false,
  retriesAllowed: 2,
  teacherReviewRequired: true,
  mayProduceEvidenceCandidate: true,
  mayProduceInstitutionalGrade: false,
}

export const institutionAuthoredSummativePolicy: AssessmentPolicy = {
  purpose: 'summative',
  authority: 'institution_authored',
  hintsAllowed: false,
  answerRevealAllowed: false,
  retriesAllowed: 0,
  timeLimitMinutes: 40,
  teacherReviewRequired: true,
  mayProduceEvidenceCandidate: true,
  mayProduceInstitutionalGrade: true,
}

export const learningAssessments: LearningAssessment[] = [
  { id: 'la-assessment-practice', lessonId: 'lc-lesson-1', title: 'Practice: balancing equations', questionIds: ['lc-question-practice'], policy: tutorGeneratedPracticePolicy },
  { id: 'la-assessment-formative', lessonId: 'lc-lesson-1', title: 'Formative check: balancing equations', questionIds: ['lc-question-practice', 'lc-question-transfer'], policy: teacherAuthoredFormativePolicy },
  { id: 'la-assessment-summative', lessonId: 'lc-lesson-1', title: 'Chapter 1 unit test', questionIds: ['lc-question-diagnostic', 'lc-question-practice', 'lc-question-transfer'], policy: institutionAuthoredSummativePolicy },
]

export const assessmentAttempts: AssessmentAttempt[] = [
  // Governed Exam attempt — institution-authored, exam mode, still open.
  { id: 'la-attempt-exam-open', assessmentId: 'la-assessment-summative', studentId: STUDENT_ID, policySnapshot: institutionAuthoredSummativePolicy, tutorMode: 'exam', startedAt: LEARNING_NOW },
  // Tutor-generated practice attempt in practice mode — non-authoritative.
  { id: 'la-attempt-practice', assessmentId: 'la-assessment-practice', studentId: STUDENT_ID, policySnapshot: tutorGeneratedPracticePolicy, tutorMode: 'practice', startedAt: LEARNING_NOW, submittedAt: LEARNING_NOW },
]

// ---------------------------------------------------------------------------
// Answer Key Vault — access denied (Socratic, mid-diagnosis) and access
// allowed (after the ladder reaches level 7 under a permitted_reveal reason).
// ---------------------------------------------------------------------------

export const answerKeyEntries: AnswerKeyEntry[] = [
  { id: 'lak-entry-diagnostic', questionId: 'lc-question-diagnostic', version: 1, content: '[answer content — never present in ordinary Tutor context fixtures]' },
  { id: 'lak-entry-practice', questionId: 'lc-question-practice', version: 1, content: '[answer content]' },
  { id: 'lak-entry-transfer', questionId: 'lc-question-transfer', version: 1, content: '[answer content]' },
]

export const answerKeyAccessPolicies: AnswerKeyAccessPolicy[] = [
  { id: 'lak-policy-socratic', tutorMode: 'socratic', allowedReasons: ['validation', 'permitted_reveal'], minimumHintLevelForReveal: 7 },
  { id: 'lak-policy-exam', tutorMode: 'exam', allowedReasons: ['feedback'], minimumHintLevelForReveal: 7 },
]

export const answerKeyAccessLogs: AnswerKeyAccessLog[] = [
  // Allowed: hint level 7 reached, reason permitted_reveal, matches lak-policy-socratic.
  { id: 'lak-access-allowed', answerKeyEntryId: 'lak-entry-practice', sessionId: 'li-session-socratic', accessedAt: LEARNING_NOW, reason: 'permitted_reveal', revealLevel: 7 },
]

/**
 * The "Answer Key access denied" scenario — requesting a permitted_reveal
 * before the hint ladder is exhausted must fail validateAnswerKeyAccess,
 * and is therefore never persisted as an AnswerKeyAccessLog above (a
 * denied access produces no log entry, only a rejection).
 */
export const deniedAnswerKeyAccessAttempt = { policyId: 'lak-policy-socratic', reason: 'permitted_reveal' as const, hintLevel: 2 }

// ---------------------------------------------------------------------------
// Interaction — sessions, attempts, hints, responses, misconceptions.
// ---------------------------------------------------------------------------

export const learningSessions: LearningSession[] = [
  // Initial Socratic attempt — fresh session, diagnose state.
  { id: 'li-session-socratic', studentId: STUDENT_ID, lessonId: 'lc-lesson-1', mode: 'socratic', currentState: 'diagnose', startedAt: LEARNING_NOW },
  // Governed exam session, still open (mirrors assessmentAttempts' open exam attempt).
  { id: 'li-session-exam', studentId: STUDENT_ID, lessonId: 'lc-lesson-1', mode: 'exam', currentState: 'diagnose', startedAt: LEARNING_NOW },
]

export const learningAttempts: LearningAttempt[] = [
  { id: 'li-attempt-guided', sessionId: 'li-session-socratic', studentId: STUDENT_ID, questionId: 'lc-question-practice', hintLevelUsed: 4, independenceLevel: 'substantially_guided', submittedAt: LEARNING_NOW, correct: true },
  { id: 'li-attempt-independent-transfer', sessionId: 'li-session-socratic', studentId: STUDENT_ID, questionId: 'lc-question-transfer', hintLevelUsed: 0, independenceLevel: 'independent', submittedAt: LEARNING_NOW, correct: true },
]

export const tutorHints: TutorHint[] = [
  // Progressive hint escalation, levels 1 through 6 (level 7 is the reveal itself, modelled separately below).
  ...([1, 2, 3, 4, 5, 6] as const).map((level) => ({ id: `li-hint-${level}`, sessionId: 'li-session-socratic', level, issuedAt: LEARNING_NOW })),
]

export const misconceptionRecords: MisconceptionRecord[] = [
  // Recurrence — the same misconception observed three times.
  { id: 'li-misconception-1', studentId: STUDENT_ID, conceptId: 'lc-concept-1', description: 'Adjusts subscripts instead of coefficients to balance.', firstObservedAt: '2026-07-01T00:00:00.000Z', recurrenceCount: 3 },
]

export const tutorResponses: TutorResponse[] = [
  // Full-answer reveal (hintLevel 7) followed, in a later response, by a transfer question — see the requiresTransferBeforeSummary check.
  { id: 'li-response-reveal', sessionId: 'li-session-socratic', intent: 'hint', text: '[complete worked solution — level 7 reveal]', hintLevel: 7, mayRevealFinalAnswer: true, recommendedNextState: 'transfer', sourceReferenceIds: ['lsrc-ref-1'], recordedAt: LEARNING_NOW },
  { id: 'li-response-transfer', sessionId: 'li-session-socratic', intent: 'transfer', text: 'Now balance a different equation: N2 + H2 -> NH3', hintLevel: 0, mayRevealFinalAnswer: false, recommendedNextState: 'reflection', sourceReferenceIds: ['lsrc-ref-1'], recordedAt: LEARNING_NOW },
]

/** The private raw transcript — never crosses into student_and_teacher tier or above without an explicit InstructionalDisclosureRule permitting it (none does, in Stage A). */
export const rawTutorTranscriptExcerpt = 'Student: I don\'t get why the 4 goes there.\nTutor: What happens to the H count if we don\'t?'

// ---------------------------------------------------------------------------
// Observation — guided vs. independent, and the visibility tiers.
// ---------------------------------------------------------------------------

export const learningObservations: LearningObservation[] = [
  // "attempt" observation.
  { id: 'lo-attempt', studentId: STUDENT_ID, courseId: 'lc-course-1', lessonId: 'lc-lesson-1', conceptId: 'lc-concept-1', observationType: 'attempt', tutorMode: 'socratic', independenceLevel: 'fully_guided', sourceReferences: [], recordedAt: LEARNING_NOW },
  // Guided solution — used hints, not independent.
  { id: 'lo-guided', studentId: STUDENT_ID, courseId: 'lc-course-1', lessonId: 'lc-lesson-1', conceptId: 'lc-concept-1', observationType: 'guided_solution', tutorMode: 'socratic', independenceLevel: 'substantially_guided', sourceReferences: [{ id: 'lsrc-ref-1', documentId: 'lsrc-doc-1', documentVersionId: 'lsrc-docver-1', pageId: 'lsrc-page-1' }], attemptId: 'li-attempt-guided', hintLevel: 4, recordedAt: LEARNING_NOW },
  // Independent transfer — the required "possible Evidence candidate" scenario.
  {
    id: 'lo-independent-transfer',
    studentId: STUDENT_ID,
    courseId: 'lc-course-1',
    lessonId: 'lc-lesson-1',
    conceptId: 'lc-concept-1',
    observationType: 'independent_solution',
    tutorMode: 'socratic',
    independenceLevel: 'independent',
    sourceReferences: [{ id: 'lsrc-ref-1', documentId: 'lsrc-doc-1', documentVersionId: 'lsrc-docver-1', pageId: 'lsrc-page-1' }],
    attemptId: 'li-attempt-independent-transfer',
    hintLevel: 0,
    recordedAt: LEARNING_NOW,
  },
  // The illegal-claim counter-example: correct immediately after a level-7 reveal, WITHOUT a materially different transfer problem — kept here only to prove the validator rejects it (never treated as legitimate independent_solution).
  {
    id: 'lo-illegitimate-independent-claim',
    studentId: STUDENT_ID,
    courseId: 'lc-course-1',
    lessonId: 'lc-lesson-1',
    conceptId: 'lc-concept-1',
    observationType: 'independent_solution',
    tutorMode: 'socratic',
    independenceLevel: 'independent',
    sourceReferences: [],
    hintLevel: 7,
    followsMaterializedTransferAfterReveal: false,
    recordedAt: LEARNING_NOW,
  },
]

export const learningObservationSummaries: LearningObservationSummary[] = [
  // Teacher-visible instructional summary — the aggregated view, never raw transcripts.
  {
    id: 'lo-summary-1',
    studentId: STUDENT_ID,
    courseId: 'lc-course-1',
    conceptsNeedingAttention: ['lc-concept-1'],
    assessmentStatusSummary: '1 formative assessment pending review.',
    hintDependenceLevel: 'moderate',
    independentTransferAchieved: true,
    safetyInterruptionOccurred: false,
    teacherActionRequired: false,
    summarisedAt: LEARNING_NOW,
  },
]

export const observationVisibilityPolicies: ObservationVisibilityPolicy[] = [
  { id: 'lov-policy-attempt', observationType: 'attempt', tier: 'student_private', description: 'Raw attempts stay student-private.' },
  { id: 'lov-policy-misconception', observationType: 'misconception', tier: 'student_private', description: 'Raw misconception detail stays student-private; only aggregated concern surfaces in a summary.' },
  { id: 'lov-policy-guided', observationType: 'guided_solution', tier: 'student_private', description: 'Guided-solution detail stays student-private.' },
  { id: 'lov-policy-transfer', observationType: 'transfer_demonstrated', tier: 'student_and_teacher', description: 'Independent-transfer achievement is summarised for the assigned teacher.' },
]

export const instructionalDisclosureRules: InstructionalDisclosureRule[] = [
  { id: 'lov-rule-private-to-teacher', fromTier: 'student_private', toTier: 'student_and_teacher', allowed: false },
  { id: 'lov-rule-teacher-to-evidence', fromTier: 'student_and_teacher', toTier: 'evidence_review', allowed: true, requiresCoursePolicy: true },
  {
    id: 'lov-rule-teacher-to-institutional',
    fromTier: 'student_and_teacher',
    toTier: 'department_university_aggregate',
    allowed: true,
    requiresDeidentification: true,
    requiresMinimumCohortSize: 10,
    purposeLimitation: 'Aggregate curriculum-effectiveness reporting only — no individual identification.',
  },
  // Explicitly disallowed direct path — nothing skips straight from private to institutional aggregate.
  { id: 'lov-rule-private-to-institutional-denied', fromTier: 'student_private', toTier: 'department_university_aggregate', allowed: false },
]

// The specific "Department-ineligible individual observation" scenario: lo-guided (student_private tier) must never be disclosable to department_university_aggregate.
export const departmentIneligibleObservationId = 'lo-guided'

// ---------------------------------------------------------------------------
// Visuals — a deterministic request, and a generated-illustration request
// that must fall back honestly (no bound provider).
// ---------------------------------------------------------------------------

export const deterministicVisualDefinitions: DeterministicVisualDefinition[] = [
  { id: 'lv-def-balancing', kind: 'chemical_equation_balancing', conceptId: 'lc-concept-1', rendererKey: 'chemical-equation-balancer-v1', supportsReducedMotion: true, accessibilityDescriptionTemplate: 'A balanced chemical equation with atom counts labelled on both sides.' },
  { id: 'lv-def-atom-count', kind: 'atom_counting', conceptId: 'lc-concept-1', rendererKey: 'atom-counter-v1', supportsReducedMotion: true, accessibilityDescriptionTemplate: 'A table of atom counts per element, reactants vs products.' },
]

export const learningVisualRequests: LearningVisualRequest[] = [
  {
    id: 'lv-request-deterministic',
    visualPurpose: 'show_process',
    renderer: 'equation_animation',
    conceptId: 'lc-concept-1',
    learningObjective: 'See atom counts balance across the reaction.',
    visualBrief: 'Animate coefficients adjusting until both sides match.',
    requiredEntities: ['Fe', 'H2O', 'Fe3O4', 'H2'],
    requiredRelationships: ['conservation_of_mass'],
    prohibitedElements: ['invented elements not in the equation'],
    sourceReferenceIds: ['lsrc-ref-1'],
    factualConstraints: ['Coefficients must reflect a genuinely balanced equation.'],
    accessibilityDescription: 'A balanced chemical equation with atom counts labelled on both sides.',
  },
  {
    id: 'lv-request-generated-unbound',
    visualPurpose: 'provide_context',
    renderer: 'generated_illustration',
    conceptId: 'lc-concept-1',
    learningObjective: 'Show a contextual illustration of a chemical reaction in a lab setting.',
    visualBrief: 'A friendly illustration of a beaker reaction, for engagement only — not scientific ground truth.',
    requiredEntities: [],
    requiredRelationships: [],
    prohibitedElements: ['exact chemical formulae as the source of truth'],
    sourceReferenceIds: [],
    factualConstraints: [],
    accessibilityDescription: 'An illustration of a beaker with a colour-changing liquid.',
  },
]

export const generativeVisualRequests: GenerativeVisualRequest[] = [
  { id: 'lv-generative-unbound', visualRequestId: 'lv-request-generated-unbound', concept: 'Chemical reactions', learningObjective: 'Show a contextual illustration of a chemical reaction in a lab setting.', factualConstraints: [], visualPurpose: 'provide_context' },
]

export const learningVisualRecords: LearningVisualRecord[] = [
  {
    id: 'lv-record-deterministic',
    visualRequestId: 'lv-request-deterministic',
    rendererUsed: 'equation_animation',
    generatedAt: LEARNING_NOW,
    sourceReferenceIds: ['lsrc-ref-1'],
    validationStatus: 'valid',
    accessibilityDescription: 'A balanced chemical equation with atom counts labelled on both sides.',
    classification: 'deterministic',
    failureState: 'none',
    fallbackUsed: false,
  },
  {
    id: 'lv-record-generated-fallback',
    visualRequestId: 'lv-request-generated-unbound',
    rendererUsed: 'generated_illustration',
    generatedAt: LEARNING_NOW,
    sourceReferenceIds: [],
    validationStatus: 'valid',
    accessibilityDescription: 'An illustration of a beaker with a colour-changing liquid.',
    classification: 'generated',
    failureState: 'provider_unavailable',
    fallbackUsed: true,
  },
]

// ---------------------------------------------------------------------------
// Passport Intelligence connection — Learning-derived Evidence entering the
// existing pipeline, and a Learning observation that stays excluded from
// any Passport projection.
// ---------------------------------------------------------------------------

export const learningProvenanceRecords: ProvenanceRecord[] = [
  {
    id: 'lp-prov-independent-transfer',
    source: 'campus_learning',
    sourceIdentifier: 'li-attempt-independent-transfer',
    owner: STUDENT_ID,
    importMethod: 'native_syrka',
    importedAt: LEARNING_NOW,
    authorityClass: 'institutionally_reviewed',
    derivationType: 'human_reviewed',
    corroboratingSources: [],
    linkedArtefactIds: [],
    disclosurePermissionIds: ['lp-disclose-passport'],
  },
]

export const learningEvidenceCandidates: EvidenceCandidate[] = [
  {
    id: 'lp-candidate-independent-transfer',
    studentId: STUDENT_ID,
    learningOriginId: 'lo-independent-transfer',
    learningEvidenceSubtype: 'independent_transfer',
    proposedCapabilityIds: ['cap-2'],
    rationale: 'Independent transfer solution on a materially different balancing problem, teacher-reviewed.',
    provenanceId: 'lp-prov-independent-transfer',
  },
]

export const learningCapabilityInferenceBases: CapabilityInferenceBasis[] = [
  { id: 'lp-basis-1', description: 'Independent transfer solution, teacher-reviewed.', evidenceCandidateId: 'lp-candidate-independent-transfer', weight: 'primary' },
  { id: 'lp-basis-2', description: 'Consistent performance across two related concepts in the same lesson.', evidenceCandidateId: 'lp-candidate-independent-transfer', weight: 'supporting' },
]

export const learningCapabilityInferences: CapabilityInference[] = [
  {
    id: 'lp-inference-1',
    studentId: STUDENT_ID,
    capabilityId: 'cap-2',
    basisIds: ['lp-basis-1', 'lp-basis-2'],
    confidence: computeInferenceConfidence([
      { id: 'lp-basis-1', description: '', evidenceCandidateId: 'lp-candidate-independent-transfer', weight: 'primary' },
      { id: 'lp-basis-2', description: '', evidenceCandidateId: 'lp-candidate-independent-transfer', weight: 'supporting' },
    ]),
    maturityEstimate: 'Developing',
    provenanceId: 'lp-prov-independent-transfer',
    computedAt: LEARNING_NOW,
  },
]

export const learningDisclosurePermissions: DisclosurePermission[] = [
  // Explicitly allowed into the Passport.
  { id: 'lp-disclose-passport', studentId: STUDENT_ID, recordType: 'evidence_candidate', recordId: 'lp-candidate-independent-transfer', audience: 'passport', allowed: true, setAt: LEARNING_NOW },
]

// The "Learning observation excluded from Passport projection" scenario: a
// guided-solution (and a misconception) observation never become an
// EvidenceCandidate at all — there is structurally no DisclosurePermission
// to grant or deny, because raw process data never reaches the point of
// having a Passport-facing identity. lo-guided and li-misconception-1
// intentionally have no corresponding EvidenceCandidate anywhere above;
// the validator (validateLearningEvidenceEligibility) asserts exactly that.
export const observationsExcludedFromPassportProjection = ['lo-guided', 'li-misconception-1'] as const

// ---------------------------------------------------------------------------
// Runs unconditionally, mirroring lib/mock-data/seed.ts's own
// validateSeedData pattern.
// ---------------------------------------------------------------------------

const learningDataErrors = validateLearningData({
  learningConcepts,
  learningPrerequisites,
  learningQuestions,
  answerKeyEntries,
  learningActivities,
  learningDocuments,
  learningDocumentVersions,
  learningPages,
  sourceReferences,
  extractionWarnings,
  learningAssessments,
  assessmentAttempts,
  answerKeyAccessPolicies,
  answerKeyAccessLogs,
  deniedAnswerKeyAccessAttempt,
  learningSessions,
  learningAttempts,
  tutorHints,
  tutorResponses,
  misconceptionRecords,
  learningObservations,
  observationVisibilityPolicies,
  instructionalDisclosureRules,
  departmentIneligibleObservationId,
  learningVisualRequests,
  deterministicVisualDefinitions,
  learningVisualRecords,
  learningEvidenceCandidates,
  learningCapabilityInferenceBases,
  learningCapabilityInferences,
  learningProvenanceRecords,
  learningDisclosurePermissions,
  observationsExcludedFromPassportProjection: [...observationsExcludedFromPassportProjection],
})
if (learningDataErrors.length > 0) {
  throw new Error(`Learning data integrity check failed:\n${learningDataErrors.join('\n')}`)
}
