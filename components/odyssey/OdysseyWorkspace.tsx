'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X } from '@phosphor-icons/react/dist/ssr'
import type { Node, Edge } from '@xyflow/react'
import { Button } from '@/components/ui/Button'
import type { OdysseyPlanVersion, OdysseyInstitutionalResource } from '@/lib/campus-types'
import type { OdysseyNodeData } from '@/lib/utilities/odyssey-projection'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import type { OdysseyGenerationApiResponse } from './odyssey-client-types'
import { OdysseyRoadmapLoader } from './graph/OdysseyRoadmapLoader'
import { OdysseyTextualRoadmap } from './OdysseyTextualRoadmap'
import { OdysseyMobileTree } from './OdysseyMobileTree'
import { OdysseyMilestoneInspector } from './OdysseyMilestoneInspector'
import { OdysseyGenerateForm } from './OdysseyGenerateForm'
import { OdysseyReplanInput } from './OdysseyReplanInput'
import { OdysseyVersionCompare } from './OdysseyVersionCompare'
import { OdysseyCapabilityView } from './OdysseyCapabilityView'
import { OdysseyFutureDirectionsView, type OdysseyFutureDirectionEntry } from './OdysseyFutureDirectionsView'
import { Drawer } from '@/components/campus/Drawer'

type ActivePanel = 'none' | 'generate' | 'replan' | 'compare'
/**
 * Odyssey product correction §6 — "Curriculum" replaces "Roadmap" as the
 * primary/default view label (same graph component underneath; mobile
 * still auto-switches to the vertical tree exactly as before). "Capability"
 * and "Future directions" are new. "List" remains the accessible
 * alternative, now with subject-lane grouping when the plan has it.
 */
type ViewMode = 'curriculum' | 'capability' | 'future' | 'list'

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
  futureDirections: OdysseyFutureDirectionEntry[]
  missingSubjects: string[]
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
  futureDirections,
  missingSubjects,
}: OdysseyWorkspaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>('curriculum')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(searchParams.get('milestone') ?? undefined)
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const [bannerResult, setBannerResult] = useState<OdysseyGenerationApiResponse>()
  const [hideCompleted, setHideCompleted] = useState(false)
  const [focusActive, setFocusActive] = useState(false)

  const [narrowScreen, setNarrowScreen] = useState(false)

  useEffect(() => {
    // Curriculum stays the selected view on mobile — only its rendering
    // switches from the pan/zoom graph to the purpose-built vertical tree
    // (narrowScreen below), never List (that stays an explicit
    // accessibility alternative, not an automatic fallback).
    function checkViewport() {
      setNarrowScreen(window.innerWidth < 768)
      setIsMobile(window.innerWidth < 1024)
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
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3">
        {headerSummary}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setActivePanel(activePanel === 'generate' ? 'none' : 'generate')}>
            {hasCurrentPlan ? 'Adjust plan' : 'Rebuild academic path'}
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
          <div className="inline-flex rounded-campus-sm border border-campus-border" role="group" aria-label="Odyssey view">
            <button
              type="button"
              aria-pressed={viewMode === 'curriculum'}
              onClick={() => setViewMode('curriculum')}
              className={`rounded-l-campus-sm px-3 py-1.5 font-campus-sans text-campus-sm ${viewMode === 'curriculum' ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
            >
              Curriculum
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'capability'}
              onClick={() => setViewMode('capability')}
              className={`px-3 py-1.5 font-campus-sans text-campus-sm ${viewMode === 'capability' ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
            >
              Capability
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'future'}
              onClick={() => setViewMode('future')}
              className={`px-3 py-1.5 font-campus-sans text-campus-sm ${viewMode === 'future' ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'text-campus-text hover:bg-campus-surface-raised'}`}
            >
              Future directions
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
          className={`mx-auto flex w-full max-w-6xl items-start justify-between gap-3 rounded-campus-md border p-3 font-campus-sans text-campus-sm ${
            bannerResult.status === 'success' || bannerResult.status === 'fallback'
              ? 'border-campus-border text-campus-text'
              : 'border-campus-red-600 text-campus-red-600 dark:border-campus-red-dark dark:text-campus-red-dark'
          }`}
        >
          <span>
            {bannerResult.status === 'success' && bannerResult.meta?.generationSource === 'deepseek' && (
              <span className="mr-1.5 font-campus-mono text-[10px] uppercase tracking-wide">AI-generated Odyssey ·</span>
            )}
            {bannerResult.status === 'fallback' && (
              <span className="mr-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Deterministic demonstration plan ·</span>
            )}
            {bannerResult.message}
          </span>
          <button type="button" onClick={() => setBannerResult(undefined)} aria-label="Dismiss message">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <Drawer open={activePanel === 'generate'} onClose={() => setActivePanel('none')} ariaLabel={hasCurrentPlan ? 'Adjust plan' : 'Rebuild academic path'} side="right">
        <OdysseyGenerateForm defaultDestinationTitle={destinationTitle} onResult={setBannerResult} onClose={() => setActivePanel('none')} />
      </Drawer>
      <Drawer open={activePanel === 'replan'} onClose={() => setActivePanel('none')} ariaLabel="Replan" side="right">
        <OdysseyReplanInput onResult={setBannerResult} onClose={() => setActivePanel('none')} />
      </Drawer>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {activePanel === 'compare' && (
          <OdysseyVersionCompare versions={versions} milestoneTitlesByVersion={milestoneTitlesByVersion} onClose={() => setActivePanel('none')} />
        )}
      </div>

      <div className={`grid gap-4 px-0 md:px-4 ${selectedResolved && !isMobile ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-1'}`}>
        <div className="min-w-0">
          {viewMode === 'curriculum' && !narrowScreen && (
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
          )}
          {viewMode === 'curriculum' && narrowScreen && (
            <OdysseyMobileTree nodes={nodes} selectedMilestoneId={selectedMilestoneId} onSelectMilestone={selectMilestone} />
          )}
          {viewMode === 'capability' && <OdysseyCapabilityView orderedResolved={orderedResolved} />}
          {viewMode === 'future' && <OdysseyFutureDirectionsView directions={futureDirections} missingSubjects={missingSubjects} />}
          {viewMode === 'list' && (
            <OdysseyTextualRoadmap orderedResolved={orderedResolved} recommendedNextId={recommendedNextId} onSelectMilestone={selectMilestone} />
          )}
        </div>
        {selectedResolved && !isMobile && (
          <div className="lg:h-[640px]">
            <OdysseyMilestoneInspector resolved={selectedResolved} resourceById={resourceById} onClose={() => selectMilestone(undefined)} />
          </div>
        )}
      </div>

      {selectedResolved && isMobile && (
        <OdysseyMilestoneInspector resolved={selectedResolved} resourceById={resourceById} onClose={() => selectMilestone(undefined)} isMobile />
      )}
    </div>
  )
}
