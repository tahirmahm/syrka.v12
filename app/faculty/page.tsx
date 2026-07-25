import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Faculty Dashboard — Syrka Campus' }

export default function FacultyDashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Faculty Dashboard" subtitle="Evidence review, cohort signals, and curriculum mapping arrive in Phase 5." />
      <Card className="p-6">
        <p className="font-campus-sans text-campus-sm text-campus-muted">
          This route validates the shared Campus shell and design system for the faculty role. Full evidence review workflows are built in Phase 5.
        </p>
      </Card>
    </div>
  )
}
