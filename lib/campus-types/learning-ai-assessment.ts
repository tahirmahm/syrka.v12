/**
 * Syrka Learning — AI-aware assessment (IAU-001 §9). The institutional
 * question is never "did the student use AI" but "how did they use it,
 * what remained their own, what did they verify, and can they defend and
 * transfer the result independently." No field here computes an "AI
 * usage score" — every judgement is a Faculty decision, not an automatic
 * penalty or automatic pass.
 */

export interface AIUseDisclosure {
  id: string
  studentId: string
  conceptId: string
  /** Kept generic and student-declared — never a specific third-party product name required. */
  toolOrTutorUsed: string
  declaredPurpose: string
  /** Task categories only (e.g. "drafting", "fact-checking") — never raw prompts or full conversation text retained. */
  taskCategories: string[]
  disclosedAt: string
}

export interface ModelOutputClaim {
  id: string
  disclosureId: string
  claimText: string
  accepted: boolean
  changed: boolean
}

export interface StudentVerificationAction {
  id: string
  disclosureId: string
  description: string
  sourceReferenceId?: string
  performedAt: string
}

export interface DetectedModelError {
  id: string
  disclosureId: string
  description: string
  howDetected: string
}

/** The student's own explanation, in their own words, of why the final claim holds — never the model's own text. */
export interface IndependentDefence {
  id: string
  disclosureId: string
  explanation: string
  recordedAt: string
}

export interface AssessmentTransferResult {
  id: string
  disclosureId: string
  transferPrompt: string
  succeededWithoutAssistance: boolean
}

/**
 * Set only after Faculty review — never computed automatically. The
 * brief's own distinction: copied output has no verification/defence
 * trail; orchestrated use does.
 */
export type AIAwareAssessmentJudgement = 'independent_orchestration' | 'copied_output' | 'insufficient_evidence'

export interface AssessmentAssistanceRecord {
  id: string
  studentId: string
  conceptId: string
  disclosureId: string
  modelOutputClaimIds: string[]
  verificationActionIds: string[]
  detectedErrorIds: string[]
  independentDefenceId?: string
  transferResultId?: string
  facultyReviewed: boolean
  judgement?: AIAwareAssessmentJudgement
  facultyNote?: string
  recordedAt: string
}

export interface AIAwareAssessmentRubric {
  id: string
  chapterId: string
  conceptId: string
  criteria: { label: string; description: string }[]
}
