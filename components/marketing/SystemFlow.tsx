import { Fragment } from 'react'
import { FileText, ChartLineUp, Compass, SealCheck, ArrowRight, ArrowDown } from '@phosphor-icons/react/dist/ssr'
import { MotionReveal } from '@/components/motion/MotionReveal'

const STEPS = [
  {
    icon: FileText,
    label: 'Evidence',
    description: 'Every assignment, project, assessment, and verified achievement becomes a timestamped evidence record.',
    tone: 'text-campus-ink-700 dark:text-campus-muted',
  },
  {
    icon: ChartLineUp,
    label: 'Capability',
    description: 'Evidence accumulates into capability states with a maturity level and a calibrated confidence band.',
    tone: 'text-campus-blue-600 dark:text-campus-blue-dark',
  },
  {
    icon: Compass,
    label: 'Odyssey',
    description: 'Confirmed capability shapes a personal roadmap: what to do next, and why it moves you forward.',
    tone: 'text-campus-green-600 dark:text-campus-green-dark',
  },
  {
    icon: SealCheck,
    label: 'Academic Passport',
    description: 'Verified capability claims are issued as a versioned, institution-backed record a student can share.',
    tone: 'text-campus-gold-500 dark:text-campus-gold-dark',
  },
] as const

export function SystemFlow() {
  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
      {STEPS.map((step, i) => (
        <Fragment key={step.label}>
          <MotionReveal delay={i * 0.08} className="flex flex-col items-start gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-6">
            <step.icon size={28} weight="regular" className={step.tone} aria-hidden="true" />
            <h3 className="font-campus-sans text-campus-lg font-medium text-campus-text">{step.label}</h3>
            <p className="font-campus-sans text-campus-sm text-campus-muted">{step.description}</p>
          </MotionReveal>
          {i < STEPS.length - 1 && (
            <div className="flex items-center justify-center py-2 text-campus-border md:py-0">
              <ArrowDown size={18} className="md:hidden" aria-hidden="true" />
              <ArrowRight size={18} className="hidden md:block" aria-hidden="true" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}
