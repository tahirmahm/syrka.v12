import { CampusShell } from '@/components/navigation/CampusShell'
import { mockInstitutionRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const institution = await mockInstitutionRepository.getInstitution(facultyUser.institutionId)
  return (
    <CampusShell user={facultyUser} institutionName={institution?.name}>
      {children}
    </CampusShell>
  )
}
