import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import {
  SquaresFour,
  BookOpen,
  Files,
  ChartBar,
  MapTrifold,
  IdentificationCard,
  ChalkboardTeacher,
  ClipboardText,
  Users,
  ChartLineUp,
  Buildings,
  GraduationCap,
  Shield,
  Compass,
  Warning,
} from '@phosphor-icons/react/dist/ssr'
import type { UserRole } from '@/lib/campus-types'

export interface NavItem {
  href: string
  label: string
  icon: ComponentType<IconProps>
}

/**
 * Role-scoped primary navigation. University Administrator scope
 * (institution-wide vs department-scoped) is applied by the consuming
 * layout, not by a separate role — see lib/types/user.ts. Icons back the
 * collapsed rail's icon-only presentation — active state must never rely
 * on colour alone, so every item also carries a label for tooltips and
 * the expanded rail.
 */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/student', label: 'Dashboard', icon: SquaresFour },
    { href: '/student/learning', label: 'Learning', icon: BookOpen },
    { href: '/student/evidence', label: 'Evidence', icon: Files },
    { href: '/student/capabilities', label: 'Capabilities', icon: ChartBar },
    { href: '/student/odyssey', label: 'Odyssey', icon: MapTrifold },
    { href: '/student/passport', label: 'Career Passport', icon: IdentificationCard },
  ],
  faculty: [
    { href: '/faculty', label: 'Dashboard', icon: SquaresFour },
    { href: '/faculty/courses', label: 'Courses', icon: ChalkboardTeacher },
    { href: '/faculty/curriculum', label: 'Curriculum', icon: Compass },
    { href: '/faculty/learning-spaces', label: 'Learning Spaces', icon: BookOpen },
    { href: '/faculty/interventions', label: 'Interventions', icon: Warning },
    { href: '/faculty/evidence', label: 'Evidence Review', icon: ClipboardText },
    { href: '/faculty/students', label: 'Students', icon: Users },
    { href: '/faculty/analytics', label: 'Analytics', icon: ChartLineUp },
  ],
  university_administrator: [
    { href: '/university', label: 'Overview', icon: SquaresFour },
    { href: '/university/departments', label: 'Departments', icon: Buildings },
    { href: '/university/programmes', label: 'Programmes', icon: GraduationCap },
    { href: '/university/capabilities', label: 'Capabilities', icon: ChartBar },
    { href: '/university/evidence', label: 'Evidence', icon: Files },
    { href: '/university/faculty', label: 'Faculty', icon: ChalkboardTeacher },
    { href: '/university/students', label: 'Students', icon: Users },
    { href: '/university/odyssey', label: 'Odyssey', icon: MapTrifold },
    { href: '/university/passports', label: 'Passports', icon: IdentificationCard },
    { href: '/university/governance', label: 'Governance', icon: Shield },
    { href: '/university/analytics', label: 'Analytics', icon: ChartLineUp },
  ],
}

export const DEPARTMENT_SCOPED_NAV_ITEMS: NavItem[] = [
  { href: '/department', label: 'Overview', icon: SquaresFour },
  { href: '/department/programmes', label: 'Programmes', icon: GraduationCap },
  { href: '/department/courses', label: 'Courses', icon: BookOpen },
  { href: '/department/capabilities', label: 'Capabilities', icon: ChartBar },
  { href: '/department/evidence', label: 'Evidence', icon: Files },
  { href: '/department/faculty', label: 'Faculty', icon: ChalkboardTeacher },
  { href: '/department/students', label: 'Students', icon: Users },
  { href: '/department/analytics', label: 'Analytics', icon: ChartLineUp },
]
