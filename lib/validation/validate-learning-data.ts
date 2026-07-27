import type {
  LearningConcept,
  LearningPrerequisite,
  LearningQuestion,
  AnswerKeyEntry,
  LearningActivity,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  SourceReference,
  ExtractionWarning,
  LearningAssessment,
  AssessmentAttempt,
  AnswerKeyAccessPolicy,
  AnswerKeyAccessLog,
  AnswerKeyAccessReason,
  LearningSession,
  LearningAttempt,
  TutorHint,
  TutorResponse,
  MisconceptionRecord,
  LearningObservation,
  ObservationVisibilityPolicy,
  InstructionalDisclosureRule,
  LearningVisualRequest,
  DeterministicVisualDefinition,
  LearningVisualRecord,
  EvidenceCandidate,
  CapabilityInferenceBasis,
  CapabilityInference,
  ProvenanceRecord,
  DisclosurePermission,
} from '@/lib/campus-types'
import { validateTutorTransition, validateModeSwitch, requiresTransferBeforeSummary, validateIndependenceClaim, canRevealCompleteSolution, TUTOR_MODE_POLICIES } from '@/lib/services/learning/tutor-state-machine'
import { validateAnswerKeyAccess } from '@/lib/services/learning/answer-key'
import { validateTutorGeneratedNonAuthoritative, validateAuthorityNotInferredFromMode, isEligibleForEvidenceCandidate } from '@/lib/services/learning/assessment-authority'
import { isDisclosureAllowed, requiresDeidentification } from '@/lib/services/learning/observation-visibility'
import { validateCitation, validateModelClaimedCitation } from '@/lib/services/learning/citations'
import { validateVisualRequest, resolveVisualFallback, findDeterministicVisual } from '@/lib/services/learning/visual-router'
import { isVisibleToAudience } from '@/lib/services/profile/disclosure'

export interface LearningDataInput {
  learningConcepts: LearningConcept[]
  learningPrerequisites: LearningPrerequisite[]
  learningQuestions: LearningQuestion[]
  answerKeyEntries: AnswerKeyEntry[]
  learningActivities: LearningActivity[]
  learningDocuments: LearningDocument[]
  learningDocumentVersions: LearningDocumentVersion[]
  learningPages: LearningPage[]
  sourceReferences: SourceReference[]
  extractionWarnings: ExtractionWarning[]
  learningAssessments: LearningAssessment[]
  assessmentAttempts: AssessmentAttempt[]
  answerKeyAccessPolicies: AnswerKeyAccessPolicy[]
  answerKeyAccessLogs: AnswerKeyAccessLog[]
  deniedAnswerKeyAccessAttempt: { policyId: string; reason: AnswerKeyAccessReason; hintLevel: number }
  learningSessions: LearningSession[]
  learningAttempts: LearningAttempt[]
  tutorHints: TutorHint[]
  tutorResponses: TutorResponse[]
  misconceptionRecords: MisconceptionRecord[]
  learningObservations: LearningObservation[]
  observationVisibilityPolicies: ObservationVisibilityPolicy[]
  instructionalDisclosureRules: InstructionalDisclosureRule[]
  departmentIneligibleObservationId: string
  learningVisualRequests: LearningVisualRequest[]
  deterministicVisualDefinitions: DeterministicVisualDefinition[]
  learningVisualRecords: LearningVisualRecord[]
  learningEvidenceCandidates: EvidenceCandidate[]
  learningCapabilityInferenceBases: CapabilityInferenceBasis[]
  learningCapabilityInferences: CapabilityInference[]
  learningProvenanceRecords: ProvenanceRecord[]
  learningDisclosurePermissions: DisclosurePermission[]
  observationsExcludedFromPassportProjection: string[]
}

