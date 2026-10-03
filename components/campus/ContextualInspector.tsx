'use client'

import { motion } from 'framer-motion'
import { X } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { panelTransition } from '@/lib/motion/campus-motion'
import { BottomSheet } from './BottomSheet'

export interface ContextualInspectorProps {
  eyebrow?: string
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Renders as a mobile bottom sheet instead of a desktop side panel. */
  isMobile?: boolean
}

/**
 * The standard "detail on selection" mechanism for Campus — desktop side
 * panel, mobile bottom sheet, same content either way. First proven in
 * Odyssey's milestone inspector, which now composes this shared primitive
 * rather than its own bespoke implementation.
 */
export function ContextualInspector({ eyebrow, title, onClose, children, isMobile }: ContextualInspectorProps) {
  const reduceMotion = useReducedMotionSafe()

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div>
        {eyebrow && <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{eyebrow}</p>}
        <h3 className="mt-0.5 font-campus-sans text-campus-base font-semibold text-campus-text">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close detail"
        className="shrink-0 rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )

  const content = (
    <div className="flex h-full flex-col overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-4" aria-label={`Detail for ${title}`}>
      {header}
      {children}
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open onClose={onClose} ariaLabel={`Detail for ${title}`}>
        {content}
      </BottomSheet>
    )
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={panelTransition(Boolean(reduceMotion))}
      className="h-full"
    >
      {content}
    </motion.div>
  )
}
