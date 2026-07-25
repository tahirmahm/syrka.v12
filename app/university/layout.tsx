import { CampusShell } from '@/components/navigation/CampusShell'
import { mockInstitutionRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export default async function UniversityLayout({ children }: { children: React.ReactNode }) {
  const institution = await mockInstitutionRepository.getInstitution(universityAdministratorUser.institutionId)
  return (
    <CampusShell user={universityAdministratorUser} institutionName={institution?.name}>
      {children}
    </CampusShell>
  )
}
