'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { overlayTransition, campusMotion } from '@/lib/motion/campus-motion'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  ariaLabel: string
  /** 'left' for navigation drawers, 'right' for supporting-panel drawers. */
  side?: 'left' | 'right'
}

/** Edge-anchored surface for mobile navigation and secondary forms — focus-trapped while open, restores focus to the trigger on close. */
export function Drawer({ open, onClose, children, ariaLabel, side = 'left' }: DrawerProps) {
  const reduceMotion = useReducedMotionSafe()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus()
    } else {
      triggerRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const offscreenX = side === 'left' ? -campusMotion.distance.panelOffset * 10 : campusMotion.distance.panelOffset * 10

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
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={reduceMotion ? { duration: 0 } : campusMotion.spring.panel}
            className={`fixed top-0 z-50 h-full w-[min(320px,85vw)] bg-campus-surface shadow-campus-panel ${side === 'left' ? 'left-0' : 'right-0'}`}
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-campus-sm p-2 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
