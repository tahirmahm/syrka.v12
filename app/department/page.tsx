import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { mockInstitutionRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Department — Syrka Campus' }

export default async function DepartmentHealthPage() {
  const department = departmentAdministratorUser.administratorScope?.departmentId
    ? await mockInstitutionRepository.getDepartment(departmentAdministratorUser.administratorScope.departmentId)
    : undefined

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={department?.name ?? 'Department'} subtitle="University Administration scoped to this department. Programme health and curriculum views arrive in Phase 6." />
      <Card className="p-6">
        <p className="font-campus-sans text-campus-sm text-campus-muted">
          This route validates the shared Campus shell for the University Administrator role, department-scoped. It reuses the same administrator domain model as /university, scoped by administratorScope.
        </p>
      </Card>
    </div>
  )
}
