import { CampusShell } from '@/components/navigation/CampusShell'
import { currentUser } from '@/lib/mock-data/seed'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <CampusShell user={currentUser}>{children}</CampusShell>
}
