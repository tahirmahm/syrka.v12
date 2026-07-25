import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockDepartmentRepository } from '@/lib/repositories'
import { department } from '@/lib/mock-data/seed'

export const metadata = { title: 'Student Cohorts — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function DepartmentStudentsPage() {
  const cohortsByProgramme = await Promise.all(department.programmeIds.map((id) => mockDepartmentRepository.listCohorts(id)))
  const cohorts = cohortsByProgramme.flat()

  const cohortData = await Promise.all(
    cohorts.map(async (cohort) => ({
      cohort,
      evidenceSummary: await mockDepartmentRepository.getCohortEvidenceSummary(cohort.id),
      capabilitySummaries: await mockDepartmentRepository.getCohortCapabilitySummaries(cohort.id),
      studentFlags: await mockDepartmentRepository.listCohortStudentFlags(cohort.id),
    }))
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Student Cohorts"
        subtitle="A cohort and intervention surface — aggregate by default, with individual detail only where academically justified."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Students' }]} />}
      />

      {cohortData.length === 0 ? (
        <EmptyState title="No cohorts" />
      ) : (
        cohortData.map(({ cohort, evidenceSummary, capabilitySummaries, studentFlags }) => (
          <section key={cohort.id} aria-labelledby={`cohort-${cohort.id}-heading`} className="flex flex-col gap-4">
            <h2 id={`cohort-${cohort.id}-heading`} className="font-campus-sans text-campus-lg font-medium text-campus-text">
              {cohort.name}
            </h2>
            <p className="-mt-3 font-campus-sans text-campus-xs text-campus-muted">
              {cohort.studentIds.length} enrolled student{cohort.studentIds.length === 1 ? '' : 's'} modeled in this demo dataset — a real institution would show many more.
            </p>

            {evidenceSummary && (
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-campus-md border border-campus-border p-4">
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence records</p>
                  <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{evidenceSummary.totalEvidenceRecords}</p>
                </div>
                <div className="rounded-campus-md border border-campus-border p-4">
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Pending review</p>
                  <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{evidenceSummary.pendingReviewCount}</p>
                </div>
                <div className="rounded-campus-md border border-campus-border p-4">
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Ageing (7+ days)</p>
                  <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{evidenceSummary.agingOver7DaysCount}</p>
                </div>
                <div className="rounded-campus-md border border-campus-border p-4">
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Disputed</p>
                  <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{evidenceSummary.disputedCount}</p>
                </div>
              </div>
            )}

            <Card className="p-5">
              <p className="mb-3 font-campus-sans text-campus-sm font-medium text-campus-text">Capability maturity, by domain</p>
              <div className="flex flex-col gap-4">
                {capabilitySummaries.map((s) => (
                  <div key={s.capabilityId}>
                    <p className="mb-1 font-campus-sans text-campus-sm text-campus-text">{s.capabilityName}</p>
                    <DistributionBars data={s.maturityDistribution} total={cohort.studentIds.length} />
                    {s.studentsWithoutEvidence > 0 && (
                      <p className="mt-1 font-campus-mono text-campus-xs text-campus-muted">{s.studentsWithoutEvidence} student(s) without supporting Evidence yet.</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div>
              <p className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">Students requiring intervention</p>
              {studentFlags.filter((f) => f.needsIntervention).length === 0 ? (
                <EmptyState title="No students currently flagged" description="No cohort member currently has a Capability gap, stale claim, review backlog, or Odyssey blocker." />
              ) : (
                <div className="flex flex-col gap-2">
                  {studentFlags
                    .filter((f) => f.needsIntervention)
                    .map((f) => (
                      <Card key={f.studentId} className="flex flex-col gap-2 p-4">
                        <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{f.studentName}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {f.capabilityGapCount > 0 && <Badge tone="amber">{f.capabilityGapCount} Capability gap(s)</Badge>}
                          {f.staleClaimCount > 0 && <Badge tone="amber">{f.staleClaimCount} stale claim(s)</Badge>}
                          {f.unresolvedEvidenceCount > 0 && <Badge tone="blue">{f.unresolvedEvidenceCount} unresolved Evidence</Badge>}
                          {f.passportReadinessBlockerCount > 0 && <Badge tone="neutral">{f.passportReadinessBlockerCount} Passport blocker(s)</Badge>}
                          {f.odysseyBlockerCount > 0 && <Badge tone="red">{f.odysseyBlockerCount} Odyssey blocker(s)</Badge>}
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
