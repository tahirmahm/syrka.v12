import { CampusShell } from '@/components/navigation/CampusShell'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
  return <CampusShell user={departmentAdministratorUser}>{children}</CampusShell>
}
