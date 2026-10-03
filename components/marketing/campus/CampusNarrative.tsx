'use client'

import { ScrollStageSequence } from '@/components/corporate/ScrollStageSequence'
import { CampusSystemVisual, type CampusSystemVisualProps } from './CampusSystemVisual'

const STAGES: { eyebrow: string; title: string; description: string }[] = [
  {
    eyebrow: '01',
    title: 'Everything becomes Evidence.',
    description: 'A lecture, an assignment, a project, an assessment — each becomes a timestamped, source-traceable Evidence record the moment it happens.',
  },
  {
    eyebrow: '02',
    title: 'Evidence becomes Capability.',
    description: 'Evidence accumulates into a Capability state with an explainable maturity level and a calibrated confidence band — never a single opaque score.',
  },
  {
    eyebrow: '03',
    title: 'Capability becomes direction, through Odyssey.',
    description: 'Confirmed capability shapes a personal roadmap — what to do next, and why it genuinely moves the student forward.',
  },
  {
    eyebrow: '04',
    title: 'Capability becomes portable, through the Career Passport.',
    description: 'Verified capability claims are issued as a versioned, institution-backed credential the student actually owns and can share.',
  },
  {
    eyebrow: '05',
    title: 'Institutions see their aggregate capability condition.',
    description: 'Faculty, Department, and University leadership see the same underlying data at the level of aggregation their role actually needs.',
  },
]

/**
 * The scroll narrative: one sticky product stage whose copy and visual
 * change as the visitor scrolls, replacing the previous ordinary stack of
 * bordered sections. Falls back to a plain stacked sequence under reduced
 * motion or on narrow viewports — ScrollStageSequence handles that split.
 */
export function CampusNarrative() {
  return (
    <section id="narrative" className="border-b border-campus-border bg-campus-bg px-6 py-20 md:px-10 md:py-0">
      <div className="mx-auto max-w-[1400px] md:hidden">
        <p className="mb-8 font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">How it works</p>
      </div>
      <ScrollStageSequence
        stageCount={STAGES.length}
        vhPerStage={90}
        stageIds={STAGES.map((_, i) => `narrative-stage-${i}`)}
        fallback={(i) => (
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <CampusSystemVisual stage={i as CampusSystemVisualProps['stage']} className="h-auto w-full max-w-[320px]" />
            <NarrativeStageContent index={i} />
          </div>
        )}
      >
        {(activeIndex) => (
          <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 md:grid-cols-2 md:px-10">
            <NarrativeStageContent index={activeIndex} />
            <div className="flex items-center justify-center">
              <CampusSystemVisual stage={activeIndex as CampusSystemVisualProps['stage']} className="h-auto w-full max-w-[440px]" />
            </div>
          </div>
        )}
      </ScrollStageSequence>
    </section>
  )
}

function NarrativeStageContent({ index }: { index: number }) {
  const stage = STAGES[index]
  return (
    <div>
      <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">{stage.eyebrow}</p>
      <h3 className="mt-3 max-w-md font-campus-sans text-[clamp(24px,3.5vw,36px)] font-semibold leading-tight tracking-tight text-campus-text">{stage.title}</h3>
      <p className="mt-4 max-w-md font-campus-sans text-campus-base text-campus-muted">{stage.description}</p>
    </div>
  )
}
