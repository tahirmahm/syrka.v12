import type { Metadata } from 'next'
import Link from 'next/link'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { CorporateHero } from '@/components/corporate/CorporateHero'
import { CapabilityLifecycleSection } from '@/components/corporate/CapabilityLifecycleSection'
import { ProductChapter } from '@/components/corporate/ProductChapter'
import { ProductDetailList } from '@/components/corporate/ProductDetailList'
import { SoftwareIndexNav } from '@/components/corporate/SoftwareIndexNav'
import { ArchitectureSection } from '@/components/corporate/ArchitectureSection'
import { AudienceTransitionSection } from '@/components/corporate/AudienceTransitionSection'
import { ClosingConvergence } from '@/components/corporate/ClosingConvergence'
import { SyrkaWordmark } from '@/components/corporate/SyrkaWordmark'

export const metadata: Metadata = {
  title: 'Syrka — The Operating System for Human Capability',
  description:
    'Syrka connects how capability is developed, directed, proven, put to work, and coordinated — across individuals, institutions, employers, and nations.',
}

const TRUST_PRINCIPLES = [
  'Evidence provenance is traceable to its source, not asserted.',
  'Institutional review governs when Evidence strengthens a claim.',
  'Every capability claim is explainable, never a black-box score.',
  'Capability records are versioned — history is never overwritten.',
  'Access is purpose-bound and governed by explicit permissions.',
  'Disclosure is configured by the record’s owner, not the platform.',
  'Praxis and Maxima operate on governed aggregation, not raw individual data.',
  'AI recommends and drafts; institutional and human authority decides.',
]

