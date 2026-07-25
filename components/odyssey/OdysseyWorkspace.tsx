'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react/dist/ssr'
import type { Node, Edge } from '@xyflow/react'
import { Button } from '@/components/ui/Button'
import type { OdysseyPlanVersion } from '@/lib/campus-types'
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
}

/**
 * The primary Odyssey surface: header summary + action controls, the
 * dominant roadmap workspace (graph with an inspector, or the textual
 * alternative), and the generate/replan/compare panels. Owns only view
 * state (selection, active panel, last result banner) — everything else is
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
}: OdysseyWorkspaceProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>()
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const [bannerResult, setBannerResult] = useState<OdysseyGenerationApiResponse>()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setViewMode('list')
  }, [])

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
              Graph
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

      {viewMode === 'graph' ? (
        <div className={`grid gap-4 ${selectedResolved ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'lg:grid-cols-1'}`}>
          <OdysseyRoadmapLoader nodes={nodes} edges={edges} selectedMilestoneId={selectedMilestoneId} onSelectMilestone={setSelectedMilestoneId} />
          {selectedResolved && (
            <div className="lg:h-[640px]">
              <OdysseyMilestoneInspector resolved={selectedResolved} onClose={() => setSelectedMilestoneId(undefined)} />
            </div>
          )}
        </div>
      ) : (
        <OdysseyTextualRoadmap orderedResolved={orderedResolved} recommendedNextId={recommendedNextId} />
      )}
    </div>
  )
}
