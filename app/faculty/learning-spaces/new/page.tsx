import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { NewLearningSpaceForm } from '@/components/learning/NewLearningSpaceForm'

export const metadata = { title: 'New Learning Space — Syrka Campus' }

export default function NewLearningSpacePage() {
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
