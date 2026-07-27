import { GraduationCap, ChalkboardTeacher, Buildings } from '@phosphor-icons/react/dist/ssr'
import { Card } from '@/components/ui/Card'
import { MotionReveal } from '@/components/motion/MotionReveal'

const ROLES = [
  {
    icon: GraduationCap,
    label: 'Student',
    description: 'See what you can credibly do, why it is justified, and what to do next — with a verified Syrka Career Passport as the record.',
  },
  {
    icon: ChalkboardTeacher,
    label: 'Faculty',
    description: 'Review evidence, verify capability claims, and see the direct effect of your review on a student’s record.',
  },
  {
    icon: Buildings,
    label: 'University Administration',
    description: 'Institution and department-level visibility into capability formation, curriculum coverage, and evidence quality — scoped to what each administrator needs.',
  },
] as const

export function RoleOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {ROLES.map((role, i) => (
        <MotionReveal key={role.label} delay={i * 0.08}>
          <Card className="flex h-full flex-col gap-3 p-6">
            <role.icon size={26} className="text-campus-text" aria-hidden="true" />
            <h3 className="font-campus-sans text-campus-lg font-medium text-campus-text">{role.label}</h3>
            <p className="font-campus-sans text-campus-sm text-campus-muted">{role.description}</p>
          </Card>
        </MotionReveal>
      ))}
    </div>
  )
}
