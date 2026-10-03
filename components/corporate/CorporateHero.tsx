'use client'

import { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { CapabilityFlowDiagram } from './CapabilityFlowDiagram'
import { EnvironmentalArchitectureType } from './hero/EnvironmentalArchitectureType'

/**
 * The opening scroll sequence. Scrolling through the hero's extra height
 * progressively reveals the Human Capability Graph while the headline
 * stays pinned and dominant — then the page continues naturally into the
 * capability-lifecycle sequence. Reduced motion renders the same content
 * at natural height with the graph already fully drawn (no pinning).
 */
export function CorporateHero() {
  const reduceMotion = useReducedMotionSafe()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const environmentalOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.55])

  const content = (
    <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 md:px-10">
      <MotionReveal delay={0.05}>
        <h1 className="mt-5 max-w-4xl font-campus-sans text-[clamp(40px,7vw,88px)] font-semibold leading-[0.98] tracking-tight text-syrka-offwhite">
          The Operating System for Human Capability.
        </h1>
      </MotionReveal>
      <MotionReveal delay={0.12}>
        <p className="mt-8 max-w-2xl font-campus-sans text-campus-lg text-syrka-steel">
          Syrka connects how capability is developed, directed, proven, put to work, and coordinated — across individuals, institutions, employers, and nations.
        </p>
      </MotionReveal>
      <MotionReveal delay={0.18} className="mt-10 flex flex-wrap gap-4">
        <a href="#software" className="border border-syrka-offwhite px-5 py-3 font-campus-sans text-campus-sm font-medium text-syrka-offwhite hover:bg-syrka-offwhite hover:text-syrka-obsidian">
          Explore our software
        </a>
        <a href="#closing" className="border border-syrka-signal bg-syrka-signal px-5 py-3 font-campus-sans text-campus-sm font-medium text-syrka-white hover:opacity-90">
          Deploy Syrka
        </a>
      </MotionReveal>
      <div className="mt-16 md:mt-20">
        <CapabilityFlowDiagram variant="hero" scrollProgress={reduceMotion ? undefined : scrollYProgress} />
      </div>
    </div>
  )

  // The scroll-target ref must stay mounted even under reduced motion —
  // useScroll throws "Target ref is defined but not hydrated" if its target
  // never renders — so both branches render the same section, and only the
  // pinning/height styles and scroll indicator differ.
  return (
    <section
      ref={ref}
      className={reduceMotion ? 'relative border-b border-syrka-hairline py-24' : 'relative border-b border-syrka-hairline'}
      style={reduceMotion ? undefined : { height: '180vh' }}
    >
      <div
        className={
          reduceMotion
            ? 'relative flex min-h-screen flex-col justify-center overflow-hidden py-24'
            : 'sticky top-0 flex h-screen flex-col justify-center overflow-hidden py-24'
        }
      >
        {reduceMotion ? (
          <EnvironmentalArchitectureType />
        ) : (
          <motion.div style={{ opacity: environmentalOpacity }}>
            <EnvironmentalArchitectureType />
          </motion.div>
        )}
        {content}
        {!reduceMotion && (
          <motion.div
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Scroll to explore</span>
            <CaretDown size={14} className="text-syrka-steel" aria-hidden="true" />
          </motion.div>
        )}
      </div>
    </section>
  )
}