/** 1. Learning domain integrity — every id one entity points at must resolve to a record that actually exists. */
function validateDomainIntegrity(data: LearningDataInput): string[] {
  const errors: string[] = []
  const conceptIds = new Set(data.learningConcepts.map((c) => c.id))
  const answerKeyIds = new Set(data.answerKeyEntries.map((e) => e.id))
  const documentIds = new Set(data.learningDocuments.map((d) => d.id))
  const documentVersionIds = new Set(data.learningDocumentVersions.map((v) => v.id))
  const pageIds = new Set(data.learningPages.map((p) => p.id))
  const assessmentIds = new Set(data.learningAssessments.map((a) => a.id))
  const sessionIds = new Set(data.learningSessions.map((s) => s.id))
  const questionIds = new Set(data.learningQuestions.map((q) => q.id))
  const observationIds = new Set(data.learningObservations.map((o) => o.id))
  const evidenceCandidateIds = new Set(data.learningEvidenceCandidates.map((c) => c.id))
  const provenanceIds = new Set(data.learningProvenanceRecords.map((p) => p.id))

  data.learningPrerequisites.forEach((p) => {
    if (!conceptIds.has(p.conceptId)) errors.push(`LearningPrerequisite "${p.id}" references unknown concept "${p.conceptId}"`)
    if (!conceptIds.has(p.requiresConceptId)) errors.push(`LearningPrerequisite "${p.id}" references unknown prerequisite concept "${p.requiresConceptId}"`)
  })
  data.learningQuestions.forEach((q) => {
    if (!conceptIds.has(q.conceptId)) errors.push(`LearningQuestion "${q.id}" references unknown concept "${q.conceptId}"`)
    if (!answerKeyIds.has(q.answerKeyEntryId)) errors.push(`LearningQuestion "${q.id}" references unknown answer key entry "${q.answerKeyEntryId}"`)
  })
  data.learningDocumentVersions.forEach((v) => {
    if (!documentIds.has(v.documentId)) errors.push(`LearningDocumentVersion "${v.id}" references unknown document "${v.documentId}"`)
  })
  data.learningPages.forEach((p) => {
    if (!documentVersionIds.has(p.documentVersionId)) errors.push(`LearningPage "${p.id}" references unknown document version "${p.documentVersionId}"`)
  })
  data.sourceReferences.forEach((r) => {
    if (!documentIds.has(r.documentId)) errors.push(`SourceReference "${r.id}" references unknown document "${r.documentId}"`)
    if (!documentVersionIds.has(r.documentVersionId)) errors.push(`SourceReference "${r.id}" references unknown document version "${r.documentVersionId}"`)
    if (!pageIds.has(r.pageId)) errors.push(`SourceReference "${r.id}" references unknown page "${r.pageId}"`)
  })
  data.extractionWarnings.forEach((w) => {
    if (!pageIds.has(w.pageId)) errors.push(`ExtractionWarning "${w.id}" references unknown page "${w.pageId}"`)
  })
  data.assessmentAttempts.forEach((a) => {
    if (!assessmentIds.has(a.assessmentId)) errors.push(`AssessmentAttempt "${a.id}" references unknown assessment "${a.assessmentId}"`)
  })
  data.answerKeyAccessLogs.forEach((log) => {
    if (!answerKeyIds.has(log.answerKeyEntryId)) errors.push(`AnswerKeyAccessLog "${log.id}" references unknown answer key entry "${log.answerKeyEntryId}"`)
    if (!sessionIds.has(log.sessionId)) errors.push(`AnswerKeyAccessLog "${log.id}" references unknown session "${log.sessionId}"`)
  })
  data.learningAttempts.forEach((a) => {
    if (!sessionIds.has(a.sessionId)) errors.push(`LearningAttempt "${a.id}" references unknown session "${a.sessionId}"`)
    if (!questionIds.has(a.questionId)) errors.push(`LearningAttempt "${a.id}" references unknown question "${a.questionId}"`)
  })
  data.tutorHints.forEach((h) => {
    if (!sessionIds.has(h.sessionId)) errors.push(`TutorHint "${h.id}" references unknown session "${h.sessionId}"`)
  })
  data.tutorResponses.forEach((r) => {
    if (!sessionIds.has(r.sessionId)) errors.push(`TutorResponse "${r.id}" references unknown session "${r.sessionId}"`)
  })
  data.misconceptionRecords.forEach((m) => {
    if (!conceptIds.has(m.conceptId)) errors.push(`MisconceptionRecord "${m.id}" references unknown concept "${m.conceptId}"`)
  })
  data.learningVisualRequests.forEach((v) => {
    if (!conceptIds.has(v.conceptId)) errors.push(`LearningVisualRequest "${v.id}" references unknown concept "${v.conceptId}"`)
  })
  data.deterministicVisualDefinitions.forEach((v) => {
    if (!conceptIds.has(v.conceptId)) errors.push(`DeterministicVisualDefinition "${v.id}" references unknown concept "${v.conceptId}"`)
  })
  data.learningCapabilityInferenceBases.forEach((b) => {
    if (!evidenceCandidateIds.has(b.evidenceCandidateId)) errors.push(`CapabilityInferenceBasis "${b.id}" references unknown evidence candidate "${b.evidenceCandidateId}"`)
  })
  data.learningEvidenceCandidates.forEach((c) => {
    if (c.learningOriginId && !observationIds.has(c.learningOriginId)) {
      errors.push(`EvidenceCandidate "${c.id}" references unknown learning origin "${c.learningOriginId}"`)
    }
    if (!provenanceIds.has(c.provenanceId)) errors.push(`EvidenceCandidate "${c.id}" references unknown provenance "${c.provenanceId}"`)
  })

  return errors
}

