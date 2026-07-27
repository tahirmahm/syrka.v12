'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowClockwise, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { AIActivityIndicator } from '@/components/motion/AIActivityIndicator'
import { useTutorConversation, type TutorSuggestedAction } from '@/components/tutor/useTutorConversation'
import type { OdysseyTutorAction } from '@/lib/services/odyssey/tutor-provider'

export interface OdysseyMilestoneTutorTabProps {
  milestoneId?: string
  milestoneTitle?: string
}

const SUGGESTED_ACTIONS: TutorSuggestedAction<OdysseyTutorAction>[] = [
  { action: 'explain_milestone', label: 'Explain this milestone', requiresContext: true },
  { action: 'teach_concept', label: 'Teach me the underlying concept', requiresContext: true },
  { action: 'study_plan', label: 'Create a study plan' },
  { action: 'quiz_me', label: 'Quiz me', requiresContext: true },
  { action: 'suggest_project', label: 'Suggest an Evidence-producing project' },
  { action: 'why_blocked', label: 'Explain why this is blocked', requiresContext: true },
  { action: 'compare_alternatives', label: 'Compare alternatives', requiresContext: true },
  { action: 'prepare_faculty_questions', label: 'Prepare questions for Faculty' },
  { action: 'passport_effect', label: 'Show my Career Passport implication', requiresContext: true },
]

/**
 * Grounded in the selected milestone and student context via
 * /api/odyssey/tutor, built on the reusable streaming Tutor conversation
 * hook. Advisory only — the Tutor never verifies Evidence, assigns
 * Capability truth, or issues a Passport claim.
 */
export function OdysseyMilestoneTutorTab({ milestoneId, milestoneTitle }: OdysseyMilestoneTutorTabProps) {
  const { messages, pending, error, statusAnnouncement, send, stop, retry, canRetry } = useTutorConversation('/api/odyssey/tutor')
  const [input, setInput] = useState('')

  function trigger(action: OdysseyTutorAction, label: string, customMessage?: string) {
    send({ action, milestoneId, message: customMessage }, label)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    trigger('custom', input.trim(), input.trim())
    setInput('')
  }

  const available = SUGGESTED_ACTIONS.filter((a) => !a.requiresContext || milestoneId)

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="font-campus-sans text-campus-xs text-campus-muted">
        {milestoneTitle ? (
          <>
            Grounded in <span className="font-medium text-campus-text">{milestoneTitle}</span> and your Odyssey plan. Advisory only — the Tutor cannot verify Evidence, assign Capability truth, or
            issue a Passport claim.
          </>
        ) : (
          'Select a milestone for grounded questions, or ask generally about your Odyssey plan below.'
        )}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {available.map((a) => (
          <button
            key={a.action}
            type="button"
            disabled={pending}
            onClick={() => trigger(a.action, a.label)}
            className="rounded-full border border-campus-border px-2.5 py-1 font-campus-sans text-[11px] text-campus-text hover:bg-campus-surface-raised disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {statusAnnouncement}
      </span>

      {messages.length > 0 && (
        <div className="flex flex-col gap-2 rounded-campus-sm border border-campus-border p-2.5">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'student' ? 'ml-6 text-right' : ''}>
              {m.role === 'tutor' && m.generationSource && (
                <Badge tone={m.generationSource === 'deepseek' ? 'blue' : 'amber'}>
                  {m.generationSource === 'deepseek' ? (
                    <span className="flex items-center gap-1">
                      <Sparkle size={10} weight="fill" aria-hidden="true" /> AI Tutor
                    </span>
                  ) : (
                    'Fallback — DeepSeek unavailable'
                  )}
                </Badge>
              )}
              <p className={`mt-1 whitespace-pre-wrap font-campus-sans text-campus-sm ${m.role === 'student' ? 'text-campus-muted' : 'text-campus-text'}`}>
                {m.text}
                {m.incomplete && <span className="ml-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">(stopped)</span>}
              </p>
              {m.role === 'tutor' && m.citations && m.citations.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.citations.map((c, i) =>
                    c.href ? (
                      <Link
                        key={i}
                        href={c.href}
                        className="rounded-full border border-campus-border px-2 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
                      >
                        {c.kind}: {c.label}
                      </Link>
                    ) : (
                      <span key={i} className="rounded-full border border-dashed border-campus-border px-2 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                        {c.kind}: {c.label}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div className="flex items-center justify-between rounded-campus-sm border border-campus-border p-2.5">
          <AIActivityIndicator state="composing" />
          <button type="button" onClick={stop} className="font-campus-sans text-campus-xs text-campus-muted hover:text-campus-text">
            Stop
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-campus-sm border border-campus-red-600 p-2.5 dark:border-campus-red-dark">
          <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>
          {canRetry && (
            <button type="button" onClick={retry} className="flex shrink-0 items-center gap-1 font-campus-sans text-campus-xs text-campus-text hover:underline">
              <ArrowClockwise size={12} aria-hidden="true" /> Retry
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <label htmlFor="tutor-input" className="sr-only">
          Ask the AI Tutor
        </label>
        <input
          id="tutor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Syrka about this Odyssey"
          className="flex-1 rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Send"
          className="rounded-campus-sm border border-campus-border p-2 text-campus-text hover:bg-campus-surface-raised disabled:opacity-50"
        >
          <PaperPlaneTilt size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
