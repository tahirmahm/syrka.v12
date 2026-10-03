import type { AssessmentPolicy, AssessmentAuthority, TutorMode, IndependenceLevel } from '@/lib/campus-types'

/**
 * Tutor mode and assessment authority are separate axes. Selecting Exam
 * mode never itself creates a summative assessment or an institutional
 * grade; only an explicit, governed AssessmentPolicy can. These are pure
 * checks over policy objects — no mode-to-authority derivation lives
 * anywhere in this codebase for these functions to accidentally bypass.
 */

const GOVERNED_AUTHORITIES: AssessmentAuthority[] = ['institution_authored', 'governed_external']

/** Only a governed authority, with the flag explicitly set, may produce an institutional grade. */
export function canProduceInstitutionalGrade(policy: AssessmentPolicy): boolean {
  return policy.mayProduceInstitutionalGrade && GOVERNED_AUTHORITIES.includes(policy.authority)
}

/** A Tutor-generated question/assessment must never claim to produce an institutional grade — non-authoritative by default. */
export function validateTutorGeneratedNonAuthoritative(policy: AssessmentPolicy): string[] {
  const errors: string[] = []
  if (policy.authority === 'tutor_generated' && policy.mayProduceInstitutionalGrade) {
    errors.push('A tutor_generated assessment policy must never set mayProduceInstitutionalGrade — Tutor-generated questions are non-authoritative by default.')
  }
  return errors
}

/** Evidence candidacy depends on policy permission, a genuinely independent attempt, and an explicit submission — never on mode or activity alone. */
export function isEligibleForEvidenceCandidate(policy: AssessmentPolicy, independenceLevel: IndependenceLevel, explicitlySubmitted: boolean): boolean {
  return policy.mayProduceEvidenceCandidate && independenceLevel === 'independent' && explicitlySubmitted
}

/** Institutional authority must never be inferred from which Tutor mode the UI happened to be in. */
export function validateAuthorityNotInferredFromMode(attempt: { tutorMode: TutorMode; policySnapshot: AssessmentPolicy }): string[] {
  const errors: string[] = []
  if (attempt.tutorMode === 'exam' && attempt.policySnapshot.authority === 'tutor_generated' && attempt.policySnapshot.mayProduceInstitutionalGrade) {
    errors.push('Exam-mode UI selection cannot itself imply institutional authority — a tutor_generated policy must not grant an institutional grade regardless of mode.')
  }
  return errors
}
