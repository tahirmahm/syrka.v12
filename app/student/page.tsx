import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { Status } from '@/components/ui/Status'
import { mockCapabilityRepository, mockEvidenceRepository, mockOdysseyRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Dashboard — Syrka Campus' }

export default async function StudentDashboardPage() {
  const [capabilityStates, evidence, odyssey] = await Promise.all([
    mockCapabilityRepository.listStatesForSubject(currentUser.id),
    mockEvidenceRepository.listForStudent(currentUser.id),
    mockOdysseyRepository.getPlanForStudent(currentUser.id),
  ])

  const capabilityCards = await Promise.all(
    capabilityStates.map(async (state) => ({
      state,
      definition: await mockCapabilityRepository.getDefinition(state.capabilityId),
    }))
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader title={`Welcome back, ${currentUser.name.split(' ')[0]}`} subtitle="This is the Phase 1 architecture proof — the full dashboard arrives in Phase 2." />

      <section className="grid gap-4 sm:grid-cols-2">
        {capabilityCards.map(({ state, definition }) => (
          <Card key={state.id} className="p-5">
            <h2 className="font-sans text-base font-medium text-campus-text">{definition?.name}</h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-campus-muted">{state.maturity}</p>
            <div className="mt-4">
              <ConfidenceMeter confidence={state.confidence} />
            </div>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-sans text-lg font-medium text-campus-text">Recent evidence</h2>
        <div className="flex flex-col gap-2">
          {evidence.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-sans text-sm font-medium text-campus-text">{item.title}</p>
                <p className="font-mono text-xs text-campus-muted">{item.provenance}</p>
              </div>
              <Status tone={item.status} />
            </Card>
          ))}
        </div>
      </section>

      {odyssey && (
        <section>
          <h2 className="mb-3 font-sans text-lg font-medium text-campus-text">Odyssey</h2>
          <Card className="p-5">
            <p className="font-sans text-sm text-campus-text">Target: {odyssey.targetOutcome}</p>
            <p className="mt-1 font-sans text-xs text-campus-muted">{odyssey.currentPositionSummary}</p>
          </Card>
        </section>
      )}
    </div>
  )
}
