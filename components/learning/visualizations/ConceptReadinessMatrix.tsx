import { CircleDashed, HandPointing, PersonSimpleWalk, ArrowsLeftRight, FileText, SealCheck } from '@phosphor-icons/react/dist/ssr'
import type { ConceptReadiness, ConceptReadinessState } from '@/lib/utilities/learning-projection'

const STATE_CONFIG: Record<ConceptReadinessState, { label: string; icon: typeof CircleDashed; accentClass: string }> = {
  not_attempted: { label: 'Not attempted', icon: CircleDashed, accentClass: 'text-campus-muted' },
  guided: { label: 'Guided', icon: HandPointing, accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark' },
  partially_independent: { label: 'Partially independent', icon: PersonSimpleWalk, accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark' },
  independently_demonstrated: { label: 'Independently demonstrated', icon: PersonSimpleWalk, accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark' },
  transfer_demonstrated: { label: 'Transfer demonstrated', icon: ArrowsLeftRight, accentClass: 'text-campus-blue-600 dark:text-campus-blue-dark' },
  evidence_candidate: { label: 'Evidence candidate', icon: FileText, accentClass: 'text-campus-purple-600 dark:text-campus-purple-dark' },
  reviewed_evidence: { label: 'Reviewed Evidence', icon: SealCheck, accentClass: 'text-campus-green-600 dark:text-campus-green-dark' },
}

export interface ConceptReadinessMatrixProps {
  concepts: ConceptReadiness[]
}

/**
 * Answers "what can I now do independently, per concept?" — never a single
 * blended mastery score. Every row's state and source trace to one real
 * seeded record (ConceptReadiness.source), shown as the row's caption, not
 * hidden behind a tooltip only.
 */
export function ConceptReadinessMatrix({ concepts }: ConceptReadinessMatrixProps) {
  if (concepts.length === 0) {
    return <p className="font-campus-sans text-campus-sm text-campus-muted">No concepts recorded for this lesson yet.</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {concepts.map((concept) => {
          const config = STATE_CONFIG[concept.state]
          const Icon = config.icon
          return (
            <li key={concept.conceptId} className="flex items-start gap-3 rounded-campus-sm border border-campus-border px-3 py-2.5">
              <Icon size={16} weight="fill" className={`mt-0.5 shrink-0 ${config.accentClass}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{concept.title}</p>
                  <p className={`font-campus-mono text-[10px] uppercase tracking-wide ${config.accentClass}`}>{config.label}</p>
                </div>
                <p className="mt-0.5 font-campus-sans text-campus-xs text-campus-muted">{concept.source}</p>
              </div>
            </li>
          )
        })}
      </ul>
      {/* Accessible text equivalent — a screen reader announces the same state+source without relying on icon shape or colour. */}
      <p className="sr-only">
        Concept readiness: {concepts.map((c) => `${c.title}: ${STATE_CONFIG[c.state].label}. ${c.source}`).join(' ')}
      </p>
    </div>
  )
}

export { STATE_CONFIG as CONCEPT_STATE_CONFIG }
