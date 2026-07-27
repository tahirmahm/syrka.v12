import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { LIFECYCLE_STATE_LABELS, LIFECYCLE_STATE_TONES } from '@/lib/constants/learning-ingestion'

export const metadata = { title: 'Learning Spaces — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function LearningSpacesPage() {
  const spaces = await mockLearningIngestionRepository.listLearningSpaces(facultyUser.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Learning Spaces"
        subtitle="Turn an authorised source document into a traceable, teacher-approved Learning Space draft."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Learning Spaces' }]} />}
        actions={
          <Link href="/faculty/learning-spaces/new">
            <Button size="sm">New Learning Space</Button>
          </Link>
        }
      />

      {spaces.length === 0 ? (
        <EmptyState
          title="No Learning Spaces yet"
          description="Upload an authorised PDF to begin extraction, review, and curriculum authoring — nothing here is visible to students until it is published in a later stage."
          action={
            <Link href="/faculty/learning-spaces/new">
              <Button size="sm">New Learning Space</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {spaces.map((space) => (
            <Link key={space.id} href={`/faculty/learning-spaces/${space.id}/review`}>
              <Card interactive className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{space.title}</p>
                  <p className="mt-0.5 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version {space.currentVersionId ? 1 : 0}</p>
                </div>
                <Badge tone={LIFECYCLE_STATE_TONES[space.lifecycleState]}>{LIFECYCLE_STATE_LABELS[space.lifecycleState]}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
