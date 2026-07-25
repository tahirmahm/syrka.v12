import { CampusShell } from '@/components/navigation/CampusShell'
import { mockInstitutionRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const institution = await mockInstitutionRepository.getInstitution(currentUser.institutionId)
  return (
    <CampusShell user={currentUser} institutionName={institution?.name}>
      {children}
    </CampusShell>
  )
}
