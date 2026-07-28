import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { PassportClaimInspectorSection } from '@/components/passport/PassportClaimInspectorSection'
import { PassportVersionHistory } from '@/components/passport/PassportVersionHistory'
import { ReadinessSummary } from '@/components/passport/ReadinessSummary'
import { PassportDisclosureSection } from '@/components/passport/PassportDisclosureSection'
import { PassportWalletCard } from '@/components/passport/PassportWalletCard'
import {
  mockPassportRepository,
  mockInstitutionRepository,
  mockEvidenceRepository,
  mockCapabilityRepository,
} from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { PASSPORT_DISPLAY_NAME } from '@/lib/constants/passport'
import { formatDate } from '@/lib/utilities/format-relative-time'
import { generatePassportQrSvg } from '@/lib/utilities/qr'
import { getAppBaseUrl } from '@/lib/utilities/app-url'
import { getStudentIdentity } from '@/lib/utilities/student-identity-projection'

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

  const identity = getStudentIdentity(currentUser.id)
  const isClassX = identity.stage === 'secondary_class_10'
  const programme = !isClassX && currentUser.programmeId ? await mockInstitutionRepository.getProgramme(currentUser.programmeId) : undefined
  const courses = !isClassX && currentUser.programmeId ? await mockInstitutionRepository.listCourses(currentUser.programmeId) : []
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

  const initials = currentUser.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const verifyUrl = `${getAppBaseUrl()}/verify/passport/${passport.id}`
  const qrSvgMarkup = await generatePassportQrSvg(verifyUrl)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader
        title={PASSPORT_DISPLAY_NAME}
        subtitle="An institutionally reviewed, evidence-backed record of what you can credibly do — current as of its issue date, not a résumé."
        breadcrumbs={breadcrumbs}
      />

      {/* The credential itself — a real card, read first, not a data panel among others. */}
      <div className="print:break-inside-avoid">
        <PassportWalletCard
          holderName={currentUser.name}
          initials={initials}
          passportId={passport.id}
          institutionName={isClassX ? identity.headerLabel : institution.name}
          programmeName={isClassX ? identity.classOrProgramme : programme?.name}
          issueDate={formatDate(currentVersion.issuedAt)}
          version={passport.currentVersion}
          verificationLabel="Institutionally reviewed"
          qrSvgMarkup={qrSvgMarkup}
          verifyUrl={verifyUrl}
        />
      </div>
      <p className="text-center font-campus-sans text-campus-xs text-campus-muted print:hidden">
        Issued by {isClassX ? identity.headerLabel : passport.verificationSeal.issuer}. Evidence-backed and versioned — subject to disclosure controls below.
      </p>

      <ReadinessSummary version={currentVersion} pendingEvidenceCount={pendingEvidenceCount} />

      {/* Claims */}
      <section aria-labelledby="claims-heading">
        <h2 id="claims-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Capability claims
        </h2>
        {currentVersion.claims.length === 0 ? (
          <EmptyState title="No claims yet" description="No capability has yet met the confidence threshold for a shareable claim." />
        ) : (
          <PassportClaimInspectorSection
            claims={currentVersion.claims}
            evidenceById={new Map(evidence.map((e) => [e.record.id, e.record]))}
            capabilityById={capabilityById}
            disclosureSettings={disclosureSettings}
            issuedAt={currentVersion.issuedAt}
          />
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
