'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface MotionRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * Fade + slight rise on scroll into view. Purely a content-arrival cue for
 * the marketing site (DESIGN-001 §11); never used in the internal app shell.
 * Fully inert under prefers-reduced-motion.
 */
export function MotionReveal({ children, delay = 0, className }: MotionRevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
