'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { routeTransition } from '@/lib/motion/campus-motion'

/**
 * Every route inside CampusShell gets the same quick, restrained
 * fade/rise on entry — one shared change instead of each surface
 * inventing its own transition (or having none at all). Reduced-motion
 * collapses to an instant swap.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotionSafe()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={routeTransition(reduceMotion)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