/** 2. Tutor transitions — the illegal Exam-to-Socratic mid-attempt switch must be rejected; ordinary transitions must be accepted. */
function validateTutorTransitions(): string[] {
  const errors: string[] = []

  const legal = validateTutorTransition({ from: 'diagnose', to: 'elicit_attempt', mode: 'socratic', hintLevel: 0 })
  if (legal.length > 0) errors.push(`Expected "diagnose" -> "elicit_attempt" to be legal in socratic mode: ${legal.join('; ')}`)

  const illegalSwitch = validateModeSwitch('exam', 'socratic', true)
  if (illegalSwitch.length === 0) errors.push('Expected switching from exam mode to socratic mode mid-attempt to be rejected, but it was not.')

  const legalSwitchAfterSubmit = validateModeSwitch('exam', 'socratic', false)
  if (legalSwitchAfterSubmit.length > 0) errors.push(`Expected switching from exam mode to socratic mode after submission to be legal: ${legalSwitchAfterSubmit.join('; ')}`)

  return errors
}

/** 3. Tutor-mode policy — Exam disallows hints, Explain allows an immediate answer, Socratic/Practice do not. */
function validateTutorModePolicy(): string[] {
  const errors: string[] = []
  if (TUTOR_MODE_POLICIES.exam.hintsAllowed) errors.push('Exam mode policy must not allow hints.')
  if (!TUTOR_MODE_POLICIES.explain.immediateAnswerAllowed) errors.push('Explain mode policy should allow an immediate answer (it teaches by direct explanation).')
  if (TUTOR_MODE_POLICIES.socratic.immediateAnswerAllowed) errors.push('Socratic mode policy must not allow an immediate answer.')
  if (TUTOR_MODE_POLICIES.practice.immediateAnswerAllowed) errors.push('Practice mode policy must not allow an immediate answer.')
  return errors
}

/** 4. Hint progression — the ladder fixture must be sequential, and reaching "summarise" must have passed through "transfer". */
function validateHintProgression(data: LearningDataInput): string[] {
  const errors: string[] = []
  const levels = data.tutorHints.filter((h) => h.sessionId === 'li-session-socratic').map((h) => h.level)
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] !== levels[i - 1] + 1) errors.push(`Hint ladder is not sequential: level ${levels[i - 1]} was followed by ${levels[i]}.`)
  }
  const transferSkipped = requiresTransferBeforeSummary(['diagnose', 'elicit_attempt', 'hint', 'hint', 'summarise'])
  if (transferSkipped.length === 0) errors.push('Expected reaching "summarise" without "transfer" to be flagged, but it was not.')
  const transferPresent = requiresTransferBeforeSummary(['diagnose', 'elicit_attempt', 'hint', 'transfer', 'reflection', 'summarise'])
  if (transferPresent.length > 0) errors.push(`Expected a sequence that includes "transfer" before "summarise" to pass: ${transferPresent.join('; ')}`)
  return errors
}

