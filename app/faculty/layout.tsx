import { CampusShell } from '@/components/navigation/CampusShell'
import { facultyUser } from '@/lib/mock-data/seed'

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <CampusShell user={facultyUser}>{children}</CampusShell>
}
