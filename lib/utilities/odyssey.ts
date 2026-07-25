import type { OdysseyMilestone } from '@/lib/campus-types'

const ACTIONABLE_STATUSES: OdysseyMilestone['status'][] = ['recommended', 'accepted', 'planned', 'in_progress', 'evidence_pending', 'under_review']

/** The milestone that most deserves the student's attention right now, if any. */
export function getActiveMilestone(milestones: OdysseyMilestone[]): OdysseyMilestone | undefined {
  const completedIds = new Set(milestones.filter((m) => m.status === 'completed' || m.status === 'verified').map((m) => m.id))
  return milestones.find(
    (m) => ACTIONABLE_STATUSES.includes(m.status) && m.prerequisiteMilestoneIds.every((id) => completedIds.has(id))
  )
}
