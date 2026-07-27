import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Learning — Syrka Campus' }

export default function StudentLearningPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Learning"
        subtitle="Courses and coursework arrive in Phase 3."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Learning' }]} />}
      />
      <Card className="p-6">
        <p className="font-campus-sans text-campus-sm text-campus-muted">This screen is not yet built.</p>
      </Card>
    </div>
  )
}
