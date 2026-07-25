import type { OdysseyMilestone } from '@/lib/campus-types'

const ACTIONABLE_STATUSES: OdysseyMilestone['status'][] = ['available', 'in_progress', 'awaiting_review', 'awaiting_evidence']

/** The milestone that most deserves the student's attention right now, if any. */
export function getActiveMilestone(milestones: OdysseyMilestone[]): OdysseyMilestone | undefined {
  return [...milestones]
    .filter((m) => ACTIONABLE_STATUSES.includes(m.status))
    .sort((a, b) => a.order - b.order)[0]
}
