'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { confirmationTransition } from '@/lib/motion/campus-motion'

export type ConfirmationTone = 'success' | 'warning' | 'error'

const TONE_ICON = { success: CheckCircle, warning: WarningCircle, error: XCircle } as const
const TONE_CLASS = {
  success: 'border-campus-green-600 text-campus-green-600 dark:border-campus-green-dark dark:text-campus-green-dark',
  warning: 'border-campus-amber-600 text-campus-amber-600 dark:border-campus-amber-dark dark:text-campus-amber-dark',
  error: 'border-campus-red-600 text-campus-red-600 dark:border-campus-red-dark dark:text-campus-red-dark',
} as const

export interface ConfirmationSurfaceProps {
  open: boolean
  tone: ConfirmationTone
  message: string
  onDismiss: () => void
  /** Auto-dismiss after this many ms — omit to require manual dismissal (recommended for errors). */
  autoDismissMs?: number
}

/**
 * Brief, non-blocking feedback for a local mutation succeeding, warning, or
 * failing — a save, a decision, a submission. Not for AI/agent activity
 * (use SyrkaIntelligenceState) and not for ordinary loading states.
 */
export function ConfirmationSurface({ open, tone, message, onDismiss, autoDismissMs }: ConfirmationSurfaceProps) {
  const reduceMotion = useReducedMotionSafe()
  const Icon = TONE_ICON[tone]

  useEffect(() => {
    if (!open || !autoDismissMs) return
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [open, autoDismissMs, onDismiss])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={confirmationTransition(Boolean(reduceMotion))}
          className={`flex items-start gap-2 rounded-campus-md border bg-campus-surface p-3 font-campus-sans text-campus-sm shadow-campus-subtle ${TONE_CLASS[tone]}`}
        >
          <Icon size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="flex-1 text-campus-text">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted hover:text-campus-text"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
