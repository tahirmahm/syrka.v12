'use client'

import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

const PRODUCTS = [
  { name: 'Campus', offset: -60 },
  { name: 'Odyssey', offset: 40 },
  { name: 'Career Passport', offset: -30 },
  { name: 'Praxis', offset: 50 },
  { name: 'Maxima', offset: -45 },
]

/**
 * The five product names resolve into a single aligned row as the closing
 * section enters view — separate systems becoming one architecture. Purely
 * decorative, laid out in normal flow above the real CTAs so it never
 * overlaps or interferes with clicking them.
 */
export function ClosingConvergence() {
  const reduceMotion = useReducedMotionSafe()

  return (
    <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2" aria-hidden="true">
      {PRODUCTS.map((product, i) => (
        <motion.span
          key={product.name}
          initial={reduceMotion ? false : { x: product.offset, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel"
        >
          {product.name}
        </motion.span>
      ))}
    </div>
  )
}
