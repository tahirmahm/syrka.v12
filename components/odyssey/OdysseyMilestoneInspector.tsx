'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '@phosphor-icons/react/dist/ssr'
import { Tabs } from '@/components/ui/Tabs'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { panelTransition } from '@/lib/motion/campus-motion'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import type { OdysseyInstitutionalResource } from '@/lib/campus-types'
import { MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'
import { OdysseyMilestoneOverviewTab } from './OdysseyMilestoneOverviewTab'
import { OdysseyMilestoneResourcesTab } from './OdysseyMilestoneResourcesTab'
import { OdysseyMilestoneTutorTab } from './OdysseyMilestoneTutorTab'

export interface OdysseyMilestoneInspectorProps {
  resolved: ResolvedOdysseyMilestone
  resourceById: Map<string, OdysseyInstitutionalResource>
  onClose: () => void
  /** True on narrow viewports — renders as a bottom sheet instead of a side panel. */
  isMobile?: boolean
}

/**
 * The contextual inspector: header (type, title, close) + Overview /
 * Resources / AI Tutor tabs. Desktop renders as a fixed-width side panel;
 * mobile renders the same component as a bottom sheet (see isMobile).
 */
export function OdysseyMilestoneInspector({ resolved, resourceById, onClose, isMobile }: OdysseyMilestoneInspectorProps) {
  const { milestone } = resolved
  const [tab, setTab] = useState<'overview' | 'resources' | 'tutor'>('overview')
  const reduceMotion = useReducedMotionSafe()

  const content = (
    <div className="flex h-full flex-col overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-4" aria-label={`Detail for ${milestone.title}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
          <h3 className="mt-0.5 font-campus-sans text-campus-base font-semibold text-campus-text">{milestone.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close milestone detail"
          className="shrink-0 rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3">
        <Tabs
          ariaLabel={`${milestone.title} detail`}
          activeId={tab}
          onChange={(id) => setTab(id as typeof tab)}
          items={[
            { id: 'overview', label: 'Overview', content: <OdysseyMilestoneOverviewTab resolved={resolved} /> },
            { id: 'resources', label: 'Resources', content: <OdysseyMilestoneResourcesTab resolved={resolved} resourceById={resourceById} /> },
            { id: 'tutor', label: 'AI Tutor', content: <OdysseyMilestoneTutorTab milestoneId={milestone.id} milestoneTitle={milestone.title} /> },
          ]}
        />
      </div>
    </div>
  )

  if (!isMobile) return content

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={panelTransition(Boolean(reduceMotion))}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-campus-lg border-t border-campus-border bg-campus-surface shadow-campus-md"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-campus-border" aria-hidden="true" />
        <div className="max-h-[calc(85vh-1rem)] overflow-y-auto p-2">{content}</div>
      </motion.div>
    </AnimatePresence>
  )
}
