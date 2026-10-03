import type { CampusUser, OdysseyContext, CapabilityMaturity } from '@/lib/campus-types'
import { mockCapabilityRepository } from '@/lib/repositories/capability-repository'
import { mockEvidenceRepository } from '@/lib/repositories/evidence-repository'
import { mockOdysseyRepository } from '@/lib/repositories/odyssey-repository'
import { mockPassportRepository } from '@/lib/repositories/passport-repository'
import { mockInstitutionRepository } from '@/lib/repositories/institution-repository'
import { getActiveMilestone } from '@/lib/utilities/odyssey'

const MATURITY_RANK: Record<CapabilityMaturity, number> = {
  Exposed: 0,
  Emerging: 1,
  Developing: 2,
  Proficient: 3,
  Advanced: 4,
  Expert: 5,
  Stale: 3,
  Revoked: -1,
}

/**
 * Builds the typed, minimal Odyssey context from existing repositories only.
 * Deliberately excludes anything from the retired workforce/ministry surface,
 * raw reviewer notes, and unnecessary PII. Kept separate from prompt
 * construction (lib/services/odyssey/deepseek-provider.ts) so the context
 * itself stays reviewable without exposing how it gets phrased to the model.
 */
export async function buildOdysseyContext(user: CampusUser): Promise<OdysseyContext> {
  const studentId = user.id

  const [definitions, claims, evidence, planVersion, resources, constraints, passport, programme] = await Promise.all([
    mockCapabilityRepository.listDefinitions(),
    mockCapabilityRepository.listClaimsForSubject(studentId),
    mockEvidenceRepository.listForStudent(studentId),
    mockOdysseyRepository.getCurrentPlanVersion(studentId),
    mockOdysseyRepository.listInstitutionalResources(studentId),
    mockOdysseyRepository.listConstraints(studentId),
    mockPassportRepository.getForStudent(studentId),
    user.programmeId ? mockInstitutionRepository.getProgramme(user.programmeId) : Promise.resolve(undefined),
  ])

  const department = programme ? await mockInstitutionRepository.getDepartment(programme.departmentId) : undefined
  const courses = programme ? await mockInstitutionRepository.listCourses(programme.id) : []
  const claimByCapabilityId = new Map(claims.map((c) => [c.capabilityId, c]))

  const capabilities = definitions.map((definition) => {
    const claim = claimByCapabilityId.get(definition.id)
    return {
      capabilityId: definition.id,
      name: definition.name,
      domain: definition.domain,
      maturity: claim?.maturity ?? ('Exposed' as CapabilityMaturity),
      confidence: claim?.confidence.band ?? ('Unsupported' as const),
      evidenceCount: claim?.evidenceCount ?? 0,
    }
  })

  const gapCapabilityIds = new Set(
    capabilities.filter((c) => MATURITY_RANK[c.maturity] < MATURITY_RANK.Proficient).map((c) => c.capabilityId)
  )
  const rankedResources = [...resources].sort((a, b) => {
    const aScore = a.relatedCapabilityIds.filter((id) => gapCapabilityIds.has(id)).length
    const bScore = b.relatedCapabilityIds.filter((id) => gapCapabilityIds.has(id)).length
    return bScore - aScore
  })

  const recentEvidence = [...evidence]
    .sort((a, b) => (a.record.submittedAt < b.record.submittedAt ? 1 : -1))
    .slice(0, 10)
    .map((e) => ({
      evidenceId: e.record.id,
      title: e.record.title,
      sourceType: e.record.sourceType,
      reviewStatus: e.review.status,
      capabilityIds: e.record.capabilityIds,
    }))

  const completedCourseIds = new Set(
    courses.filter((course) => course.capabilityIds.every((id) => (claimByCapabilityId.get(id)?.evidenceCount ?? 0) > 0)).map((c) => c.id)
  )

  const latestPassportVersion = passport?.versions.find((v) => v.version === passport.currentVersion)
  const activeMilestone = planVersion ? getActiveMilestone(await mockOdysseyRepository.getMilestonesForVersion(studentId, planVersion.id)) : undefined

  return {
    studentId,
    programmeName: programme?.name ?? 'Unspecified programme',
    departmentName: department?.name,
    currentStage: activeMilestone ? `Working toward: ${activeMilestone.title}` : 'No active Odyssey plan yet',
    completedModuleTitles: courses.filter((c) => completedCourseIds.has(c.id)).map((c) => `${c.code} ${c.title}`),
    currentModuleTitles: courses.filter((c) => !completedCourseIds.has(c.id)).map((c) => `${c.code} ${c.title}`),
    intentSummary: planVersion?.reasoningSummary ?? 'No declared intent on record yet.',
    capabilities,
    recentEvidence,
    unresolvedEvidenceReviewCount: evidence.filter((e) => e.review.status === 'pending').length,
    availableResources: rankedResources,
    constraints,
    passportReadiness: {
      shareableClaimCount: latestPassportVersion?.claims.length ?? 0,
      staleCapabilityNames: latestPassportVersion?.claims.filter((c) => c.maturity === 'Stale').map((c) => c.capabilityName) ?? [],
      revokedCapabilityNames: latestPassportVersion?.claims.filter((c) => c.maturity === 'Revoked').map((c) => c.capabilityName) ?? [],
      withheldCapabilityNames: latestPassportVersion?.withheld.map((w) => w.capabilityName) ?? [],
    },
    currentPlan: planVersion
      ? {
          destinationTitle: planVersion.title,
          milestoneTitles: (await mockOdysseyRepository.getMilestonesForVersion(studentId, planVersion.id)).map((m) => m.title),
        }
      : undefined,
  }
}
