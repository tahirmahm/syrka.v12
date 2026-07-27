/**
 * Deterministic security validators for the Learning production-safety
 * hotfix. The synchronous checks (gate defaults, actor resolution,
 * repository-safety invariant, route-guard coverage, mock-identity
 * absence) run unconditionally at import time and throw on any error,
 * mirroring the existing validate-*.ts pattern. The cross-institution
 * isolation check is async (it exercises the real in-memory repository)
 * and is exported separately — verified via a temporary route hit during
 * development rather than wired into module-load-time execution, so a
 * repository call can never turn a plain `import` into an unhandled
 * promise rejection that takes down the whole server. No external
 * network calls; no test framework added.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { resolveAuthoringGate } from '@/lib/services/learning/authoring-gate'
import { deriveActorResolution } from '@/lib/services/learning/actor'
import { assertRepositoryConfigurationSafe } from '@/lib/services/learning/repository-safety'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

const LEARNING_API_ROOT = join(process.cwd(), 'app', 'api', 'learning')
const LEARNING_PAGES_ROOT = join(process.cwd(), 'app', 'faculty', 'learning-spaces')

/** 1. Production defaults to disabled; only the exact string "true" enables it; malformed values fail closed. */
function validateAuthoringGateDefaults(): string[] {
  const errors: string[] = []

  if (resolveAuthoringGate({ NODE_ENV: 'production' }) !== false) errors.push('Expected production with no LEARNING_AUTHORING_ENABLED to default to disabled')
  if (resolveAuthoringGate({ NODE_ENV: 'production', LEARNING_AUTHORING_ENABLED: 'true' }) !== true) errors.push('Expected production with LEARNING_AUTHORING_ENABLED="true" to be enabled')
  if (resolveAuthoringGate({ NODE_ENV: 'production', LEARNING_AUTHORING_ENABLED: 'TRUE' }) !== false) errors.push('Expected production with a malformed value ("TRUE") to fail closed')
  if (resolveAuthoringGate({ NODE_ENV: 'production', LEARNING_AUTHORING_ENABLED: '1' }) !== false) errors.push('Expected production with a malformed value ("1") to fail closed')
  if (resolveAuthoringGate({ NODE_ENV: 'production', LEARNING_AUTHORING_ENABLED: '' }) !== false) errors.push('Expected production with an empty value to fail closed')
  if (resolveAuthoringGate({ NODE_ENV: 'production', LEARNING_AUTHORING_ENABLED: ' true' }) !== false) errors.push('Expected production with a whitespace-padded value to fail closed')

  if (resolveAuthoringGate({ NODE_ENV: 'development' }) !== true) errors.push('Expected development with no override to default to enabled')
  if (resolveAuthoringGate({ NODE_ENV: 'development', LEARNING_AUTHORING_ENABLED: 'false' }) !== false) errors.push('Expected development with an explicit non-"true" override to be disabled')

  return errors
}

/** 2/3. Unauthenticated and wrong-role requests are rejected; missing institution membership is rejected. */
function validateActorResolutionScenarios(): string[] {
  const errors: string[] = []

  const unauthenticated = deriveActorResolution(null, null)
  if (unauthenticated.ok || unauthenticated.status !== 401 || unauthenticated.reason !== 'unauthenticated') {
    errors.push('Expected no session to resolve to 401 "unauthenticated"')
  }

  const noMembership = deriveActorResolution({ id: 'user-1' }, null)
  if (noMembership.ok || noMembership.status !== 403 || noMembership.reason !== 'role_unresolvable') {
    errors.push('Expected an authenticated user with no membership record to resolve to 403 "role_unresolvable"')
  }

  const wrongRole = deriveActorResolution({ id: 'user-1' }, { institutionId: 'inst-1', role: 'student' })
  if (wrongRole.ok || wrongRole.status !== 403 || wrongRole.reason !== 'wrong_role') {
    errors.push('Expected a non-Faculty/learning_admin role to resolve to 403 "wrong_role"')
  }

  const missingInstitution = deriveActorResolution({ id: 'user-1' }, { institutionId: null, role: 'faculty' })
  if (missingInstitution.ok || missingInstitution.status !== 403 || missingInstitution.reason !== 'missing_institution') {
    errors.push('Expected a Faculty role with no institution membership to resolve to 403 "missing_institution"')
  }

  const valid = deriveActorResolution({ id: 'user-1' }, { institutionId: 'inst-1', role: 'faculty' })
  if (!valid.ok || valid.actor.userId !== 'user-1' || valid.actor.institutionId !== 'inst-1' || valid.actor.role !== 'faculty') {
    errors.push('Expected a valid Faculty membership to resolve to an authorized actor with the session-derived identity')
  }

  const learningAdmin = deriveActorResolution({ id: 'user-2' }, { institutionId: 'inst-2', role: 'learning_admin' })
  if (!learningAdmin.ok) errors.push('Expected learning_admin to be an accepted role')

  return errors
}

/** 4. Production must never run with the in-memory repository if Learning authoring is enabled. */
function validateRepositorySafetyInvariant(): string[] {
  const errors: string[] = []
  if (assertRepositoryConfigurationSafe(true, true).length === 0) errors.push('Expected production + authoring-enabled + in-memory repository to be flagged unsafe')
  if (assertRepositoryConfigurationSafe(true, false).length !== 0) errors.push('Expected production + authoring-disabled to be safe (the repository module never loads request traffic)')
  if (assertRepositoryConfigurationSafe(false, true).length !== 0) errors.push('Expected non-production + authoring-enabled to be safe (development is allowed to use the in-memory repository)')
  return errors
}

