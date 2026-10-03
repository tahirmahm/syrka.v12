import type { PassportVersion, DisclosureSettings, ExternalPassportView, Institution, Programme, EvidenceRecord, Course } from '@/lib/campus-types'

export interface ExternalPassportViewInput {
  version: PassportVersion
  settings: DisclosureSettings
  institution: Institution
  programme?: Programme
  studentName: string
  evidenceById: Map<string, EvidenceRecord>
  courseById: Map<string, Course>
}

/**
 * Pure computation of what an external viewer would see under the given
 * disclosure settings — never stored, always derived fresh from the
 * student's own Passport data plus their current (mock) preferences.
 */
export function buildExternalPassportView({
  version,
  settings,
  institution,
  programme,
  studentName,
  evidenceById,
  courseById,
}: ExternalPassportViewInput): ExternalPassportView {
  const claims = version.claims
    .filter((claim) => !(settings.excludeStaleClaims && claim.verificationState === 'stale'))
    .filter((claim) => !(settings.excludeRevokedClaims && claim.verificationState === 'revoked'))
    .map((claim) => {
      const firstEvidence = claim.evidenceIds.map((id) => evidenceById.get(id)).find((e) => e)
      const course = firstEvidence?.courseId ? courseById.get(firstEvidence.courseId) : undefined
      return {
        capabilityName: claim.capabilityName,
        capabilityDomain: claim.capabilityDomain,
        maturity: claim.maturity,
        confidence: claim.confidence,
        verificationState: claim.verificationState,
        evidenceCount: claim.evidenceIds.length,
        courseContext: settings.includeCourseContext && course ? `${course.code} ${course.title}` : undefined,
        reviewerContext: settings.includeReviewerInfo ? claim.issuingContext : undefined,
      }
    })

  return {
    studentName: settings.includeIdentity ? studentName : undefined,
    institutionName: institution.name,
    programmeName: programme?.name,
    version: version.version,
    issuedAt: version.issuedAt,
    claims,
    audience: settings.audience,
  }
}
