import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PassportClaimRow } from '@/components/passport/PassportClaimRow'
import { PassportVersionHistory } from '@/components/passport/PassportVersionHistory'
import { ReadinessSummary } from '@/components/passport/ReadinessSummary'
import { PassportDisclosureSection } from '@/components/passport/PassportDisclosureSection'
import { PrintButton } from '@/components/passport/PrintButton'
import {
  mockPassportRepository,
  mockInstitutionRepository,
  mockEvidenceRepository,
  mockCapabilityRepository,
} from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { PASSPORT_DISPLAY_NAME } from '@/lib/constants/passport'
import { formatDate } from '@/lib/utilities/format-relative-time'

export const metadata = { title: `${PASSPORT_DISPLAY_NAME} — Syrka Campus` }

export default async function StudentPassportPage() {
  const [passport, institution, evidence, definitions, disclosureSettings] = await Promise.all([
    mockPassportRepository.getForStudent(currentUser.id),
    mockInstitutionRepository.getInstitution(currentUser.institutionId),
    mockEvidenceRepository.listForStudent(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
    mockPassportRepository.getDisclosureSettings(currentUser.id),
  ])

  const breadcrumbs = <Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: PASSPORT_DISPLAY_NAME }]} />

  if (!passport || !institution) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title={PASSPORT_DISPLAY_NAME} breadcrumbs={breadcrumbs} />
        <EmptyState title="No Passport issued yet" description="A Passport is issued once at least one capability claim meets the confidence threshold for inclusion." />
      </div>
    )
  }

  const programme = currentUser.programmeId ? await mockInstitutionRepository.getProgramme(currentUser.programmeId) : undefined
  const courses = currentUser.programmeId ? await mockInstitutionRepository.listCourses(currentUser.programmeId) : []
  const currentVersion = passport.versions.find((v) => v.version === passport.currentVersion)
  const capabilityById = new Map(definitions.map((d) => [d.id, d]))
  const pendingEvidenceCount = evidence.filter((e) => e.review.status === 'pending').length

  if (!currentVersion) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title={PASSPORT_DISPLAY_NAME} breadcrumbs={breadcrumbs} />
        <EmptyState title="No current version found" description="This Passport has no resolvable current version." />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title={PASSPORT_DISPLAY_NAME}
        subtitle="An institutionally reviewed, evidence-backed record of what you can credibly do — current as of its issue date, not a résumé."
        breadcrumbs={breadcrumbs}
        actions={<PrintButton />}
      />

      {/* Identity + institution + status */}
      <Panel className="flex flex-col gap-2 print:break-inside-avoid">
        <div className="flex items-center justify-between border-b border-campus-border pb-4">
          <div>
            <p className="font-campus-sans text-campus-lg font-medium text-campus-text">{currentUser.name}</p>
            <p className="font-campus-sans text-campus-sm text-campus-muted">
              {programme?.name} · {institution.name}
            </p>
          </div>
          <div className="text-right">
            <Badge tone="gold">Institutionally reviewed</Badge>
            <p className="mt-1 font-campus-mono text-campus-xs text-campus-muted">
              Version {passport.currentVersion} · Current as of {formatDate(currentVersion.issuedAt)}
            </p>
          </div>
        </div>
        <p className="pt-2 font-campus-sans text-campus-xs text-campus-muted">
          Issued by {passport.verificationSeal.issuer}. Evidence-backed and versioned — subject to disclosure controls below.
        </p>
      </Panel>

      <ReadinessSummary version={currentVersion} pendingEvidenceCount={pendingEvidenceCount} />

      {/* Claims */}
      <section aria-labelledby="claims-heading">
        <h2 id="claims-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Capability claims
        </h2>
        {currentVersion.claims.length === 0 ? (
          <EmptyState title="No claims yet" description="No capability has yet met the confidence threshold for a shareable claim." />
        ) : (
          <div className="flex flex-col gap-3">
            {currentVersion.claims.map((claim) => (
              <PassportClaimRow key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </section>

      {/* Version history */}
      <section aria-labelledby="version-heading" className="print:hidden">
        <h2 id="version-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Version history
        </h2>
        <PassportVersionHistory versions={passport.versions} currentVersion={passport.currentVersion} capabilityById={capabilityById} />
      </section>

      {/* Sharing & disclosure */}
      <section aria-labelledby="sharing-heading" className="print:hidden">
        <h2 id="sharing-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Sharing and disclosure
        </h2>
        <PassportDisclosureSection
          version={currentVersion}
          defaultSettings={disclosureSettings}
          institution={institution}
          programme={programme}
          studentName={currentUser.name}
          evidenceRecords={evidence.map((e) => e.record)}
          courses={courses}
        />
      </section>
    </div>
  )
}
