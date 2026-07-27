'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '@phosphor-icons/react/dist/ssr'
import type { Node, Edge } from '@xyflow/react'
import { Button } from '@/components/ui/Button'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { panelTransition } from '@/lib/motion/campus-motion'
import type { OdysseyPlanVersion, OdysseyInstitutionalResource } from '@/lib/campus-types'
import type { OdysseyNodeData } from '@/lib/utilities/odyssey-projection'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import type { OdysseyGenerationApiResponse } from './odyssey-client-types'
import { OdysseyRoadmapLoader } from './graph/OdysseyRoadmapLoader'
import { OdysseyTextualRoadmap } from './OdysseyTextualRoadmap'
import { OdysseyMilestoneInspector } from './OdysseyMilestoneInspector'
import { OdysseyGenerateForm } from './OdysseyGenerateForm'
import { OdysseyReplanInput } from './OdysseyReplanInput'
import { OdysseyVersionCompare } from './OdysseyVersionCompare'

type ActivePanel = 'none' | 'generate' | 'replan' | 'compare'

export interface OdysseyWorkspaceProps {
  headerSummary: ReactNode
  hasCurrentPlan: boolean
  destinationTitle: string
  nodes: Node<OdysseyNodeData>[]
  edges: Edge[]
  orderedResolved: ResolvedOdysseyMilestone[]
  recommendedNextId?: string
  versions: OdysseyPlanVersion[]
  milestoneTitlesByVersion: Record<string, Record<string, string>>
  institutionalResources: OdysseyInstitutionalResource[]
}

/**
 * The primary Odyssey surface: header summary + action controls, the
 * dominant roadmap workspace (graph with an inspector, or the textual
 * alternative), and the generate/replan/compare panels. The selected
 * milestone is synced to `?milestone=` so the inspector state is linkable
 * and refresh-safe. Owns only view state — everything else is
 * server-fetched and passed in as props.
 */
export function OdysseyWorkspace({
  headerSummary,
  hasCurrentPlan,
  destinationTitle,
  nodes,
  edges,
  orderedResolved,
  recommendedNextId,
  versions,
  milestoneTitlesByVersion,
  institutionalResources,
}: OdysseyWorkspaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotionSafe()

  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(searchParams.get('milestone') ?? undefined)
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const [bannerResult, setBannerResult] = useState<OdysseyGenerationApiResponse>()
  const [hideCompleted, setHideCompleted] = useState(false)
  const [focusActive, setFocusActive] = useState(false)

  useEffect(() => {
    function checkViewport() {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setViewMode((v) => (v === 'graph' && window.innerWidth < 640 ? 'list' : v))
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const resourceById = useMemo(() => new Map(institutionalResources.map((r) => [r.id, r])), [institutionalResources])

  const selectMilestone = useCallback(
    (milestoneId: string | undefined) => {
      setSelectedMilestoneId(milestoneId)
      const params = new URLSearchParams(searchParams.toString())
      if (milestoneId) params.set('milestone', milestoneId)
      else params.delete('milestone')
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const selectedResolved = orderedResolved.find((r) => r.milestone.id === selectedMilestoneId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {headerSummary}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setActivePanel(activePanel === 'generate' ? 'none' : 'generate')}>
            {hasCurrentPlan ? 'Change destination' : 'Generate Odyssey'}
          </Button>
          {hasCurrentPlan && (
            <Button size="sm" variant="secondary" onClick={() => setActivePanel(activePanel === 'replan' ? 'none' : 'replan')}>
              Replan
            </Button>
          )}
          {versions.length > 1 && (
            <Button size="sm" variant="secondary" onClick={() => setActivePanel(activePanel === 'compare' ? 'none' : 'compare')}>
              Compare versions
            </Button>
          )}
          <div className="inline-flex rounded-campus-sm border border-campus-border" role="group" aria-label="Roadmap view">
            <button
              type="button"
              aria-pressed={viewMode === 'graph'}
              onClick={() => setViewMode('graph')}
              className={`rounded-l-campus-sm px-3 py-1.5 font-campus-sans text-campus-sm ${viewMode === 'graph' ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
            >
              Roadmap
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`rounded-r-campus-sm px-3 py-1.5 font-campus-sans text-campus-sm ${viewMode === 'list' ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {bannerResult && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-campus-md border p-3 font-campus-sans text-campus-sm ${
            bannerResult.status === 'success'
              ? 'border-campus-green-600 text-campus-green-600 dark:border-campus-green-dark dark:text-campus-green-dark'
              : bannerResult.status === 'fallback'
                ? 'border-campus-amber-600 text-campus-amber-600 dark:border-campus-amber-dark dark:text-campus-amber-dark'
                : 'border-campus-red-600 text-campus-red-600 dark:border-campus-red-dark dark:text-campus-red-dark'
          }`}
        >
          <span>
            {bannerResult.status === 'success' && bannerResult.meta?.generationSource === 'deepseek' && (
              <span className="mr-1.5 font-campus-mono text-[10px] uppercase tracking-wide">AI-generated Odyssey ·</span>
            )}
            {bannerResult.message}
          </span>
          <button type="button" onClick={() => setBannerResult(undefined)} aria-label="Dismiss message">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {activePanel === 'generate' && (
        <OdysseyGenerateForm defaultDestinationTitle={destinationTitle} onResult={setBannerResult} onClose={() => setActivePanel('none')} />
      )}
      {activePanel === 'replan' && <OdysseyReplanInput onResult={setBannerResult} onClose={() => setActivePanel('none')} />}
      {activePanel === 'compare' && (
        <OdysseyVersionCompare versions={versions} milestoneTitlesByVersion={milestoneTitlesByVersion} onClose={() => setActivePanel('none')} />
      )}

      <div className={`grid gap-4 ${selectedResolved && !isMobile ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-1'}`}>
        <div className="min-w-0">
          {viewMode === 'graph' ? (
            <OdysseyRoadmapLoader
              nodes={nodes}
              edges={edges}
              selectedMilestoneId={selectedMilestoneId}
              onSelectMilestone={selectMilestone}
              hideCompleted={hideCompleted}
              focusActive={focusActive}
              onToggleHideCompleted={() => setHideCompleted((v) => !v)}
              onToggleFocusActive={() => setFocusActive((v) => !v)}
            />
          ) : (
            <OdysseyTextualRoadmap orderedResolved={orderedResolved} recommendedNextId={recommendedNextId} onSelectMilestone={selectMilestone} />
          )}
        </div>
        {selectedResolved && !isMobile && (
          <motion.div
            key={selectedResolved.milestone.id}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={panelTransition(Boolean(reduceMotion))}
            className="lg:h-[640px]"
          >
            <OdysseyMilestoneInspector resolved={selectedResolved} resourceById={resourceById} onClose={() => selectMilestone(undefined)} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedResolved && isMobile && (
          <OdysseyMilestoneInspector resolved={selectedResolved} resourceById={resourceById} onClose={() => selectMilestone(undefined)} isMobile />
        )}
      </AnimatePresence>
    </div>
  )
}
