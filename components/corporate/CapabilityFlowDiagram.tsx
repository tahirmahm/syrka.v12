'use client'

import { motion, useReducedMotion } from 'framer-motion'

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
}

/**
 * The original Syrka Human Capability Graph visual — Evidence through
 * Maxima as connected nodes. Used in both the hero (compact) and the
 * shared-architecture section (with detail labels) so the two never
 * visually contradict each other. Plain SVG/CSS — no image assets.
 */
export function CapabilityFlowDiagram({ variant = 'hero', className = '' }: CapabilityFlowDiagramProps) {
  const reduceMotion = useReducedMotion()
  const showDetail = variant === 'architecture'

  return (
    <div className={`w-full overflow-x-auto ${className}`} role="img" aria-label="Evidence flows into Capability, which directs Odyssey, is carried by the Career Passport, is put to work through Praxis, and is coordinated nationally through Maxima.">
      <div className="flex min-w-[720px] items-center justify-between gap-1 px-2">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex flex-1 items-center">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-1 flex-col items-center gap-2 text-center"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-syrka-signal' : 'bg-syrka-steel'}`} aria-hidden="true" />
              <span className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-offwhite">{stage.label}</span>
              {showDetail && <span className="max-w-[9rem] font-campus-sans text-[11px] text-syrka-steel">{stage.detail}</span>}
            </motion.div>
            {i < STAGES.length - 1 && (
              <motion.div
                initial={reduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.08 + 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ transformOrigin: 'left' }}
                className="mx-1 h-px flex-1 bg-syrka-hairline md:w-10"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      {showDetail && (
        <div className="mt-6 flex min-w-[720px] items-center justify-between px-2 font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">
          <span>Individual capability record</span>
          <span className="text-syrka-signal">Governed aggregation boundary</span>
          <span>National capability intelligence</span>
        </div>
      )}
    </div>
  )
}
