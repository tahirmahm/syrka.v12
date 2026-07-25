import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Status } from '@/components/ui/Status'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockEvidenceRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Evidence — Syrka Campus' }

export default async function StudentEvidencePage() {
  const evidence = await mockEvidenceRepository.listForStudent(currentUser.id)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Evidence"
        subtitle="The full evidence timeline and detail view arrive in Phase 3. This is the complete list for now."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Evidence' }]} />}
      />
      {evidence.length === 0 ? (
        <EmptyState title="No evidence yet" description="Submitted coursework and achievements will appear here once recorded." />
      ) : (
        <div className="flex flex-col gap-2">
          {evidence.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{item.title}</p>
                <p className="font-campus-mono text-campus-xs text-campus-muted">{item.provenance}</p>
              </div>
              <Status tone={item.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
