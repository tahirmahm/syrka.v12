import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { mockPassportRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Academic Passport — Syrka Campus' }

export default async function StudentPassportPage() {
  const passport = await mockPassportRepository.getForStudent(currentUser.id)
  const latestVersion = passport?.versions.find((v) => v.version === passport.currentVersion)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Academic Passport"
        subtitle="The full verified, shareable Passport document arrives in Phase 4."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Academic Passport' }]} />}
      />
      {passport && latestVersion && (
        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-campus-border pb-4">
            <span className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version {passport.currentVersion}</span>
            <Badge tone="gold">Verified</Badge>
          </div>
          {latestVersion.claims.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between">
              <span className="font-campus-sans text-campus-sm text-campus-text">{claim.capabilityName}</span>
              <span className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{claim.maturity}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  )
}