/** 5. Answer reveal — a complete solution is only ever the ladder's final rung, and the fixture reveal response is consistent with that. */
function validateAnswerReveal(data: LearningDataInput): string[] {
  const errors: string[] = []
  if (canRevealCompleteSolution(6)) errors.push('Level 6 must not be treated as a complete-solution reveal.')
  if (!canRevealCompleteSolution(7)) errors.push('Level 7 must be treated as a complete-solution reveal.')
  const revealResponse = data.tutorResponses.find((r) => r.id === 'li-response-reveal')
  if (!revealResponse || revealResponse.hintLevel !== 7 || !revealResponse.mayRevealFinalAnswer) {
    errors.push('Expected the fixture reveal TutorResponse to be at hint level 7 with mayRevealFinalAnswer true.')
  }
  return errors
}

/** 6-7. Assessment authority and attempts. */
function validateAssessmentAuthorityAndAttempts(data: LearningDataInput): string[] {
  const errors: string[] = []
  data.learningAssessments.forEach((a) => {
    errors.push(...validateTutorGeneratedNonAuthoritative(a.policy).map((e) => `${a.id}: ${e}`))
  })
  data.assessmentAttempts.forEach((attempt) => {
    errors.push(...validateAuthorityNotInferredFromMode(attempt).map((e) => `${attempt.id}: ${e}`))
    const assessment = data.learningAssessments.find((a) => a.id === attempt.assessmentId)
    if (assessment && JSON.stringify(assessment.policy) !== JSON.stringify(attempt.policySnapshot)) {
      errors.push(`AssessmentAttempt "${attempt.id}" policySnapshot does not match its assessment's current policy.`)
    }
  })
  const summative = data.learningAssessments.find((a) => a.id === 'la-assessment-summative')
  if (!summative || !summative.policy.mayProduceInstitutionalGrade) errors.push('Expected the institution-authored summative assessment to be able to produce an institutional grade.')
  const practice = data.learningAssessments.find((a) => a.id === 'la-assessment-practice')
  if (!practice || practice.policy.mayProduceInstitutionalGrade) errors.push('Expected the tutor-generated practice assessment to never produce an institutional grade.')
  return errors
}

/** 8. Answer Key access — the fixture "allowed" log must satisfy its policy; the denied scenario must fail validation. */
function validateAnswerKeyAccessScenarios(data: LearningDataInput): string[] {
  const errors: string[] = []
  const socraticPolicy = data.answerKeyAccessPolicies.find((p) => p.id === 'lak-policy-socratic')
  const allowedLog = data.answerKeyAccessLogs.find((l) => l.id === 'lak-access-allowed')
  if (!socraticPolicy || !allowedLog) {
    errors.push('Missing fixture data for the Answer Key allowed-access scenario.')
  } else {
    const allowedErrors = validateAnswerKeyAccess(allowedLog.reason, socraticPolicy, allowedLog.revealLevel)
    if (allowedErrors.length > 0) errors.push(`Expected the fixture allowed Answer Key access to pass: ${allowedErrors.join('; ')}`)
  }
  if (socraticPolicy) {
    const deniedErrors = validateAnswerKeyAccess(data.deniedAnswerKeyAccessAttempt.reason, socraticPolicy, data.deniedAnswerKeyAccessAttempt.hintLevel)
    if (deniedErrors.length === 0) errors.push('Expected the denied Answer Key access scenario (reveal requested before the ladder is exhausted) to fail, but it passed.')
  }
  return errors
}

/** 9. Observation independence — the legitimate independent-transfer observation must pass; the illegitimate post-reveal claim must be rejected. */
function validateObservationIndependence(data: LearningDataInput): string[] {
  const errors: string[] = []
  const legitimate = data.learningObservations.find((o) => o.id === 'lo-independent-transfer')
  const illegitimate = data.learningObservations.find((o) => o.id === 'lo-illegitimate-independent-claim')
  if (!legitimate || !illegitimate) {
    errors.push('Missing fixture data for the independence-claim scenarios.')
    return errors
  }
  const legitimateErrors = validateIndependenceClaim(legitimate)
  if (legitimateErrors.length > 0) errors.push(`Expected the legitimate independent-transfer observation to pass: ${legitimateErrors.join('; ')}`)
  const illegitimateErrors = validateIndependenceClaim(illegitimate)
  if (illegitimateErrors.length === 0) errors.push('Expected the post-reveal independence claim without a materially different transfer problem to be rejected, but it passed.')
  return errors
}

