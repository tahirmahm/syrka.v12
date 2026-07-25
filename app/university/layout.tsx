import { CampusShell } from '@/components/navigation/CampusShell'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  return <CampusShell user={universityAdministratorUser}>{children}</CampusShell>
}
