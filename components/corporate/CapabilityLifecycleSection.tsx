'use client'

import { ScrollStageSequence } from './ScrollStageSequence'

const STAGES = [
  { statement: 'Capability developed.', product: 'Syrka Campus' },
  { statement: 'Capability directed.', product: 'Syrka Odyssey' },
  { statement: 'Capability proven and carried.', product: 'Syrka Career Passport' },
  { statement: 'Capability put to work.', product: 'Syrka Praxis' },
  { statement: 'Capability coordinated nationally.', product: 'Syrka Maxima' },
]

/**
 * The capability lifecycle as a scroll-linked pinned sequence: one
 * statement advances at a time, prior statements stay faintly visible so
 * the sequence reads as one continuous system rather than five unrelated
 * cards. Culminates naturally into the following "Our Software" section.
 */
export function CapabilityLifecycleSection() {
  return (
    <section className="border-b border-syrka-hairline bg-syrka-carbon">
      <ScrollStageSequence
        stageCount={STAGES.length}
        vhPerStage={80}
        fallback={(i) => (
          <div className="px-6 py-8 md:px-10">
            <p className="font-campus-sans text-[clamp(22px,4vw,36px)] font-semibold leading-tight tracking-tight text-syrka-offwhite">{STAGES[i].statement}</p>
            <p className="mt-2 font-campus-mono text-[11px] uppercase tracking-widest text-syrka-signal">{STAGES[i].product}</p>
          </div>
        )}
      >
        {(activeIndex) => (
          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10">
            <div className="flex flex-col gap-4">
              {STAGES.map((stage, i) => {
                const isActive = i === activeIndex
                const isPast = i < activeIndex
                return (
                  <div key={stage.statement} className="transition-opacity duration-300" style={{ opacity: isActive ? 1 : isPast ? 0.3 : 0.15 }}>
                    <p
                      className="font-campus-sans font-semibold tracking-tight text-syrka-offwhite transition-all duration-300"
                      style={{ fontSize: isActive ? 'clamp(28px,5vw,52px)' : 'clamp(16px,2vw,22px)' }}
                    >
                      {stage.statement}
                    </p>
                    {isActive && <p className="mt-2 font-campus-mono text-[11px] uppercase tracking-widest text-syrka-signal">{stage.product}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </ScrollStageSequence>
    </section>
  )
}
