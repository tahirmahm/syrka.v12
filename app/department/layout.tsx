import { CampusShell } from '@/components/navigation/CampusShell'
import { mockInstitutionRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export default async function DepartmentLayout({ children }: { children: React.ReactNode }) {
  const institution = await mockInstitutionRepository.getInstitution(departmentAdministratorUser.institutionId)
  return (
    <CampusShell user={departmentAdministratorUser} institutionName={institution?.name}>
      {children}
    </CampusShell>
  )
}
