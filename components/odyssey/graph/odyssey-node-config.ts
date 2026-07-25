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
