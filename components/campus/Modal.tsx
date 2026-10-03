'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { campusMotion, overlayTransition } from '@/lib/motion/campus-motion'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  ariaLabel: string
}

/** Highest-elevation surface, reserved for rare destructive or blocking confirmations — not a general-purpose dialog. */
export function Modal({ open, onClose, children, ariaLabel }: ModalProps) {
  const reduceMotion = useReducedMotionSafe()
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      ref.current?.focus()
    } else {
      triggerRef.current?.focus?.()
    }
  }, [open])

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
            animate={{ opacity: campusMotion.opacity.scrim }}
            exit={{ opacity: 0 }}
            transition={overlayTransition(Boolean(reduceMotion))}
            className="fixed inset-0 z-40 bg-campus-ink-950"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={reduceMotion ? { duration: 0 } : campusMotion.spring.snappy}
              className="w-full max-w-md rounded-campus-lg border border-campus-border bg-campus-surface p-6 shadow-campus-panel"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
