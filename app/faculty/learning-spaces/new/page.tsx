import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { NewLearningSpaceForm } from '@/components/learning/NewLearningSpaceForm'
import { isLearningAuthoringEnabled } from '@/lib/services/learning/authoring-gate'
import { resolveLearningActor } from '@/lib/services/learning/actor'

export const metadata = { title: 'New Learning Space — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function NewLearningSpacePage() {
  if (!isLearningAuthoringEnabled()) notFound()
  const resolution = await resolveLearningActor()
  if (!resolution.ok) notFound()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="New Learning Space"
        subtitle="Upload an authorised PDF for native text extraction — nothing here is visible to students."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Learning Spaces', href: '/faculty/learning-spaces' }, { label: 'New' }]} />}
      />
      <NewLearningSpaceForm />
    </div>
  )
}
