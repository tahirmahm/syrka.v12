import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { mockOdysseyRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Odyssey — Syrka Campus' }

export default async function StudentOdysseyPage() {
  const odyssey = await mockOdysseyRepository.getPlanForStudent(currentUser.id)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Odyssey"
        subtitle="The full milestone roadmap and reasoning view arrive in Phase 4."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Odyssey' }]} />}
      />
      {odyssey && (
        <Card className="p-6">
          <p className="font-campus-sans text-campus-sm text-campus-text">Target: {odyssey.targetOutcome}</p>
          <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">{odyssey.currentPositionSummary}</p>
        </Card>
      )}
    </div>
  )
}
