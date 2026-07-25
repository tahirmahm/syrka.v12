import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FilterBar } from '@/components/ui/FilterBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CapabilityCard } from '@/components/capabilities/CapabilityCard'
import { CapabilityGraphLoader } from '@/components/capabilities/CapabilityGraphLoader'
import { GraphLegend } from '@/components/capabilities/GraphLegend'
import { mockCapabilityRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { buildCapabilityGraph } from '@/lib/utilities/capability-graph-layout'

export const metadata = { title: 'Capabilities — Syrka Campus' }

export default async function StudentCapabilitiesPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view === 'graph' ? 'graph' : 'list'

  const [definitions, claims, relationEdges] = await Promise.all([
    mockCapabilityRepository.listDefinitions(),
    mockCapabilityRepository.listClaimsForSubject(currentUser.id),
    mockCapabilityRepository.listRelationEdges(),
  ])

  const claimByCapabilityId = new Map(claims.map((c) => [c.capabilityId, c]))
  const { nodes, edges } = buildCapabilityGraph(definitions, claims, relationEdges)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Capabilities"
        subtitle={`${definitions.length} capabilities tracked, evidence-backed where supported.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Capabilities' }]} />}
      />

      <FilterBar
        label="View"
        options={[
          { label: 'List', href: '/student/capabilities?view=list', active: view === 'list' },
          { label: 'Graph', href: '/student/capabilities?view=graph', active: view === 'graph' },
        ]}
      />

      {definitions.length === 0 ? (
        <EmptyState title="No capabilities yet" description="Capabilities appear once evidence has been observed for this programme." />
      ) : view === 'graph' ? (
        <div className="flex flex-col gap-3">
          <GraphLegend />
          <CapabilityGraphLoader nodes={nodes} edges={edges} />
          <p className="font-campus-sans text-campus-xs text-campus-muted">
            Prefer a non-visual view? <a href="/student/capabilities?view=list" className="underline hover:text-campus-text">Switch to the list view</a> — it presents the same capabilities, relationships, and confidence data as text.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {definitions.map((definition) => (
            <CapabilityCard key={definition.id} definition={definition} claim={claimByCapabilityId.get(definition.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
