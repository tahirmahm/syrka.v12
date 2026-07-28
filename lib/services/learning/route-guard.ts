import { NextResponse } from 'next/server'
import { isLearningAuthoringEnabled } from './authoring-gate'
import { resolveLearningActor, type LearningActor } from './actor'
// Side-effect import: runs the security validators unconditionally wherever this guard is loaded — see validate-learning-security.ts.
import '@/lib/validation/validate-learning-security'
// Side-effect import: proves Mermaid and generic node-edge graphs are absent from the runtime — see validate-no-mermaid.ts.
import '@/lib/validation/validate-no-mermaid'

export type LearningGuardResult = { ok: true; actor: LearningActor } | { ok: false; response: NextResponse }

const FEATURE_DISABLED_RESPONSE = () => NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 })

const REASON_MESSAGES: Record<string, string> = {
  unauthenticated: 'Authentication is required.',
  role_unresolvable: 'Your account is not recognised as a Learning author.',
  wrong_role: 'Your account does not have Faculty or Learning Administrator access.',
  missing_institution: 'Your account has no institution membership on record.',
}

/**
 * The single guard every /api/learning/documents/** and
 * /api/learning/spaces/** route calls first, before touching the
 * request body or the repository. Order matters: the feature gate is
 * checked before authentication so a disabled route never leaks whether
 * a request would otherwise have been authorized, and actor resolution
 * happens before anything reads the request body so an unauthenticated
 * upload is rejected before the full file is read.
 */
export async function guardLearningRequest(): Promise<LearningGuardResult> {
  if (!isLearningAuthoringEnabled()) {
    return { ok: false, response: FEATURE_DISABLED_RESPONSE() }
  }

  const resolution = await resolveLearningActor()
  if (!resolution.ok) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: REASON_MESSAGES[resolution.reason] ?? 'Not authorized.' }, { status: resolution.status }),
    }
  }

  return { ok: true, actor: resolution.actor }
}
