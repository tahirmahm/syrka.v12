import { CampusShell } from '@/components/navigation/CampusShell'
import { currentUser } from '@/lib/mock-data/seed'
import { getStudentIdentity } from '@/lib/utilities/student-identity-projection'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const identity = getStudentIdentity(currentUser.id)
  return (
    <CampusShell user={currentUser} institutionName={identity.headerLabel}>
      {children}
    </CampusShell>
  )
}
