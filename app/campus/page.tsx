import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { CampusHero } from '@/components/marketing/campus/CampusHero'
import { CampusNarrative } from '@/components/marketing/campus/CampusNarrative'
import { CampusOdysseyPreview } from '@/components/marketing/campus/CampusOdysseyPreview'
import { CampusPassportPreview } from '@/components/marketing/campus/CampusPassportPreview'
import { CampusLearningPreview } from '@/components/marketing/campus/CampusLearningPreview'
import { CampusInstitutionalLens } from '@/components/marketing/campus/CampusInstitutionalLens'
import { SankeyFlowVisual } from '@/components/visualizations/SankeyFlowVisual'

export const metadata: Metadata = {
  title: 'Syrka Campus — The AI Operating System for Universities',
  description: 'A living operating environment that understands how capability develops across an institution — Evidence, Capability, Odyssey, the Career Passport, and institutional intelligence in one system.',
}

export default function CampusPreviewPage() {
  return (
    <>
      <CampusHero />

      <CampusNarrative />

      {/* Odyssey */}
      <section id="odyssey" className="border-b border-campus-border px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">Odyssey</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-[clamp(26px,4vw,40px)] font-semibold tracking-tight text-campus-text">
              A roadmap that reasons from real capability, not a checklist.
            </h2>
          </MotionReveal>
          <MotionReveal delay={0.1} className="mt-10">
            <CampusOdysseyPreview />
          </MotionReveal>
        </div>
      </section>

      {/* Career Passport */}
      <section id="passport" className="border-b border-campus-border bg-campus-surface px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div>
            <MotionReveal>
              <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">Syrka Career Passport</p>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <h2 className="mt-3 max-w-lg font-campus-sans text-[clamp(26px,4vw,40px)] font-semibold tracking-tight text-campus-text">
                Verified capability, carried as a real credential.
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="mt-5 max-w-md font-campus-sans text-campus-base text-campus-muted">
                Institutionally reviewed capability claims, versioned history, and disclosure the student controls — issued as a credential a student actually owns, with a genuinely scannable verification QR.
              </p>
            </MotionReveal>
          </div>
          <MotionReveal delay={0.1} className="flex justify-center">
            <CampusPassportPreview />
          </MotionReveal>
        </div>
      </section>

      {/* Learning */}
      <section id="learning" className="border-b border-campus-border px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">Learning Intelligence</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-[clamp(26px,4vw,40px)] font-semibold tracking-tight text-campus-text">
              Syrka does not just host content — it observes capability forming.
            </h2>
          </MotionReveal>
          <MotionReveal delay={0.1} className="mt-10">
            <CampusLearningPreview />
          </MotionReveal>
        </div>
      </section>

      {/* Institutional intelligence */}
      <section id="institutional" className="border-b border-campus-border bg-campus-surface px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">Institutional intelligence</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-[clamp(26px,4vw,40px)] font-semibold tracking-tight text-campus-text">
              One capability model. Three vantage points.
            </h2>
          </MotionReveal>
          <MotionReveal delay={0.1} className="mt-10">
            <CampusInstitutionalLens />
          </MotionReveal>
          <MotionReveal delay={0.15} className="mt-14 border-t border-campus-border pt-10">
            <SankeyFlowVisual
              dataCaption="Illustrative institutional flow — demonstration data, not a live aggregate"
              nodes={[
                { id: 'evidence', label: 'Evidence', column: 0 },
                { id: 'capability', label: 'Capability', column: 1 },
                { id: 'odyssey', label: 'Odyssey', column: 2 },
                { id: 'passport', label: 'Career Passport', column: 3 },
                { id: 'unresolved', label: 'Under review', column: 3 },
              ]}
              links={[
                { from: 'evidence', to: 'capability', value: 100 },
                { from: 'capability', to: 'odyssey', value: 78 },
                { from: 'capability', to: 'unresolved', value: 22 },
                { from: 'odyssey', to: 'passport', value: 64 },
              ]}
            />
          </MotionReveal>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-campus-ink-950 px-6 py-20 text-campus-white md:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-campus-sans text-[clamp(26px,4vw,40px)] font-semibold tracking-tight text-campus-white">Pilot-ready for your institution.</h2>
            <p className="mt-2 max-w-xl font-campus-sans text-campus-base text-campus-white/70">
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
