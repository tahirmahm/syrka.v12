import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institutional Student Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityStudentsPage() {
  const cohorts = await mockUniversityRepository.listInstitutionalCohorts(universityAdministratorUser.institutionId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Institutional Student Intelligence"
        subtitle="Cohort- and institution-oriented by default — individual detail only where institutionally justified."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Students' }]} />}
      />

      {cohorts.length === 0 ? (
        <EmptyState title="No cohorts" />
      ) : (
        <div className="flex flex-col gap-2">
          {cohorts.map((c) => (
            <Link key={c.cohortId} href={`/department/students`}>
              <Card interactive className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{c.cohortName}</p>
                  <Badge tone="neutral">{c.studentCount} enrolled</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                  {c.departmentName} · {c.programmeName}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={c.capabilityGapCount > 0 ? 'amber' : 'green'}>{c.capabilityGapCount} Capability gap(s)</Badge>
                  <Badge tone={c.unresolvedEvidenceCount > 0 ? 'blue' : 'neutral'}>{c.unresolvedEvidenceCount} unresolved Evidence</Badge>
                  <Badge tone={c.staleClaimCount > 0 ? 'amber' : 'neutral'}>{c.staleClaimCount} stale claim(s)</Badge>
                  <Badge tone={c.odysseyBlockerCount > 0 ? 'blue' : 'neutral'}>{c.odysseyBlockerCount} Odyssey blocker(s)</Badge>
                  <Badge tone={c.passportReadinessBlockerCount > 0 ? 'blue' : 'neutral'}>{c.passportReadinessBlockerCount} Passport blocker(s)</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="font-campus-mono text-campus-xs text-campus-muted">
        This institution models a single cohort of one real student — patterns above reflect that student honestly rather than fabricated peers. Per-student intervention detail is
        available in the Department view.
      </p>
    </div>
  )
}
