import Link from 'next/link'
import { Warning, TrendUp, ArrowClockwise, ChatCircleDots } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { InterventionActions } from '@/components/faculty/InterventionActions'
import { getNcertSubjects } from '@/lib/utilities/ncert-curriculum-projection'
import { listInterventionQueue, type InterventionPriorityReason } from '@/lib/utilities/faculty-adaptive-projection'

export const metadata = { title: 'Interventions — Syrka Campus' }

const REASON_ICON: Record<InterventionPriorityReason, typeof Warning> = {
  faculty_escalation_flagged: Warning,
  failed_transfer: ArrowClockwise,
  heavy_scaffolding_dependence: TrendUp,
  repeated_misconception: ChatCircleDots,
}

const REASON_LABEL: Record<InterventionPriorityReason, string> = {
  faculty_escalation_flagged: 'Flagged for Faculty escalation',
  failed_transfer: 'Failed independent transfer',
  heavy_scaffolding_dependence: 'Heavy scaffolding dependence',
  repeated_misconception: 'Recorded misconception',
}

/**
 * Every item here is deterministically derived from the same adaptive-
 * learning fixtures the Student and Faculty curriculum views read — the
 * AI recommends a priority ordering; Faculty decide what to do with it.
 * No item here can silently resolve itself.
 */
export default function FacultyInterventionsPage() {
  const items = listInterventionQueue()
  const subjects = getNcertSubjects()
  const spaceIdByChapterId = new Map(subjects.flatMap((s) => s.chapters.map((c) => [c.chapterId, s.spaceId] as const)))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Interventions"
        subtitle="A prioritised, explainable queue derived from real adaptive-learning signals — repeated failure, heavy scaffolding, failed transfer, and Faculty-escalation flags."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Interventions' }]} />}
      />

      {items.length === 0 ? (
        <EmptyState title="No interventions queued" description="No adaptive-learning signal currently warrants Faculty attention." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = REASON_ICON[item.reason]
            const spaceId = spaceIdByChapterId.get(item.chapterId)
            return (
              <div key={item.id} className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={item.priority === 'high' ? 'text-campus-red-600 dark:text-campus-red-dark' : 'text-campus-amber-600 dark:text-campus-amber-dark'} aria-hidden="true" />
                    <Badge tone={item.priority === 'high' ? 'red' : 'amber'}>{item.priority} priority</Badge>
                    <Badge tone="neutral">{REASON_LABEL[item.reason]}</Badge>
                  </div>
                  {spaceId && (
                    <Link href={`/faculty/curriculum/${spaceId}/${item.chapterId}`} className="font-campus-sans text-campus-xs text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                      Inspect chapter →
                    </Link>
                  )}
                </div>
                <p className="mt-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                  {item.subject} — {item.conceptTitle}
                </p>
                <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{item.reasonExplanation}</p>
                <InterventionActions />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
