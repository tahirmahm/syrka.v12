import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

export interface LearningOdysseyAlignmentProps {
  lessonTitle: string
  capabilityName: string
  milestoneId: string
  milestoneTitle: string
}

/**
 * Answers "how does this affect my pathway?" — an explicit, explainable
 * chain from the active lesson to one Odyssey milestone, never a
 * deterministic promise: completing the lesson supports the capability;
 * it does not guarantee the milestone completes.
 */
export function LearningOdysseyAlignment({ lessonTitle, capabilityName, milestoneId, milestoneTitle }: LearningOdysseyAlignmentProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-campus-sans text-campus-sm text-campus-text">
        <span className="rounded-campus-sm border border-campus-border px-2 py-1">{lessonTitle}</span>
        <ArrowRight size={13} className="text-campus-muted" aria-hidden="true" />
        <span className="rounded-campus-sm border border-campus-border px-2 py-1">{capabilityName}</span>
        <ArrowRight size={13} className="text-campus-muted" aria-hidden="true" />
        <Link
          href={`/student/odyssey?milestone=${milestoneId}`}
          className="rounded-campus-sm border border-campus-blue-600 px-2 py-1 text-campus-blue-600 hover:bg-campus-blue-600/5 dark:border-campus-blue-dark dark:text-campus-blue-dark"
        >
          {milestoneTitle}
        </Link>
      </div>
      <p className="font-campus-sans text-campus-xs text-campus-muted">
        Progress here would support this Capability once reviewed — it projects toward the milestone, it does not complete it automatically.
      </p>
    </div>
  )
}
