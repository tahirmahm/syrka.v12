'use client'

import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { OdysseyRecommendationFactor, OdysseyAlternativeAction } from '@/lib/campus-types'
import { REASONING_FACTOR_LABELS } from '@/lib/constants/odyssey'

export interface OdysseyReasoningPanelProps {
  planSummary: string
  factors: OdysseyRecommendationFactor[]
  alternatives: (OdysseyAlternativeAction & { milestoneTitle: string })[]
}

export function OdysseyReasoningPanel({ planSummary, factors, alternatives }: OdysseyReasoningPanelProps) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotionSafe()
  const contentId = useId()

  return (
    <Panel className="p-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <span className="font-campus-sans text-campus-base font-medium text-campus-text">Why this path?</span>
        <CaretDown size={16} className={`text-campus-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-campus-border p-5">
              <p className="font-campus-sans text-campus-sm text-campus-text">{planSummary}</p>
              <p className="font-campus-sans text-campus-xs uppercase tracking-wide text-campus-muted">
                Odyssey is a recommendation and progression system, not an infallible authority. Every factor below is inspectable.
              </p>

              <ul className="flex flex-col gap-3">
                {factors.map((factor) => (
                  <li key={factor.id} className="flex items-start gap-3">
                    <Badge tone={factor.type === 'uncertainty' ? 'amber' : 'neutral'} className="mt-0.5 shrink-0">
                      {REASONING_FACTOR_LABELS[factor.type]}
                    </Badge>
                    <p className="font-campus-sans text-campus-sm text-campus-text">{factor.summary}</p>
                  </li>
                ))}
              </ul>

              {alternatives.length > 0 && (
                <div className="border-t border-campus-border pt-4">
                  <p className="mb-2 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Alternative routes</p>
                  <ul className="flex flex-col gap-3">
                    {alternatives.map((alt) => (
                      <li key={alt.id}>
                        <p className="font-campus-sans text-campus-sm font-medium text-campus-text">
                          {alt.title} <span className="font-normal text-campus-muted">— instead of {alt.milestoneTitle}</span>
                        </p>
                        <p className="font-campus-sans text-campus-xs text-campus-muted">{alt.description}</p>
                        <p className="mt-0.5 font-campus-sans text-campus-xs text-campus-muted">Trade-off: {alt.tradeoff}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}
