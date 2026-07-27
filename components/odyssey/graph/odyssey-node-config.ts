import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import {
  Flag,
  Target,
  TrendUp,
  BookOpen,
  Stack,
  Hammer,
  ClipboardText,
  Flask,
  Briefcase,
  ChartBar,
  Certificate,
  FlagCheckered,
  UserCheck,
  Star,
  CircleDashed,
  Circle,
  PlayCircle,
  Hourglass,
  Eye,
  CheckCircle,
  SealCheck,
  PauseCircle,
  XCircle,
  Archive,
  ProhibitInset,
} from '@phosphor-icons/react/dist/ssr'
import type { OdysseyMilestoneType, OdysseyMilestoneStatus } from '@/lib/campus-types'

export interface MilestoneTypeVisual {
  icon: ComponentType<IconProps>
  accentClass: string
}

/** One restrained, recognisable visual treatment per milestone type — never a single generic node design. */
export const MILESTONE_TYPE_VISUALS: Record<OdysseyMilestoneType, MilestoneTypeVisual> = {
  goal: { icon: Flag, accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark' },
  capability_target: { icon: Target, accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark' },
  capability_gap: { icon: TrendUp, accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark' },
  course: { icon: BookOpen, accentClass: 'text-campus-text' },
  module: { icon: Stack, accentClass: 'text-campus-text' },
  project: { icon: Hammer, accentClass: 'text-campus-text' },
  assessment: { icon: ClipboardText, accentClass: 'text-campus-text' },
  research_opportunity: { icon: Flask, accentClass: 'text-campus-text' },
  internship: { icon: Briefcase, accentClass: 'text-campus-text' },
  competition: { icon: ChartBar, accentClass: 'text-campus-text' },
  credential: { icon: Certificate, accentClass: 'text-campus-text' },
  career_milestone: { icon: FlagCheckered, accentClass: 'text-campus-green-600 dark:text-campus-green-dark' },
  human_review: { icon: UserCheck, accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark' },
}

export const MILESTONE_STATUS_BORDER: Record<OdysseyMilestoneStatus, string> = {
  recommended: 'border-campus-blue-600 dark:border-campus-blue-dark',
  accepted: 'border-campus-blue-600 dark:border-campus-blue-dark',
  planned: 'border-campus-border',
  in_progress: 'border-campus-blue-600 dark:border-campus-blue-dark',
  evidence_pending: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed',
  under_review: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed',
  completed: 'border-campus-green-600 dark:border-campus-green-dark',
  verified: 'border-campus-green-600 dark:border-campus-green-dark',
  deferred: 'border-campus-border border-dashed opacity-70',
  blocked: 'border-campus-red-600 dark:border-campus-red-dark border-dashed',
  superseded: 'border-campus-border opacity-50',
  no_longer_relevant: 'border-campus-border opacity-50',
}

export interface MilestoneStatusMarker {
  icon: ComponentType<IconProps>
  /** Compact label for the always-visible corner marker — short enough to fit at roadmap scale. */
  shortLabel: string
  accentClass: string
  /** The roadmap marker dot's border colour — present at every scale, even when the dot isn't filled. */
  markerBorderClass: string
  /** The marker dot's fill when it sits on the trunk (a branch marker stays hollow/bg-surface regardless). */
  markerFillClass: string
}

/**
 * A small, always-present status marker per status — communicates state
 * through icon + short label + colour together, never colour alone.
 */
export const MILESTONE_STATUS_MARKER: Record<OdysseyMilestoneStatus, MilestoneStatusMarker> = {
  recommended: { icon: Star, shortLabel: 'Next', accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark', markerBorderClass: 'border-campus-blue-600 dark:border-campus-blue-dark', markerFillClass: 'bg-campus-blue-600 dark:bg-campus-blue-dark' },
  accepted: { icon: CircleDashed, shortLabel: 'Accepted', accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark', markerBorderClass: 'border-campus-blue-600 dark:border-campus-blue-dark', markerFillClass: 'bg-campus-blue-600 dark:bg-campus-blue-dark' },
  planned: { icon: Circle, shortLabel: 'Planned', accentClass: 'text-campus-muted', markerBorderClass: 'border-campus-border', markerFillClass: 'bg-campus-stone-300 dark:bg-campus-stone-500' },
  in_progress: { icon: PlayCircle, shortLabel: 'In progress', accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark', markerBorderClass: 'border-campus-blue-600 dark:border-campus-blue-dark', markerFillClass: 'bg-campus-blue-600 dark:bg-campus-blue-dark' },
  evidence_pending: { icon: Hourglass, shortLabel: 'Evidence pending', accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark', markerBorderClass: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed', markerFillClass: 'bg-campus-amber-600 dark:bg-campus-amber-dark' },
  under_review: { icon: Eye, shortLabel: 'Under review', accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark', markerBorderClass: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed', markerFillClass: 'bg-campus-amber-600 dark:bg-campus-amber-dark' },
  completed: { icon: CheckCircle, shortLabel: 'Complete', accentClass: 'text-campus-green-600 dark:text-campus-green-dark', markerBorderClass: 'border-campus-green-600 dark:border-campus-green-dark', markerFillClass: 'bg-campus-green-600 dark:bg-campus-green-dark' },
  verified: { icon: SealCheck, shortLabel: 'Verified', accentClass: 'text-campus-green-600 dark:text-campus-green-dark', markerBorderClass: 'border-campus-green-600 dark:border-campus-green-dark', markerFillClass: 'bg-campus-green-600 dark:bg-campus-green-dark' },
  deferred: { icon: PauseCircle, shortLabel: 'Deferred', accentClass: 'text-campus-muted', markerBorderClass: 'border-campus-border border-dashed', markerFillClass: 'bg-campus-stone-300 dark:bg-campus-stone-500' },
  blocked: { icon: XCircle, shortLabel: 'Blocked', accentClass: 'text-campus-red-600 dark:text-campus-red-dark', markerBorderClass: 'border-campus-red-600 dark:border-campus-red-dark border-dashed', markerFillClass: 'bg-campus-red-600 dark:bg-campus-red-dark' },
  superseded: { icon: Archive, shortLabel: 'Superseded', accentClass: 'text-campus-muted', markerBorderClass: 'border-campus-border', markerFillClass: 'bg-campus-stone-300 dark:bg-campus-stone-500' },
  no_longer_relevant: { icon: ProhibitInset, shortLabel: 'Not relevant', accentClass: 'text-campus-muted', markerBorderClass: 'border-campus-border', markerFillClass: 'bg-campus-stone-300 dark:bg-campus-stone-500' },
}
