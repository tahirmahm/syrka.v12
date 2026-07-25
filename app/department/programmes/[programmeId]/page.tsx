import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CoverageTable } from '@/components/department/CoverageTable'
import { CurriculumAlignmentList } from '@/components/department/CurriculumAlignmentList'
import { mockInstitutionRepository, mockDepartmentRepository, mockCapabilityRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

async function loadProgramme(programmeId: string) {
  const programme = await mockInstitutionRepository.getProgramme(programmeId)
  if (!programme) return undefined
  const health = await mockDepartmentRepository.getProgrammeHealth(programmeId)
  if (!health) return undefined
  return { programme, health }
}

export async function generateMetadata({ params }: { params: { programmeId: string } }) {
  const loaded = await loadProgramme(params.programmeId)
  if (!loaded) notFound()
  return { title: `${loaded.programme.name} — Syrka Campus` }
}

export default async function DepartmentProgrammeDetailPage({ params }: { params: { programmeId: string } }) {
  const loaded = await loadProgramme(params.programmeId)
  if (!loaded) notFound()
  const { programme, health } = loaded
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!

  const [outcomes, coverage, issues, cohorts, allInterventions] = await Promise.all([
    mockDepartmentRepository.listProgrammeOutcomes(programme.id),
    mockDepartmentRepository.listObservedCoverage(programme.id),
    mockDepartmentRepository.listCurriculumAlignmentIssues(programme.id),
    mockDepartmentRepository.listCohorts(programme.id),
    mockDepartmentRepository.listInterventions(departmentId),
  ])
  const interventions = allInterventions.filter((i) => i.programmeId === programme.id)
  const outcomeCapabilityNames = await Promise.all(
    outcomes.map(async (o) => ({
      outcome: o,
      capabilityNames: await Promise.all(o.capabilityIds.map(async (id) => (await mockCapabilityRepository.getDefinition(id))?.name ?? id)),
    }))
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader
        title={programme.name}
        subtitle={`${programme.degreeLevel} · ${health.activeTerm} · ${health.cohortSize} enrolled across ${cohorts.length} cohort${cohorts.length === 1 ? '' : 's'}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Programmes', href: '/department/programmes' }, { label: programme.name }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Observed coverage</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.observedCapabilityCoveragePercent}%</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence-producing courses</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">
            {health.evidenceProducingCourseCount}/{health.totalCourseCount}
          </p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Unresolved Evidence</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.unresolvedEvidenceCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Curriculum gaps</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.gapCount}</p>
        </div>
      </div>

      <section aria-labelledby="outcomes-heading">
        <h2 id="outcomes-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Declared programme outcomes
        </h2>
        <div className="flex flex-col gap-3">
          {outcomeCapabilityNames.map(({ outcome, capabilityNames }) => (
            <Card key={outcome.id} className="p-4">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{outcome.title}</p>
              <p className="mt-1 font-campus-sans text-campus-sm text-campus-muted">{outcome.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {capabilityNames.map((name) => (
                  <Badge key={name} tone="neutral">
                    {name}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Programme Capability map
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          Intended coverage (what each course is meant to develop) against observed reality (Evidence actually produced and reviewed) — completing a course is never treated as automatic
          Capability proof.
        </p>
        <CoverageTable rows={coverage} />
      </section>

      <section aria-labelledby="alignment-heading">
        <h2 id="alignment-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Curriculum alignment
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          Where the chain from declared outcome to reviewed Capability breaks down, and why — never collapsed into a single alignment score.
        </p>
        <CurriculumAlignmentList issues={issues} />
      </section>

      <section aria-labelledby="interventions-heading">
        <h2 id="interventions-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Interventions
        </h2>
        {interventions.length === 0 ? (
          <EmptyState title="No interventions yet" description="Create one from the Analytics workflow to track a planned response to a gap above." />
        ) : (
          <div className="flex flex-col gap-2">
            {interventions.map((i) => (
              <Card key={i.id} className="flex flex-col gap-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{i.title}</p>
                  <Badge tone="neutral">{i.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="font-campus-sans text-campus-xs text-campus-muted">{i.rationale}</p>
                <p className="font-campus-mono text-campus-xs text-campus-muted">Projected effect: {i.expectedEffect}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