/** 5. Every Learning route uses the common guard; no mock identity or mock repository is referenced anywhere in Learning routes/pages. */
function listRouteFiles(root: string): string[] {
  const files: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return files
  }
  for (const entry of entries) {
    const fullPath = join(root, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...listRouteFiles(fullPath))
    } else if (entry === 'route.ts' || entry === 'page.tsx') {
      files.push(fullPath)
    }
  }
  return files
}

function validateRouteGuardCoverageAndMockAbsence(): string[] {
  const errors: string[] = []
  const routeFiles = listRouteFiles(LEARNING_API_ROOT)
  const pageFiles = listRouteFiles(LEARNING_PAGES_ROOT)

  if (routeFiles.length === 0) errors.push('Expected to find route.ts files under app/api/learning — the file walk found none, which would make every other check in this validator vacuously pass')

  for (const file of routeFiles) {
    const source = readFileSync(file, 'utf8')
    if (!source.includes('guardLearningRequest')) {
      errors.push(`${file} does not call guardLearningRequest() — every /api/learning/** route must use the common guard`)
    }
    if (source.includes('facultyUser')) {
      errors.push(`${file} references facultyUser — no Learning route may use mock/seed identity for authorization`)
    }
    if (source.includes('mockLearningIngestionRepository')) {
      errors.push(`${file} references the retired mockLearningIngestionRepository export — it has been renamed to inMemoryLearningIngestionRepository`)
    }
  }

  for (const file of pageFiles) {
    const source = readFileSync(file, 'utf8')
    if (source.includes('facultyUser')) {
      errors.push(`${file} references facultyUser — no Learning Faculty page may use mock/seed identity for authorization`)
    }
    if (!source.includes('isLearningAuthoringEnabled') && file.endsWith('page.tsx')) {
      errors.push(`${file} does not check isLearningAuthoringEnabled() — every Faculty Learning page must fail closed when authoring is disabled`)
    }
  }

  return errors
}

export function validateLearningSecuritySync(): string[] {
  const errors = [...validateAuthoringGateDefaults(), ...validateActorResolutionScenarios(), ...validateRepositorySafetyInvariant()]

  // The route-guard/mock-absence check walks the source tree via fs — safe and valuable in
  // development and at build time (where app/api/learning/**/*.ts always exists on disk), but
  // never run in a deployed production runtime, where the source layout is not guaranteed and a
  // filesystem difference must never be able to crash a live request.
  if (process.env.NODE_ENV !== 'production') {
    errors.push(...validateRouteGuardCoverageAndMockAbsence())
  }

  return errors
}

/**
 * Cross-institution isolation — a record created for one institution
 * must not resolve, list, or mutate under another. Exercises the real
 * inMemoryLearningIngestionRepository (not a mock). Async because the
 * repository interface is async; verify via a temporary route during
 * development rather than auto-running at import time (see file header).
 */
export async function validateLearningSecurityAsync(): Promise<string[]> {
  const errors: string[] = []
  const institutionA = `sec-test-inst-a-${Date.now()}`
  const institutionB = `sec-test-inst-b-${Date.now()}`

  const space = await inMemoryLearningIngestionRepository.createLearningSpace(institutionA, 'user-a', 'Cross-institution isolation test', 'curriculum-1', 'nonexistent-version')

  const foundInOwnInstitution = await inMemoryLearningIngestionRepository.getLearningSpace(institutionA, space.id)
  if (!foundInOwnInstitution) errors.push('Expected a Learning Space to be readable within its own institution')

  const foundInOtherInstitution = await inMemoryLearningIngestionRepository.getLearningSpace(institutionB, space.id)
  if (foundInOtherInstitution) errors.push('Expected a Learning Space created under one institution to be unreachable (undefined, mapped to 404) from a different institution')

  const listedInOtherInstitution = await inMemoryLearningIngestionRepository.listLearningSpaces(institutionB)
  if (listedInOtherInstitution.some((s) => s.id === space.id)) errors.push("Expected listLearningSpaces to never leak another institution's Learning Space")

  const correction = await inMemoryLearningIngestionRepository.addCorrection(institutionA, {
    id: `sec-test-correction-${Date.now()}`,
    targetType: 'paragraph',
    targetId: 'page-1',
    documentVersionId: 'version-1',
    pageId: 'page-1',
    teacherId: 'user-a',
    originalValue: 'original',
    correctedValue: 'corrected',
    reason: 'security test',
    changeSummary: 'security test',
  })
  const crossInstitutionAccept = await inMemoryLearningIngestionRepository.acceptCorrection(institutionB, correction.id)
  if (crossInstitutionAccept) errors.push('Expected accepting a correction under a different institution to fail (undefined), not silently succeed')

  const crossInstitutionApproval = await inMemoryLearningIngestionRepository.approveLearningSpace(institutionB, space.id, 'user-b', 'attempted cross-institution approval')
  if (crossInstitutionApproval.ok) errors.push('Expected approving a Learning Space under a different institution to fail, not silently succeed')

  return errors
}

const syncErrors = validateLearningSecuritySync()
if (syncErrors.length > 0) {
  throw new Error(`Learning security validation failed:\n${syncErrors.join('\n')}`)
}