export default function SyrkaCorporateHomePage() {
  return (
    <>
      <CorporateHero />

      <CapabilityLifecycleSection />

      {/* Our Software header */}
      <section id="software" className="border-b border-syrka-hairline bg-syrka-obsidian px-6 py-24 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel">Our Software</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 font-campus-sans text-[clamp(28px,5vw,56px)] font-semibold tracking-tight text-syrka-offwhite">One architecture. Five systems.</h2>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <p className="mt-6 max-w-2xl font-campus-sans text-campus-base text-syrka-steel">
              From the first piece of academic Evidence to national capability strategy, Syrka creates a continuous operational understanding of what people can do, what they should do next, and where that capability is needed.
            </p>
          </MotionReveal>
        </div>
      </section>

      {/* Five product chapters, tracked by the sticky software index */}
      <div className="relative">
        <SoftwareIndexNav />

        <ProductChapter
          id="campus"
          index={1}
          eyebrow="Academia"
          tagline="Capability developed."
          name="Syrka Campus"
          descriptor="The Capability Operating System for Academia."
          description="Develop, evidence, understand, and strengthen capability across every learner, course, department, and institution."
          audience="Academia"
          dark={false}
          technicalPhrase="Evidence becomes Capability."
          cta={{ label: 'Explore Campus', href: '/campus' }}
        >
          <ProductDetailList
            dark={false}
            title="Currently operational"
            items={['Evidence timeline and capability claims', 'Odyssey progression roadmap', 'Academic Passport issuance', 'Faculty review workflows']}
          />
        </ProductChapter>

        <ProductChapter
          id="odyssey"
          index={2}
          eyebrow="Individuals and institutions"
          tagline="Capability directed."
          name="Syrka Odyssey"
          description="Adaptive, evidence-backed pathways that move each person from their present capability state towards an academic, professional, or personal destination."
          audience="Individuals and institutions"
          dark={true}
          technicalPhrase="Capability becomes direction."
          cta={{ label: 'Part of Syrka Campus', href: '/campus' }}
        >
          <ProductDetailList
            dark={true}
            title="Reasons from"
            items={['Current Capability state', 'Verified Evidence', 'Declared intent', 'Available institutional opportunities', 'Constraints', 'Required target capabilities']}
          />
        </ProductChapter>

        <ProductChapter
          id="passport"
          index={3}
          eyebrow="Individuals, institutions, and employers"
          tagline="Capability proven and carried."
          name="Syrka Career Passport"
          descriptor="Inside Syrka Campus, this is expressed today as the Academic Passport — the academia-facing instance of the same architecture, not a separate domain model."
          description="A living, evidence-backed record of what a person can do, why it can be trusted, and how that capability develops over time."
          audience="Individuals, institutions, and employers"
          dark={false}
          technicalPhrase="Direction becomes proof."
          cta={{ label: 'See the Academic Passport', href: '/campus' }}
        >
          <ProductDetailList
            dark={false}
            title="What it carries"
            items={['Verified capability claims', 'Institutional review provenance', 'Version history, not a single score', 'Disclosure controls the owner configures']}
          />
        </ProductChapter>

        <ProductChapter
          id="praxis"
          index={4}
          eyebrow="Employers"
          tagline="Capability put to work."
          name="Syrka Praxis"
          description="Connect verified human capability to roles, projects, teams, and real workforce demand."
          audience="Employers"
          dark={true}
          technicalPhrase="Proof becomes deployment."
          status="In development — not yet deployed"
        >
          <ProductDetailList
            dark={true}
            title="Conceptual architecture"
            items={['Role and project capability requirements', 'Matching against verified, not self-reported, capability', 'Team-level capability composition', 'Real workforce demand signals']}
          />
        </ProductChapter>

        <ProductChapter
          id="maxima"
          index={5}
          eyebrow="Government"
          tagline="Capability coordinated nationally."
          name="Syrka Maxima"
          description="Transform institutional capability data into a living national capability graph for education, workforce, industrial, and economic coordination."
          audience="Government"
          dark={false}
          technicalPhrase="Deployment becomes coordination."
          status="In development — not yet deployed"
        >
          <ProductDetailList
            dark={false}
            title="Conceptual architecture"
            items={['Aggregated, permissioned institutional data', 'Education-to-workforce capability flow', 'Industrial and economic coordination signals', 'No individual-level data exposed without governance']}
          />
        </ProductChapter>
      </div>

      <ArchitectureSection />

      <AudienceTransitionSection />

      {/* Trust & governance */}
      <section id="trust" className="border-t border-syrka-hairline bg-syrka-carbon px-6 py-24 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal>
            <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel">Trust &amp; governance</p>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <h2 className="mt-3 max-w-2xl font-campus-sans text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-syrka-offwhite">
              Capability intelligence requires institutional trust.
            </h2>
          </MotionReveal>
          <div className="mt-14 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {TRUST_PRINCIPLES.map((principle, i) => (
              <MotionReveal key={principle} delay={i * 0.04} className="flex items-start gap-3 border-t border-syrka-hairline pt-4">
                <span className="font-campus-mono text-[11px] text-syrka-signal">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-campus-sans text-campus-sm text-syrka-offwhite">{principle}</p>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section id="closing" className="border-t border-syrka-hairline bg-syrka-obsidian px-6 py-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <MotionReveal className="mb-8">
            <SyrkaWordmark width={210} className="w-[210px] h-auto" />
          </MotionReveal>
          <ClosingConvergence />
          <MotionReveal>
            <h2 className="max-w-3xl font-campus-sans text-[clamp(32px,6vw,64px)] font-semibold leading-[1.02] tracking-tight text-syrka-offwhite">
              Build the capability your future requires.
            </h2>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <p className="mt-6 max-w-xl font-campus-sans text-campus-base text-syrka-steel">
              Deploy a shared capability architecture across learning, progression, credentials, work, and national strategy.
            </p>
          </MotionReveal>
          <MotionReveal delay={0.14} className="mt-10 flex flex-wrap gap-4">
            <Link href="/sign-in" className="border border-syrka-signal bg-syrka-signal px-5 py-3 font-campus-sans text-campus-sm font-medium text-syrka-white hover:opacity-90">
              Deploy Syrka
            </Link>
            <Link href="/campus" className="border border-syrka-offwhite px-5 py-3 font-campus-sans text-campus-sm font-medium text-syrka-offwhite hover:bg-syrka-offwhite hover:text-syrka-obsidian">
              Enter Syrka Campus
            </Link>
          </MotionReveal>
        </div>
      </section>
    </>
  )
}
