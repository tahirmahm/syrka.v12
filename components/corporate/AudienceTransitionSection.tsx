'use client'

import { ScrollStageSequence } from './ScrollStageSequence'

const STAGES = [
  { eyebrow: 'Academia', headline: 'Develop capability with Evidence.', scale: 'Individual → cohort → university', rings: 1 },
  { eyebrow: 'Employers', headline: 'Put proven capability to work.', scale: 'University → workforce', rings: 2 },
  { eyebrow: 'Government', headline: 'Coordinate national capability.', scale: 'Workforce → national graph', rings: 3 },
]

/** Concentric rings expand per stage — an analytical scale cue, never a map, flag, or crest. */
function ScaleVisual({ rings }: { rings: number }) {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center md:h-56 md:w-56">
      {[1, 2, 3].map((r) => (
        <span
          key={r}
          className="absolute rounded-full border transition-all duration-500"
          style={{
            width: `${r * 33}%`,
            height: `${r * 33}%`,
            borderColor: r <= rings ? 'var(--syrka-ring-active, #2864FF)' : '#34363A',
            opacity: r <= rings ? 1 : 0.3,
          }}
        />
      ))}
      <span className="h-2 w-2 rounded-full bg-syrka-signal" aria-hidden="true" />
    </div>
  )
}

/**
 * Note on anchors: because the pinned desktop view only ever has one
 * stage's content mounted at a time, this section exposes a single
 * `#domains` landing anchor (on the wrapping section) for corporate-nav
 * links rather than three separate mid-sequence ids — a small, deliberate
 * simplification that avoids duplicate ids between the always-present
 * mobile fallback and the desktop pinned copy.
 */
export function AudienceTransitionSection() {
  return (
    <section id="domains" className="border-t border-syrka-hairline bg-syrka-obsidian">
      <ScrollStageSequence
        stageCount={STAGES.length}
        vhPerStage={90}
        fallback={(i) => (
          <div className="flex flex-col items-center gap-6 px-6 py-16 text-center md:px-10">
            <ScaleVisual rings={STAGES[i].rings} />
            <div>
              <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-signal">{STAGES[i].eyebrow}</p>
              <h3 className="mt-2 font-campus-sans text-campus-2xl font-semibold text-syrka-offwhite">{STAGES[i].headline}</h3>
              <p className="mt-2 font-campus-mono text-[11px] text-syrka-steel">{STAGES[i].scale}</p>
            </div>
          </div>
        )}
      >
        {(activeIndex) => {
          const stage = STAGES[activeIndex]
          return (
            <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-10 px-6 text-center md:flex-row md:justify-between md:px-10 md:text-left">
              <div>
                <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-signal">{stage.eyebrow}</p>
                <h3 className="mt-3 font-campus-sans text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-syrka-offwhite">{stage.headline}</h3>
                <p className="mt-3 font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel">{stage.scale}</p>
              </div>
              <ScaleVisual rings={stage.rings} />
            </div>
          )
        }}
      </ScrollStageSequence>
    </section>
  )
}
