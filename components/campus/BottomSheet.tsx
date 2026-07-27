'use client'

import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { panelTransition } from '@/lib/motion/campus-motion'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  ariaLabel: string
}

/** Mobile edge-anchored surface — the low-level primitive behind ContextualInspector's mobile mode and reusable anywhere a drawer-from-below is needed. */
export function BottomSheet({ open, onClose, children, ariaLabel }: BottomSheetProps) {
  const reduceMotion = useReducedMotionSafe()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-40 bg-campus-ink-950/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={panelTransition(Boolean(reduceMotion))}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-campus-lg border-t border-campus-border bg-campus-surface shadow-campus-panel"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-campus-border" aria-hidden="true" />
            <div className="max-h-[calc(85vh-1rem)] overflow-y-auto p-2">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
