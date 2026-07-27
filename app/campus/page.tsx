import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { SystemFlow } from '@/components/marketing/SystemFlow'
import { RoleOverview } from '@/components/marketing/RoleOverview'
import { TrustSection } from '@/components/marketing/TrustSection'

export const metadata: Metadata = {
  title: 'Syrka Campus — The AI Operating System for Universities',
  description: 'Transform every lecture, assignment, project, assessment, and achievement into evidence-backed capability intelligence.',
}

export default function CampusPreviewPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <MotionReveal>
          <Badge tone="neutral">Institutional capability infrastructure</Badge>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <h1 className="mt-6 max-w-3xl font-campus-sans text-campus-4xl font-semibold tracking-tight text-campus-text md:text-campus-5xl">
            The AI operating system for universities
          </h1>
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <p className="mt-6 max-w-2xl font-campus-sans text-campus-lg text-campus-muted">
            Transform every lecture, assignment, project, assessment, and achievement into evidence-backed capability intelligence — for students, faculty, and university administration alike.
          </p>
        </MotionReveal>
        <MotionReveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
          <a href="#cta">
            <Button size="md">Request a demonstration</Button>
          </a>
          <a href="#system">
            <Button size="md" variant="secondary">See how it works</Button>
          </a>
        </MotionReveal>
      </section>

      {/* Problem statement */}
      <section className="border-t border-campus-border bg-campus-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <MotionReveal>
            <p className="font-campus-mono text-campus-xs uppercase tracking-widest text-campus-muted">The problem</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-campus-3xl font-semibold text-campus-text">
              A transcript records grades. It does not record what a student can actually do.
            </h2>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <p className="mt-4 max-w-2xl font-campus-sans text-campus-base text-campus-muted">
              Evidence of real capability — a well-designed project, a verified research contribution, a strong assessment — is scattered across systems and forgotten once a grade is recorded. Students, faculty, and administrators are left reasoning about ability from a single number.
            </p>
          </MotionReveal>
        </div>
      </section>

      {/* System explanation */}
      <section id="system" className="mx-auto max-w-6xl px-6 py-20">
        <MotionReveal>
          <p className="font-campus-mono text-campus-xs uppercase tracking-widest text-campus-muted">How it works</p>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <h2 className="mt-3 max-w-2xl font-campus-sans text-campus-3xl font-semibold text-campus-text">
            Not another LMS. A capability operating system.
          </h2>
        </MotionReveal>
        <div className="mt-10">
          <SystemFlow />
        </div>
      </section>

      {/* Role overview */}
      <section id="roles" className="border-t border-campus-border bg-campus-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <MotionReveal>
            <p className="font-campus-mono text-campus-xs uppercase tracking-widest text-campus-muted">Built for every role</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-campus-3xl font-semibold text-campus-text">
              One system, three vantage points.
            </h2>
          </MotionReveal>
          <div className="mt-10">
            <RoleOverview />
          </div>
        </div>
      </section>

      {/* Trust and governance */}
      <section id="trust" className="mx-auto max-w-6xl px-6 py-20">
        <MotionReveal>
          <p className="font-campus-mono text-campus-xs uppercase tracking-widest text-campus-muted">Trust &amp; governance</p>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <h2 className="mt-3 max-w-2xl font-campus-sans text-campus-3xl font-semibold text-campus-text">
            Capability intelligence you can hold institutions accountable to.
          </h2>
        </MotionReveal>
        <div className="mt-10">
          <TrustSection />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-t border-campus-border bg-campus-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-campus-sans text-campus-3xl font-semibold text-campus-text">Pilot-ready for your institution.</h2>
            <p className="mt-2 max-w-xl font-campus-sans text-campus-base text-campus-muted">
              Designed for universities evaluating an evidence-backed alternative to grade-only academic records.
            </p>
          </div>
          <Link href="/sign-in">
            <Button size="md">Request a demonstration</Button>
          </Link>
        </div>
      </section>
    </>
  )
}
