import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Faculty Coordination — Syrka Campus' }
export const dynamic = 'force-dynamic'

const SUPPORT_LABEL = { none_needed: 'No support needed', monitor: 'Monitor', support_recommended: 'Support recommended' } as const
const SUPPORT_TONE = { none_needed: 'green', monitor: 'amber', support_recommended: 'red' } as const

export default async function DepartmentFacultyPage() {
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
  const [rows, capacity] = await Promise.all([mockDepartmentRepository.listFacultyCoordination(departmentId), mockDepartmentRepository.getReviewCapacitySummary(departmentId)])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Faculty Coordination"
        subtitle="Academic coordination and workload health — never a performance ranking or activity-surveillance view."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Faculty' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Pending reviews</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{capacity.totalPendingReviews}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Overdue (7+ days)</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{capacity.totalOverdueReviews}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Average turnaround</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{capacity.averageTurnaroundDays}d</p>
        </div>
      </div>

      <section aria-labelledby="faculty-heading">
        <h2 id="faculty-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Faculty workload
        </h2>
        <div className="flex flex-col gap-3">
          {rows.map((f) => (
            <Card key={f.facultyId} className="flex flex-col gap-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-campus-sans text-campus-base font-medium text-campus-text">
                  {f.facultyName}
                  {f.title ? ` · ${f.title}` : ''}
                </p>
                <Badge tone={SUPPORT_TONE[f.supportStatus]}>{SUPPORT_LABEL[f.supportStatus]}</Badge>
              </div>
              <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Teaching: {f.coursesTaught.map((c) => c.courseLabel).join(', ')}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="neutral">{f.pendingReviewCount} pending reviews</Badge>
                <Badge tone={f.overdueReviewCount > 0 ? 'amber' : 'neutral'}>{f.overdueReviewCount} overdue</Badge>
                <Badge tone="neutral">{f.reviewCompletionPercent}% review completion</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {f.capabilityDomainsCovered.map((d) => (
                  <Badge key={d} tone="blue">
                    {d}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