/** 10. Observation visibility — private never discloses to teacher or institutional aggregate directly; teacher tier can reach evidence review and (de-identified) institutional aggregate. */
function validateObservationVisibility(data: LearningDataInput): string[] {
  const errors: string[] = []
  if (isDisclosureAllowed(data.instructionalDisclosureRules, 'student_private', 'student_and_teacher')) {
    errors.push('student_private must not disclose directly to student_and_teacher without an explicit allowing rule.')
  }
  if (isDisclosureAllowed(data.instructionalDisclosureRules, 'student_private', 'department_university_aggregate')) {
    errors.push('student_private must never disclose directly to department_university_aggregate.')
  }
  if (!isDisclosureAllowed(data.instructionalDisclosureRules, 'student_and_teacher', 'evidence_review')) {
    errors.push('student_and_teacher should be able to disclose into evidence_review under course policy.')
  }
  if (!requiresDeidentification(data.instructionalDisclosureRules, 'student_and_teacher', 'department_university_aggregate')) {
    errors.push('Disclosure into department_university_aggregate must require de-identification.')
  }

  const ineligible = data.learningObservations.find((o) => o.id === data.departmentIneligibleObservationId)
  const policy = ineligible ? data.observationVisibilityPolicies.find((p) => p.observationType === ineligible.observationType) : undefined
  if (!policy || policy.tier !== 'student_private') {
    errors.push(`Expected the Department-ineligible observation ("${data.departmentIneligibleObservationId}") to sit at the student_private tier.`)
  }
  return errors
}

/** 11. Citation resolution — the valid reference passes; the mismatched-version reference and a wholly invented id are rejected. */
function validateCitationResolution(data: LearningDataInput): string[] {
  const errors: string[] = []
  const knownReferenceIds = new Set(data.sourceReferences.map((r) => r.id))
  const documentVersions = new Map(data.learningDocumentVersions.map((v) => [v.id, v]))

  const validRef = data.sourceReferences.find((r) => r.id === 'lsrc-ref-1')
  if (validRef) {
    const validErrors = validateCitation({ reference: validRef, knownReferenceIds, documentVersions, extractionWarnings: data.extractionWarnings, requireResolvedHighSeverityWarnings: true })
    if (validErrors.length > 0) errors.push(`Expected the valid citation to pass: ${validErrors.join('; ')}`)
  } else {
    errors.push('Missing the valid citation fixture "lsrc-ref-1".')
  }

  const mismatchedRef = data.sourceReferences.find((r) => r.id === 'lsrc-ref-mismatched-version')
  if (mismatchedRef) {
    const mismatchErrors = validateCitation({ reference: mismatchedRef, knownReferenceIds, documentVersions, extractionWarnings: data.extractionWarnings, requireResolvedHighSeverityWarnings: true })
    if (mismatchErrors.length === 0) errors.push('Expected the mismatched-document-version citation to be rejected, but it passed.')
  } else {
    errors.push('Missing the mismatched-version citation fixture "lsrc-ref-mismatched-version".')
  }

  const invented = validateModelClaimedCitation('lsrc-ref-does-not-exist', knownReferenceIds)
  if (invented.length === 0) errors.push('Expected a model-claimed citation id that does not exist to be rejected, but it passed.')

  return errors
}

