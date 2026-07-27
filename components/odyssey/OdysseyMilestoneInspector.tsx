'use client'

import { useState } from 'react'
import { ContextualInspector } from '@/components/campus/ContextualInspector'
import { Tabs } from '@/components/ui/Tabs'
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
 * Odyssey's milestone detail: Overview / Resources / AI Tutor tabs
 * composed inside the shared `ContextualInspector` primitive (side panel
 * desktop, bottom sheet mobile) rather than a bespoke implementation —
 * the first Campus surface to adopt it, per the Stage 1 shared-primitive
 * integration.
 */
export function OdysseyMilestoneInspector({ resolved, resourceById, onClose, isMobile }: OdysseyMilestoneInspectorProps) {
  const { milestone } = resolved
  const [tab, setTab] = useState<'overview' | 'resources' | 'tutor'>('overview')

  return (
    <ContextualInspector eyebrow={MILESTONE_TYPE_LABELS[milestone.type]} title={milestone.title} onClose={onClose} isMobile={isMobile}>
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
    </ContextualInspector>
  )
}
