import type { AnswerKeyAccessReason, AnswerKeyAccessPolicy } from '@/lib/campus-types'

/**
 * The structural guarantee behind the Answer Key Vault: the Tutor cannot
 * accidentally retrieve a full answer mid-diagnosis, because access is
 * validated against an explicit policy every time, not because callers
 * are trusted to behave.
 */
export function validateAnswerKeyAccess(reason: AnswerKeyAccessReason, policy: AnswerKeyAccessPolicy, hintLevel: number): string[] {
  const errors: string[] = []
  if (!policy.allowedReasons.includes(reason)) {
    errors.push(`Answer Key access reason "${reason}" is not permitted under this policy (mode: ${policy.tutorMode}).`)
  }
  if (reason === 'permitted_reveal' && hintLevel < policy.minimumHintLevelForReveal) {
    errors.push(`Answer Key reveal requires hint level >= ${policy.minimumHintLevelForReveal}, got ${hintLevel}.`)
  }
  return errors
}
