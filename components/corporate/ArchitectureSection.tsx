'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { CapabilityFlowDiagram } from './CapabilityFlowDiagram'

const LAYERS = [
  { title: 'Evidence provenance', copy: 'Coursework, projects, and assessments enter the graph as timestamped, attributable Evidence — never asserted, always traceable.' },
  { title: 'Capability inference', copy: 'Evidence accumulates into a Capability claim with a maturity level and a calibrated confidence band, reviewed by the institution.' },
  { title: 'Odyssey direction', copy: 'Confirmed Capability, declared intent, and institutional opportunity shape a directed sequence of milestones and Evidence requirements.' },
  { title: 'Career Passport disclosure', copy: 'Selected, reviewed claims become a portable record — carried by the individual, disclosed only under their own configuration.' },
  { title: 'Praxis matching', copy: 'Disclosed Capability records connect to roles, projects, and teams — matched against real demand, not self-reported skill.' },
  { title: 'Maxima aggregation', copy: 'Permissioned, appropriately aggregated institutional signals form a national Capability graph — no individual record exposed without governance.' },
]

/**
 * The shared-architecture section: a sticky diagram with scroll-driven
 * explanatory text passing alongside it. Only the layer currently being
 * explained is emphasized; earlier layers stay visible but subdued so the
 * architecture reads as one continuous system, ending on the complete graph.
 */
export function ArchitectureSection() {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduceMotion) return
    const blocks = Array.from(containerRef.current?.querySelectorAll('[data-layer-index]') ?? [])
    if (blocks.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const closest = visible.reduce((a, b) => (Math.abs(a.intersectionRatio - 1) < Math.abs(b.intersectionRatio - 1) ? a : b))
        const idx = Number((closest.target as HTMLElement).dataset.layerIndex)
        setActiveIndex(idx)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.5, 1] }
    )
    blocks.forEach((b) => observer.observe(b))
    return () => observer.disconnect()
  }, [reduceMotion])

  return (
    <section id="architecture" className="border-t border-syrka-hairline bg-syrka-obsidian px-6 py-24 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <MotionReveal>
          <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel">Shared architecture</p>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <h2 className="mt-3 font-campus-sans text-[clamp(28px,5vw,56px)] font-semibold tracking-tight text-syrka-offwhite">One Human Capability Graph.</h2>
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <p className="mt-6 max-w-2xl font-campus-sans text-campus-base text-syrka-steel">
            Every Syrka product operates on a common understanding of Capability, Evidence, intent, opportunity, and demand.
          </p>
        </MotionReveal>

        <div ref={containerRef} className="mt-16 grid gap-10 md:grid-cols-2">
          <div className={reduceMotion ? '' : 'md:sticky md:top-24 md:h-fit'}>
            <CapabilityFlowDiagram variant="architecture" activeIndex={reduceMotion ? undefined : activeIndex} />
            <p className="mt-10 max-w-lg font-campus-sans text-campus-sm text-syrka-steel">
              Individual Evidence and Capability records stay owner-governed. Praxis and Maxima operate only on aggregated, permissioned, and disclosure-controlled data — never raw individual records without explicit authorization.
            </p>
          </div>

          <div className="flex flex-col">
            {LAYERS.map((layer, i) => (
              <div key={layer.title} data-layer-index={i} className={reduceMotion ? 'py-6' : 'flex min-h-[60vh] flex-col justify-center py-6'}>
                <MotionReveal>
                  <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-signal">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 font-campus-sans text-campus-xl font-semibold text-syrka-offwhite">{layer.title}</h3>
                  <p className="mt-3 max-w-md font-campus-sans text-campus-sm text-syrka-steel">{layer.copy}</p>
                </MotionReveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
