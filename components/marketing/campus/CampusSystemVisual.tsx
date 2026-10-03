'use client'

import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

export interface CampusSystemVisualProps {
  /** Which part of the system is emphasised — the narrative sequence advances this 0→4 as the visitor scrolls; the hero always shows the fully-formed state (4). */
  stage: 0 | 1 | 2 | 3 | 4
  className?: string
}

const EVIDENCE_SOURCES = [
  { label: 'Lecture', y: 40 },
  { label: 'Assignment', y: 100 },
  { label: 'Project', y: 160 },
]

const AGGREGATE_DOTS = Array.from({ length: 18 }, (_, i) => ({
  x: 40 + (i % 6) * 22,
  y: 300 + Math.floor(i / 6) * 20,
}))

/**
 * The living institutional-capability system: Evidence sources converge on
 * one Capability node, which then extends toward Odyssey (a directed path)
 * and the Career Passport (a verifying seal), with institutional aggregates
 * forming quietly behind. Entrance-animated once (never looping) — motion
 * exists only to explain the sequence, not to decorate it. Reduced motion
 * renders the end state immediately.
 */
export function CampusSystemVisual({ stage, className = '' }: CampusSystemVisualProps) {
  const reduceMotion = useReducedMotionSafe()
  const evidenceVisible = stage >= 0
  const capabilityVisible = stage >= 1
  const odysseyVisible = stage >= 2
  const passportVisible = stage >= 3
  const aggregateVisible = stage >= 4

  const dur = (seconds: number) => (reduceMotion ? 0 : seconds)

  return (
    <svg viewBox="0 0 520 400" role="img" aria-label="A diagram showing evidence converging into capability, which extends toward a personal roadmap and a verified credential, with institutional aggregates forming in the background" className={className}>
      {/* Institutional aggregate — faint, background, forms last */}
      {AGGREGATE_DOTS.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={2.5}
          className="fill-campus-muted"
          initial={reduceMotion ? { opacity: aggregateVisible ? 0.35 : 0 } : { opacity: 0 }}
          animate={{ opacity: aggregateVisible ? 0.35 : 0 }}
          transition={{ duration: dur(0.5), delay: reduceMotion ? 0 : i * 0.02 }}
        />
      ))}

      {/* Evidence sources */}
      {EVIDENCE_SOURCES.map((source, i) => (
        <g key={source.label}>
          <motion.circle
            cx={40}
            cy={source.y}
            r={5}
            className="fill-campus-blue-600 dark:fill-campus-blue-dark"
            initial={reduceMotion ? { opacity: evidenceVisible ? 1 : 0 } : { opacity: 0, x: -12 }}
            animate={evidenceVisible ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ duration: dur(0.4), delay: reduceMotion ? 0 : i * 0.1 }}
          />
          <motion.text
            x={54}
            y={source.y + 4}
            className="fill-campus-muted font-campus-mono text-[10px] uppercase tracking-wide"
            initial={reduceMotion ? { opacity: evidenceVisible ? 1 : 0 } : { opacity: 0 }}
            animate={{ opacity: evidenceVisible ? 1 : 0 }}
            transition={{ duration: dur(0.4), delay: reduceMotion ? 0 : i * 0.1 + 0.1 }}
          >
            {source.label}
          </motion.text>
          <motion.line
            x1={46}
            y1={source.y}
            x2={150}
            y2={100}
            className="stroke-campus-border"
            strokeWidth={1}
            initial={reduceMotion ? { pathLength: capabilityVisible ? 1 : 0 } : { pathLength: 0 }}
            animate={{ pathLength: capabilityVisible ? 1 : 0 }}
            transition={{ duration: dur(0.6), delay: reduceMotion ? 0 : 0.3 + i * 0.05 }}
          />
        </g>
      ))}

      {/* Capability node */}
      <motion.circle
        cx={150}
        cy={100}
        r={16}
        className="fill-campus-ink-950 dark:fill-campus-white"
        initial={reduceMotion ? { scale: capabilityVisible ? 1 : 0 } : { scale: 0 }}
        animate={{ scale: capabilityVisible ? 1 : 0 }}
        transition={{ duration: dur(0.4), delay: reduceMotion ? 0 : 0.5, type: 'spring', stiffness: 200, damping: 16 }}
        style={{ transformOrigin: '150px 100px' }}
      />
      <motion.text
        x={150}
        y={130}
        textAnchor="middle"
        className="fill-campus-text font-campus-mono text-[10px] uppercase tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: capabilityVisible ? 1 : 0 }}
        transition={{ duration: dur(0.3), delay: reduceMotion ? 0 : 0.7 }}
      >
        Capability
      </motion.text>

      {/* Path to Odyssey */}
      <motion.path
        d="M 166 90 C 250 60, 320 55, 400 60"
        fill="none"
        className="stroke-campus-green-600 dark:stroke-campus-green-dark"
        strokeWidth={2}
        initial={reduceMotion ? { pathLength: odysseyVisible ? 1 : 0 } : { pathLength: 0 }}
        animate={{ pathLength: odysseyVisible ? 1 : 0 }}
        transition={{ duration: dur(0.7), delay: reduceMotion ? 0 : 0.9 }}
      />
      {[220, 300, 400].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={x === 220 ? 70 : x === 300 ? 57 : 60}
          r={i === 2 ? 6 : 4}
          className={i === 2 ? 'fill-campus-green-600 dark:fill-campus-green-dark' : 'fill-campus-surface stroke-campus-green-600 dark:stroke-campus-green-dark'}
          strokeWidth={i === 2 ? 0 : 1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: odysseyVisible ? 1 : 0 }}
          transition={{ duration: dur(0.3), delay: reduceMotion ? 0 : 1.1 + i * 0.1 }}
        />
      ))}
      <motion.text
        x={400}
        y={44}
        textAnchor="middle"
        className="fill-campus-green-600 dark:fill-campus-green-dark font-campus-mono text-[10px] uppercase tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: odysseyVisible ? 1 : 0 }}
        transition={{ duration: dur(0.3), delay: reduceMotion ? 0 : 1.3 }}
      >
        Odyssey
      </motion.text>

      {/* Path to Career Passport */}
      <motion.path
        d="M 160 116 C 220 180, 300 210, 380 220"
        fill="none"
        className="stroke-campus-gold-500"
        strokeWidth={2}
        initial={reduceMotion ? { pathLength: passportVisible ? 1 : 0 } : { pathLength: 0 }}
        animate={{ pathLength: passportVisible ? 1 : 0 }}
        transition={{ duration: dur(0.7), delay: reduceMotion ? 0 : 1.0 }}
      />
      <motion.g
        initial={reduceMotion ? { scale: passportVisible ? 1 : 0 } : { scale: 0 }}
        animate={{ scale: passportVisible ? 1 : 0 }}
        transition={{ duration: dur(0.4), delay: reduceMotion ? 0 : 1.6, type: 'spring', stiffness: 220, damping: 14 }}
        style={{ transformOrigin: '392px 220px' }}
      >
        <circle cx={392} cy={220} r={14} className="fill-campus-gold-500" />
        <path d="M 386 220 L 390 224 L 398 214" stroke="white" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      <motion.text
        x={392}
        y={246}
        textAnchor="middle"
        className="fill-campus-gold-500 font-campus-mono text-[10px] uppercase tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: passportVisible ? 1 : 0 }}
        transition={{ duration: dur(0.3), delay: reduceMotion ? 0 : 1.8 }}
      >
        Career Passport
      </motion.text>
    </svg>
  )
}
