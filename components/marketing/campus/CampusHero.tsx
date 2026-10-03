import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { CampusSystemVisual } from './CampusSystemVisual'

/**
 * The Campus hero: a real product composition, not a text block over
 * empty space. The system visual on the right is the same living
 * Evidence→Capability→Odyssey/Passport sequence the narrative below
 * walks through in detail — the hero shows it already formed.
 */
export function CampusHero() {
  return (
    <section className="-mt-16 border-b border-campus-border bg-campus-ink-950 px-6 pb-20 pt-36 text-campus-white md:px-10 md:pb-28 md:pt-44">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
        <div>
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-white/50">Syrka Campus</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h1 className="mt-4 max-w-xl font-campus-sans text-[clamp(32px,5.5vw,56px)] font-semibold leading-[1.05] tracking-tight text-campus-white">
              A living operating environment for institutional capability.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <p className="mt-6 max-w-lg font-campus-sans text-campus-lg text-campus-white/70">
              Syrka Campus observes how capability actually develops — from a single lecture to a verified, portable credential — and directs every student, faculty member, and institution toward what should happen next.
            </p>
          </MotionReveal>
          <MotionReveal delay={0.15} className="mt-9 flex flex-wrap gap-3">
            <a href="#cta">
              <Button size="md">Request a demonstration</Button>
            </a>
            <a href="#narrative" className="inline-flex items-center rounded-campus-sm border border-campus-white/30 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white hover:bg-campus-white/10">
              See how it works
            </a>
          </MotionReveal>
          <MotionReveal delay={0.2} className="mt-4">
            <Link href="/sign-in" className="font-campus-sans text-campus-sm text-campus-white/50 hover:text-campus-white/80">
              Already a member? Sign in →
            </Link>
          </MotionReveal>
        </div>

        <MotionReveal delay={0.1} className="flex items-center justify-center">
          <CampusSystemVisual stage={4} className="h-auto w-full max-w-[480px]" />
        </MotionReveal>
      </div>
    </section>
  )
}