/** 12-13-14. Visual request validity, deterministic renderer selection, and the unbound-generative-provider fallback. */
function validateVisualDomain(data: LearningDataInput): string[] {
  const errors: string[] = []
  data.learningVisualRequests.forEach((request) => {
    const result = validateVisualRequest(request)
    if (!result.valid) errors.push(`Expected LearningVisualRequest "${request.id}" to be well-formed: ${result.reasons.join('; ')}`)
  })

  const resolved = findDeterministicVisual(data.deterministicVisualDefinitions, 'lc-concept-1', 'chemical_equation_balancing')
  if (!resolved) errors.push('Expected a deterministic chemical_equation_balancing visual to resolve for lc-concept-1.')

  const unbound = data.learningVisualRequests.find((r) => r.id === 'lv-request-generated-unbound')
  if (unbound) {
    const fallback = resolveVisualFallback(unbound)
    if (fallback.failureState !== 'provider_unavailable') errors.push('Expected the generated-illustration request with no bound provider to fall back with failureState "provider_unavailable".')
    const record = data.learningVisualRecords.find((r) => r.visualRequestId === unbound.id)
    if (!record || !record.fallbackUsed || record.failureState !== 'provider_unavailable') {
      errors.push('Expected the unbound-provider visual record to have fallbackUsed=true and failureState="provider_unavailable".')
    }
  }

  return errors
}

/** 15. Learning Evidence eligibility — independent + explicitly-submitted + policy-permitted is eligible; tutor_generated practice is never eligible regardless of independence. */
function validateLearningEvidenceEligibility(data: LearningDataInput): string[] {
  const errors: string[] = []

  const formativeEligible = isEligibleForEvidenceCandidate(data.learningAssessments.find((a) => a.id === 'la-assessment-formative')!.policy, 'independent', true)
  if (!formativeEligible) errors.push('Expected an independent, explicitly-submitted formative attempt to be Evidence-candidate eligible.')

  const practiceEligible = isEligibleForEvidenceCandidate(data.learningAssessments.find((a) => a.id === 'la-assessment-practice')!.policy, 'independent', true)
  if (practiceEligible) errors.push('Expected a tutor_generated practice assessment to never be Evidence-candidate eligible, regardless of independence.')

  // Guided/misconception observations must never have become an EvidenceCandidate.
  data.observationsExcludedFromPassportProjection.forEach((observationId) => {
    const candidate = data.learningEvidenceCandidates.find((c) => c.learningOriginId === observationId)
    if (candidate) errors.push(`Observation "${observationId}" unexpectedly has an EvidenceCandidate ("${candidate.id}") — guided/misconception observations must never enter the Passport pipeline.`)
  })

  return errors
}

/** 16. Passport privacy boundary — only the explicitly-permitted candidate is visible to the Passport audience; raw transcripts/misconceptions never get a permission at all. */
function validatePassportPrivacyBoundary(data: LearningDataInput): string[] {
  const errors: string[] = []
  const eligibleCandidateId = 'lp-candidate-independent-transfer'
  if (!isVisibleToAudience(data.learningDisclosurePermissions, eligibleCandidateId, 'passport')) {
    errors.push(`Expected "${eligibleCandidateId}" to be visible to the passport audience via an explicit DisclosurePermission.`)
  }
  // No disclosure permission of any kind should exist for a raw observation id or misconception id — they are not even the right record type to receive one.
  data.observationsExcludedFromPassportProjection.forEach((id) => {
    const anyPermission = data.learningDisclosurePermissions.find((p) => p.recordId === id)
    if (anyPermission) errors.push(`Found a DisclosurePermission referencing raw record "${id}" — private process data must never reach a disclosure decision at all.`)
  })
  return errors
}

/** Aggregates every Learning Stage A validator. Empty return means the dataset is internally consistent. */
export function validateLearningData(data: LearningDataInput): string[] {
  return [
    ...validateDomainIntegrity(data),
    ...validateTutorTransitions(),
    ...validateTutorModePolicy(),
    ...validateHintProgression(data),
    ...validateAnswerReveal(data),
    ...validateAssessmentAuthorityAndAttempts(data),
    ...validateAnswerKeyAccessScenarios(data),
    ...validateObservationIndependence(data),
    ...validateObservationVisibility(data),
    ...validateCitationResolution(data),
    ...validateVisualDomain(data),
    ...validateLearningEvidenceEligibility(data),
    ...validatePassportPrivacyBoundary(data),
  ]
}
