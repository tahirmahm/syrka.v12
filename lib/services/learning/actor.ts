import { createServerSupabase } from '@/lib/supabase/server'

/**
 * The identity every /api/learning/** route authorizes against. Derived
 * only from the authenticated session — never from a client-supplied
 * body/header field, and never from lib/mock-data/seed.ts's facultyUser
 * or any other mock/seed identity.
 */
export type LearningActorRole = 'faculty' | 'learning_admin'

export interface LearningActor {
  userId: string
  institutionId: string
  role: LearningActorRole
}

export type ActorResolutionFailureReason = 'unauthenticated' | 'role_unresolvable' | 'wrong_role' | 'missing_institution'

export type ActorResolution = { ok: true; actor: LearningActor } | { ok: false; status: 401 | 403; reason: ActorResolutionFailureReason }

/**
 * Looks up the caller's institution membership and Faculty/learning_admin
 * role. THIS IS CURRENTLY A STUB: the real `user_profiles` table
 * (supabase/migrations/005_auth_user_profiles.sql) has no `role` or
 * `institution_id` column, and no Faculty-membership table exists yet
 * anywhere in this project's schema — confirmed by reading every
 * migration under supabase/migrations/. Selecting non-existent columns
 * would 400 at the database, so this function deliberately does not
 * guess at a schema that isn't there.
 *
 * Until the Learning Persistence and Tenancy Architecture Checkpoint's
 * migration plan adds a real membership table, this always returns null
 * — every authenticated request still fails closed with 403
 * "role_unresolvable" rather than fabricating a role or institution from
 * user metadata, a header, or a request field.
 */
export interface RawMembership {
  institutionId: string | null
  /** Deliberately untyped/wider than LearningActorRole — a real membership row can carry any institutional role (student, department_administrator, ...), and narrowing to Faculty/learning_admin is deriveActorResolution's job, not this lookup's. */
  role: string | null
}

async function lookupFacultyMembership(userId: string): Promise<RawMembership | null> {
  void userId // kept in the signature for the real lookup this stub will be replaced with
  return null
}

/**
 * The pure decision logic, factored out from resolveLearningActor so it
 * can be exercised directly with literal inputs — no Supabase session or
 * request scope required. resolveLearningActor is a thin, otherwise-
 * untestable wrapper around this plus the two real lookups above.
 */
export function deriveActorResolution(user: { id: string } | null, membership: RawMembership | null): ActorResolution {
  if (!user) {
    return { ok: false, status: 401, reason: 'unauthenticated' }
  }

  if (!membership || !membership.role) {
    return { ok: false, status: 403, reason: 'role_unresolvable' }
  }

  if (membership.role !== 'faculty' && membership.role !== 'learning_admin') {
    return { ok: false, status: 403, reason: 'wrong_role' }
  }

  if (!membership.institutionId) {
    return { ok: false, status: 403, reason: 'missing_institution' }
  }

  return { ok: true, actor: { userId: user.id, institutionId: membership.institutionId, role: membership.role } }
}

/**
 * Resolves the acting Faculty/learning_admin identity from the real
 * Supabase session cookie — the only identity source any Learning route
 * may use. Session-layer failures (missing Supabase configuration, a
 * transient client error) must fail closed the same as "no session" —
 * they must never surface as an unhandled 500 that could read as a
 * server bug distinct from "not authorized", and they must never fall
 * back to any other identity source.
 */
export async function resolveLearningActor(): Promise<ActorResolution> {
  let user: { id: string } | null
  try {
    const supabase = createServerSupabase()
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    return { ok: false, status: 401, reason: 'unauthenticated' }
  }

  const membership = user ? await lookupFacultyMembership(user.id) : null
  return deriveActorResolution(user, membership)
}
