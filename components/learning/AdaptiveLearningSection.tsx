'use client'

import { useState } from 'react'
import { CheckCircle, Circle, ClockCounterClockwise, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { EvidencePipelineVisual } from '@/components/learning/visualizations/EvidencePipelineVisual'
import { SessionTimelineSequence } from '@/components/learning/visuals/SessionTimelineSequence'
import { formatDate } from '@/lib/utilities/format-relative-time'
import type { AdaptiveChapterView } from '@/lib/utilities/adaptive-learning-projection'

const UNCERTAINTY_TONE: Record<string, 'green' | 'amber' | 'red'> = { low: 'green', moderate: 'amber', high: 'red' }

const MEMORY_KIND_LABEL: Record<string, string> = {
  recurring_issue: 'Recurring issue',
  successful_strategy: 'Successful strategy',
  independence_condition: 'Independence condition',
  retention_condition: 'Retention condition',
  language_accessibility_need: 'Accessibility need',
}

/**
 * The four adaptive-learning regions the brief requires for a
 * representative chapter (IAU-001 / brief §10): a longitudinal
 * development timeline (not three equal cards), a "why Syrka adapted"
 * explanation that is literally the PedagogicalPolicyEngine's own
 * decision object rendered, a "what Syrka remembers" panel showing
 * structured memory (never raw transcript), and the existing Learning
 * Intelligence pipeline extended with an AI-use disclosure.
 */
export function AdaptiveLearningSection({ view, chapterTitle }: { view: AdaptiveChapterView; chapterTitle: string }) {
  const [expandedSession, setExpandedSession] = useState<number>(view.sessions.length)
  const latestSession = view.sessions[view.sessions.length - 1]

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="adaptive-timeline-heading" className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <div className="mb-3 flex items-center gap-1.5">
          <ClockCounterClockwise size={15} className="text-campus-muted" aria-hidden="true" />
          <h3 id="adaptive-timeline-heading" className="font-campus-sans text-campus-base font-medium text-campus-text">
            Development timeline — {view.conceptTitle}
          </h3>
        </div>
        <div className="mb-5">
          <SessionTimelineSequence
            chapterTitle={chapterTitle}
            conceptTitle={view.conceptTitle}
            stages={view.sessions.map((session) => ({
              id: `session-${session.sessionNumber}`,
              label: session.goal,
              date: formatDate(session.startedAt),
              independenceLevel: session.strategyLabel,
              activity: session.activity,
              response: session.studentResponse,
            }))}
          />
        </div>
        <p className="mb-3 font-campus-sans text-campus-xs text-campus-muted">Full session-by-session detail — expand any entry below.</p>
        <ol className="flex flex-col gap-0">
          {view.sessions.map((session, i) => {
            const isExpanded = expandedSession === session.sessionNumber
            const isLast = i === view.sessions.length - 1
            return (
              <li key={session.sessionNumber} className="relative pb-5 pl-7 last:pb-0">
                {!isLast && <span className="absolute left-[9px] top-5 h-full w-px bg-campus-border" aria-hidden="true" />}
                <span className="absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-campus-ink-950 bg-campus-surface dark:border-campus-stone-100" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-campus-ink-950 dark:bg-campus-stone-100" />
                </span>
                <button type="button" onClick={() => setExpandedSession(isExpanded ? 0 : session.sessionNumber)} className="w-full text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                      Session {session.sessionNumber} · {formatDate(session.startedAt)}
                    </span>
                    <Badge tone="neutral">{session.goal}</Badge>
                    <Badge tone="blue">{session.strategyLabel}</Badge>
                  </div>
                  <p className="mt-1 font-campus-sans text-campus-sm font-medium text-campus-text">{session.activity}</p>
                </button>
                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-2 rounded-campus-sm border border-campus-border bg-campus-surface-raised p-3">
                    <div>
                      <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Student response</p>
                      <p className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{session.studentResponse}</p>
                    </div>
                    <div>
                      <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Why Syrka adapted</p>
                      <p className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{session.reason}</p>
                    </div>
                    {session.rejectedAlternatives.length > 0 && (
                      <div>
                        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Alternatives considered and rejected</p>
                        <ul className="mt-0.5 flex flex-col gap-0.5">
                          {session.rejectedAlternatives.slice(0, 3).map((alt) => (
                            <li key={alt.strategyLabel} className="font-campus-sans text-campus-xs text-campus-muted">
                              <span className="text-campus-text">{alt.strategyLabel}</span> — {alt.reasonRejected}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={UNCERTAINTY_TONE[session.uncertainty]}>{session.uncertainty} uncertainty</Badge>
                      <span className="font-campus-mono text-[10px] text-campus-muted">Expected next signal: {session.expectedNextSignal}</span>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="memory-heading" className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkle size={15} className="text-campus-muted" aria-hidden="true" />
          <h3 id="memory-heading" className="font-campus-sans text-campus-base font-medium text-campus-text">
            What Syrka remembers
          </h3>
        </div>
        <p className="mb-3 font-campus-sans text-campus-xs text-campus-muted">
          Structured summaries only — never a raw Tutor conversation. Each entry shows what is remembered, why, and when it was last updated.
        </p>
        <ul className="flex flex-col gap-2">
          {view.memory.map((entry) => (
            <li key={entry.id} className="rounded-campus-sm border border-campus-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="neutral">{MEMORY_KIND_LABEL[entry.kind] ?? entry.kind}</Badge>
                <span className="font-campus-mono text-[10px] text-campus-muted">Updated {formatDate(entry.lastUpdatedAt)}</span>
              </div>
              <p className="mt-1.5 font-campus-sans text-campus-sm text-campus-text">{entry.summary}</p>
              <p className="mt-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                Provenance: {entry.provenance.replace(/_/g, ' ')} {entry.facultyConfirmed ? '· Faculty-confirmed' : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="learning-intelligence-heading" className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <h3 id="learning-intelligence-heading" className="mb-3 font-campus-sans text-campus-base font-medium text-campus-text">
          Learning Intelligence
        </h3>
        <EvidencePipelineVisual stages={view.evidencePipeline} />
      </section>

      <section aria-labelledby="ai-use-heading" className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <h3 id="ai-use-heading" className="mb-3 font-campus-sans text-campus-base font-medium text-campus-text">
          AI-use disclosure — {latestSession.activity ? 'Session 3 transfer task' : ''}
        </h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Tool and purpose</dt>
            <dd className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{view.aiUse.toolUsed} — {view.aiUse.declaredPurpose}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Verification performed</dt>
            <dd className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{view.aiUse.verification}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Errors found</dt>
            <dd className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{view.aiUse.detectedError}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Independent defence</dt>
            <dd className="mt-0.5 font-campus-sans text-campus-xs text-campus-text">{view.aiUse.independentDefence}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center gap-2 border-t border-campus-border pt-3">
          {view.aiUse.judgement === 'independent_orchestration' ? (
            <CheckCircle size={15} weight="fill" className="text-campus-green-600 dark:text-campus-green-dark" aria-hidden="true" />
          ) : (
            <Circle size={15} className="text-campus-muted" aria-hidden="true" />
          )}
          <Badge tone={view.aiUse.judgement === 'independent_orchestration' ? 'green' : 'neutral'}>{view.aiUse.judgement.replace(/_/g, ' ')}</Badge>
          <span className="font-campus-mono text-[10px] text-campus-muted">Faculty-reviewed — {view.aiUse.facultyNote}</span>
        </div>
      </section>
    </div>
  )
}
