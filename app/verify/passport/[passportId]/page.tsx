import { CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockPassportRepository, mockInstitutionRepository, mockEvidenceRepository } from '@/lib/repositories'
import { buildExternalPassportView } from '@/lib/utilities/external-passport-view'
import { CLAIM_VERIFICATION_LABELS, CLAIM_VERIFICATION_TONES, PASSPORT_DISPLAY_NAME } from '@/lib/constants/passport'
import { formatDate } from '@/lib/utilities/format-relative-time'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: `Verify a ${PASSPORT_DISPLAY_NAME}` }

/**
 * The public destination the Passport's QR and share links actually point
 * to — disclosure-filtered, no sign-in, no private Evidence. Reuses the
 * same buildExternalPassportView() the in-app disclosure preview uses, so
 * what a verifier sees here is exactly what the student's own preview
 * already showed them, never a separate code path that could drift.
 */
export default async function VerifyPassportPage({ params }: { params: { passportId: string } }) {
  const passport = await mockPassportRepository.getById(params.passportId)

  if (!passport) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title="This link could not be verified" description="No Career Passport matches this address. It may have been mistyped, or the credential may no longer be issued at this address." />
      </div>
    )
  }

  const [institution, disclosureSettings, evidence] = await Promise.all([
    mockInstitutionRepository.getInstitution(passport.institutionId),
    mockPassportRepository.getDisclosureSettings(passport.studentId),
    mockEvidenceRepository.listForStudent(passport.studentId),
  ])
  const programme = passport.programmeId ? await mockInstitutionRepository.getProgramme(passport.programmeId) : undefined
  const currentVersion = passport.versions.find((v) => v.version === passport.currentVersion)

  if (!institution || !currentVersion) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title="This link could not be verified" description="This credential has no resolvable current version." />
      </div>
    )
  }

  const evidenceById = new Map(evidence.map((e) => [e.record.id, e.record]))
  const view = buildExternalPassportView({
    version: currentVersion,
    settings: disclosureSettings,
    institution,
    programme,
    studentName: currentUser.name,
    evidenceById,
    courseById: new Map(),
  })

  const revokedCount = currentVersion.claimsRevokedCapabilityIds.length

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <CheckCircle size={20} weight="fill" className="text-campus-green-600 dark:text-campus-green-dark" aria-hidden="true" />
          <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">Institutionally reviewed</p>
        </div>
        <h1 className="mt-2 font-campus-sans text-campus-2xl font-semibold tracking-tight text-campus-text">{view.studentName ?? 'Name withheld by holder'}</h1>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-muted">
          {view.programmeName ? `${view.programmeName} · ` : ''}
          {view.institutionName}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5 sm:grid-cols-4">
        <div>
          <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Passport ID</dt>
          <dd className="mt-0.5 font-campus-mono text-campus-xs text-campus-text">{passport.id}</dd>
        </div>
        <div>
          <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Version</dt>
          <dd className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{passport.currentVersion}</dd>
        </div>
        <div>
          <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Issued</dt>
          <dd className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{formatDate(currentVersion.issuedAt)}</dd>
        </div>
        <div>
          <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Issuer</dt>
          <dd className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{passport.verificationSeal.issuer}</dd>
        </div>
      </dl>

      <section aria-labelledby="claims-heading">
        <h2 id="claims-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Disclosed capability claims
        </h2>
        {view.claims.length === 0 ? (
          <p className="font-campus-sans text-campus-sm text-campus-muted">No claims are disclosed at this address under the holder&rsquo;s current sharing settings.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {view.claims.map((claim) => (
              <div key={claim.capabilityName} className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{claim.capabilityName}</p>
                    <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{claim.capabilityDomain}</p>
                  </div>
                  <Badge tone={CLAIM_VERIFICATION_TONES[claim.verificationState]}>{CLAIM_VERIFICATION_LABELS[claim.verificationState]}</Badge>
                </div>
                <div className="mt-3">
                  <ConfidenceMeter confidence={claim.confidence} />
                </div>
                <p className="mt-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                  {claim.maturity} · {claim.evidenceCount} supporting evidence{claim.courseContext ? ` · ${claim.courseContext}` : ''}
                </p>
                {claim.reviewerContext && <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{claim.reviewerContext}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {revokedCount > 0 && (
        <p className="font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">
          {revokedCount} previously issued {revokedCount === 1 ? 'claim has' : 'claims have'} since been revoked and is not shown above.
        </p>
      )}

      <p className="border-t border-campus-border pt-4 font-campus-sans text-campus-xs text-campus-muted">
        This reflects only what the holder has chosen to disclose, filtered by {institution.name}&rsquo;s review policy — not the full extent of their record. Built against deterministic demonstration data in this environment, not a live institutional record.
      </p>
    </div>
  )
}
