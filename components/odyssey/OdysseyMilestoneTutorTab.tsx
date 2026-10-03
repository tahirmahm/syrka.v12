'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowClockwise, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useTutorConversation, type TutorSuggestedAction } from '@/components/tutor/useTutorConversation'
import type { OdysseyTutorAction } from '@/lib/services/odyssey/tutor-provider'
import type { OdysseyGenerationApiResponse } from './odyssey-client-types'

export interface OdysseyMilestoneTutorTabProps {
  milestoneId?: string
  milestoneTitle?: string
}

/** The four primary contextual entry points, always listed first — everything after is a secondary action. */
const SUGGESTED_ACTIONS: TutorSuggestedAction<OdysseyTutorAction>[] = [
  { action: 'explain_milestone', label: 'Help me understand this step', requiresContext: true },
  { action: 'explain_why_on_path', label: 'Explain why this is on my path', requiresContext: true },
  { action: 'recommend_next_action', label: 'What should I do next?' },
  { action: 'quiz_me', label: 'Test my readiness', requiresContext: true },
  { action: 'teach_concept', label: 'Teach me the underlying concept', requiresContext: true },
  { action: 'study_plan', label: 'Create a study plan' },
  { action: 'suggest_project', label: 'Suggest an Evidence-producing project' },
  { action: 'why_blocked', label: 'Explain why this is blocked', requiresContext: true },
  { action: 'compare_alternatives', label: 'Compare alternatives', requiresContext: true },
  { action: 'prepare_faculty_questions', label: 'Prepare questions for Faculty' },
  { action: 'passport_effect', label: 'Show my Career Passport implication', requiresContext: true },
  { action: 'generate_practice_exercise', label: 'Generate a practice exercise', requiresContext: true },
  { action: 'summarize_changes', label: 'Summarise what changed' },
  { action: 'replan_with_constraint', label: 'Replan with a new constraint' },
]

/**
 * Grounded in the selected milestone and student context via
 * /api/odyssey/tutor, built on the reusable streaming Tutor conversation
 * hook. Advisory only — the Tutor never verifies Evidence, assigns
 * Capability truth, or issues a Passport claim.
 */
export function OdysseyMilestoneTutorTab({ milestoneId, milestoneTitle }: OdysseyMilestoneTutorTabProps) {
  const router = useRouter()
  const { messages, pending, error, statusAnnouncement, send, stop, retry, pushMessage, canRetry } = useTutorConversation('/api/odyssey/tutor')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'chat' | 'replan'>('chat')
  const [replanPending, setReplanPending] = useState(false)

  function trigger(action: OdysseyTutorAction, label: string, customMessage?: string) {
    if (action === 'replan_with_constraint') {
      setMode('replan')
      return
    }
    send({ action, milestoneId, message: customMessage }, label)
  }

  async function submitReplanConstraint(constraint: string) {
    pushMessage({ id: `${Date.now()}-student`, role: 'student', text: `Replan with a new constraint: ${constraint}` })
    setReplanPending(true)
    try {
      const response = await fetch('/api/odyssey/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustmentInstruction: constraint }),
      })
      const result: OdysseyGenerationApiResponse = await response.json()
      pushMessage({
        id: `${Date.now()}-tutor`,
        role: 'tutor',
        text: result.message,
        badge: { label: 'Structured replan', tone: 'purple' },
      })
      if (result.status === 'success') router.refresh()
    } catch {
      pushMessage({
        id: `${Date.now()}-tutor`,
        role: 'tutor',
        text: 'The replan request could not be sent. Check your connection and try again.',
        badge: { label: 'Structured replan', tone: 'purple' },
      })
    } finally {
      setReplanPending(false)
      setMode('chat')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    if (mode === 'replan') {
      submitReplanConstraint(input.trim())
    } else {
      trigger('custom', input.trim(), input.trim())
    }
    setInput('')
  }

  const busy = pending || replanPending
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
            disabled={busy}
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
              {m.role === 'tutor' && m.badge && <Badge tone={m.badge.tone}>{m.badge.label}</Badge>}
              {m.role === 'tutor' && !m.badge && m.generationSource && (
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
          <SyrkaIntelligenceState state="composing" />
          <button type="button" onClick={stop} className="font-campus-sans text-campus-xs text-campus-muted hover:text-campus-text">
            Stop
          </button>
        </div>
      )}

      {replanPending && (
        <div className="rounded-campus-sm border border-campus-border p-2.5">
          <SyrkaIntelligenceState state="shaping" label="Reshaping your Odyssey plan" />
        </div>
      )}

      {mode === 'replan' && !replanPending && (
        <div className="flex items-center justify-between rounded-campus-sm border border-dashed border-campus-border p-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
          Describe the constraint below — this calls the structured Replan tool, not a chat reply.
          <button type="button" onClick={() => setMode('chat')} className="normal-case tracking-normal text-campus-text hover:underline">
            Cancel
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
          {mode === 'replan' ? 'Describe the constraint to replan with' : 'Ask the AI Tutor'}
        </label>
        <input
          id="tutor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'replan' ? 'e.g. Reduce the workload this semester.' : 'Ask Syrka about this Odyssey'}
          className="flex-1 rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label={mode === 'replan' ? 'Submit constraint' : 'Send'}
          className="rounded-campus-sm border border-campus-border p-2 text-campus-text hover:bg-campus-surface-raised disabled:opacity-50"
        >
          <PaperPlaneTilt size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
