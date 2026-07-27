import { Eye, ShieldCheck, UsersThree } from '@phosphor-icons/react/dist/ssr'
import { MotionReveal } from '@/components/motion/MotionReveal'

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'Explainable by default',
    description: 'Every capability claim, confidence score, and recommendation links back to the specific evidence and reasoning that produced it. Nothing is a black box.',
  },
  {
    icon: UsersThree,
    title: 'Human review, not automation alone',
    description: 'Faculty verify evidence before it strengthens a capability claim. AI proposes; people confirm.',
  },
  {
    icon: ShieldCheck,
    title: 'Institution-governed',
    description: 'Confidence bands, maturity states, and verification rules are defined by the institution’s own review policy, not a hidden vendor score.',
  },
] as const

export function TrustSection() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {PRINCIPLES.map((principle, i) => (
        <MotionReveal key={principle.title} delay={i * 0.08} className="flex flex-col gap-3">
          <principle.icon size={24} className="text-campus-purple-600 dark:text-campus-purple-dark" aria-hidden="true" />
          <h3 className="font-campus-sans text-campus-lg font-medium text-campus-text">{principle.title}</h3>
          <p className="font-campus-sans text-campus-sm text-campus-muted">{principle.description}</p>
        </MotionReveal>
      ))}
    </div>
  )
}
