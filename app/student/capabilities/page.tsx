import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { mockCapabilityRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Capabilities — Syrka Campus' }

export default async function StudentCapabilitiesPage() {
  const states = await mockCapabilityRepository.listStatesForSubject(currentUser.id)
  const cards = await Promise.all(
    states.map(async (state) => ({ state, definition: await mockCapabilityRepository.getDefinition(state.capabilityId) }))
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Capabilities"
        subtitle="The interactive Human Capability Graph arrives in Phase 3. This is the full capability list for now."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Capabilities' }]} />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ state, definition }) => (
          <Card key={state.id} className="p-5">
            <h2 className="font-campus-sans text-campus-base font-medium text-campus-text">{definition?.name}</h2>
            <p className="mt-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{state.maturity}</p>
            <div className="mt-4">
              <ConfidenceMeter confidence={state.confidence} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
