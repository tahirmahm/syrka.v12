import type { UserRole } from '@/lib/campus-types'

export interface NavItem {
  href: string
  label: string
}

/**
 * Role-scoped primary navigation. University Administrator scope
 * (institution-wide vs department-scoped) is applied by the consuming
 * layout, not by a separate role — see lib/types/user.ts.
 */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/student', label: 'Dashboard' },
    { href: '/student/learning', label: 'Learning' },
    { href: '/student/evidence', label: 'Evidence' },
    { href: '/student/capabilities', label: 'Capabilities' },
    { href: '/student/odyssey', label: 'Odyssey' },
    { href: '/student/passport', label: 'Academic Passport' },
  ],
  faculty: [
    { href: '/faculty', label: 'Dashboard' },
    { href: '/faculty/courses', label: 'Courses' },
    { href: '/faculty/evidence', label: 'Evidence Review' },
    { href: '/faculty/students', label: 'Students' },
    { href: '/faculty/analytics', label: 'Analytics' },
  ],
  university_administrator: [
    { href: '/university', label: 'Institution' },
    { href: '/university/departments', label: 'Departments' },
    { href: '/university/programmes', label: 'Programmes' },
    { href: '/university/users', label: 'Users' },
    { href: '/university/analytics', label: 'Analytics' },
    { href: '/university/reports', label: 'Reports' },
  ],
}

export const DEPARTMENT_SCOPED_NAV_ITEMS: NavItem[] = [
  { href: '/department', label: 'Programme Health' },
  { href: '/department/programmes', label: 'Programmes' },
  { href: '/department/curriculum', label: 'Curriculum' },
  { href: '/department/faculty', label: 'Faculty' },
  { href: '/department/capability-reports', label: 'Capability Reports' },
  { href: '/department/analytics', label: 'Analytics' },
]
