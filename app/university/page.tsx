import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { mockInstitutionRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institution — Syrka Campus' }

export default async function UniversityInstitutionPage() {
  const institution = await mockInstitutionRepository.getInstitution(universityAdministratorUser.institutionId)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={institution?.name ?? 'Institution'} subtitle="Institution-wide administration and intelligence arrive in Phase 7." />
      <Card className="p-6">
        <p className="font-sans text-sm text-campus-muted">
          This route validates the shared Campus shell for the University Administrator role, institution-wide scope. Full analytics, governance, and reporting views are built in Phase 7.
        </p>
      </Card>
    </div>
  )
}
