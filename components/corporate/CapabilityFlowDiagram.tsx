'use client'

import { useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

const STAGES = [
  { id: 'evidence', label: 'Evidence', detail: 'Coursework, projects, assessments' },
  { id: 'capability', label: 'Capability', detail: 'Maturity + confidence' },
  { id: 'odyssey', label: 'Odyssey', detail: 'Directed progression' },
  { id: 'passport', label: 'Career Passport', detail: 'Proven, carried' },
  { id: 'praxis', label: 'Praxis', detail: 'Matched to work' },
  { id: 'maxima', label: 'Maxima', detail: 'National coordination' },
] as const

export interface CapabilityFlowDiagramProps {
  variant?: 'hero' | 'architecture'
  className?: string
  /** When provided (a 0-1 scroll progress motion value), nodes reveal in step with scroll instead of on viewport-enter. */
  scrollProgress?: MotionValue<number>
  /** When provided, this node is emphasized (architecture section, driven by which explanatory text block is in view). */
  activeIndex?: number
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/**
 * The original Syrka Human Capability Graph visual — Evidence through
 * Maxima as connected nodes. Used in the hero (scroll-linked reveal), the
 * shared-architecture section (active-node emphasis), and elsewhere as a
 * plain viewport-triggered reveal. Plain SVG/CSS — no image assets.
 */
export function CapabilityFlowDiagram({ variant = 'hero', className = '', scrollProgress, activeIndex }: CapabilityFlowDiagramProps) {
  const reduceMotion = useReducedMotionSafe()
  const showDetail = variant === 'architecture'
  const [revealProgress, setRevealProgress] = useState(scrollProgress ? 0 : 1)
  const fallbackProgress = useMotionValue(0)

  useMotionValueEvent(scrollProgress ?? fallbackProgress, 'change', (v: number) => {
    setRevealProgress(v)
  })

  const nodeState = (i: number) => {
    if (reduceMotion || !scrollProgress) return { opacity: 1, scale: 1 }
    const start = i / STAGES.length
    const t = clamp01((revealProgress - start) / 0.18)
    return { opacity: 0.15 + t * 0.85, scale: 0.92 + t * 0.08 }
  }

  const lineState = (i: number) => {
    if (reduceMotion || !scrollProgress) return 1
    const start = (i + 0.5) / STAGES.length
    return clamp01((revealProgress - start) / 0.15)
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`} role="img" aria-label="Evidence flows into Capability, which directs Odyssey, is carried by the Career Passport, is put to work through Praxis, and is coordinated nationally through Maxima.">
      <div className={`flex items-center justify-between gap-1 px-2 ${showDetail ? 'min-w-[560px]' : 'min-w-[720px]'}`}>
        {STAGES.map((stage, i) => {
          const state = nodeState(i)
          const isActive = activeIndex === i
          return (
            <div key={stage.id} className="flex flex-1 items-center">
              {scrollProgress ? (
                <div style={{ opacity: state.opacity, transform: `scale(${state.scale})` }} className="flex flex-1 flex-col items-center gap-2 text-center transition-transform duration-100">
                  <span className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-syrka-signal' : 'bg-syrka-steel'}`} aria-hidden="true" />
                  <span className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-offwhite">{stage.label}</span>
                  {showDetail && <span className="max-w-[9rem] font-campus-sans text-[11px] text-syrka-steel">{stage.detail}</span>}
                </div>
              ) : (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-none text-center ${isActive ? 'scale-110' : ''} transition-transform duration-300`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${isActive || (activeIndex === undefined && i === 0) ? 'bg-syrka-signal' : 'bg-syrka-steel'}`}
                    aria-hidden="true"
                  />
                  <span className={`font-campus-mono text-[11px] uppercase tracking-widest ${isActive ? 'text-syrka-offwhite' : 'text-syrka-offwhite/70'}`}>{stage.label}</span>
                  {showDetail && <span className="max-w-[9rem] font-campus-sans text-[11px] text-syrka-steel">{stage.detail}</span>}
                </motion.div>
              )}
              {i < STAGES.length - 1 && (
                <div
                  style={scrollProgress ? { transform: `scaleX(${lineState(i)})`, transformOrigin: 'left' } : undefined}
                  className="mx-1 h-px flex-1 bg-syrka-hairline md:w-10"
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
      {showDetail && (
        <div className="mt-6 flex min-w-[560px] items-center justify-between px-2 font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">
          <span>Individual capability record</span>
          <span className="text-syrka-signal">Governed aggregation boundary</span>
          <span>National capability intelligence</span>
        </div>
      )}
    </div>
  )
}
