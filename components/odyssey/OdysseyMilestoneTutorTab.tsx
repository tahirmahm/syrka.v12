'use client'

import { useState } from 'react'
import { PaperPlaneTilt, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { ThinkingIndicator } from '@/components/motion/ThinkingIndicator'
import type { OdysseyTutorAction } from '@/lib/services/odyssey/tutor-provider'

export interface OdysseyMilestoneTutorTabProps {
  milestoneId?: string
  milestoneTitle?: string
}

const SUGGESTED_ACTIONS: { action: OdysseyTutorAction; label: string; milestoneOnly?: boolean }[] = [
  { action: 'explain_milestone', label: 'Explain this milestone', milestoneOnly: true },
  { action: 'teach_concept', label: 'Teach me the underlying concept', milestoneOnly: true },
  { action: 'study_plan', label: 'Create a study plan' },
  { action: 'quiz_me', label: 'Quiz me', milestoneOnly: true },
  { action: 'suggest_project', label: 'Suggest an Evidence-producing project' },
  { action: 'why_blocked', label: 'Explain why this is blocked', milestoneOnly: true },
  { action: 'compare_alternatives', label: 'Compare alternatives', milestoneOnly: true },
  { action: 'prepare_faculty_questions', label: 'Prepare questions for Faculty' },
  { action: 'passport_effect', label: 'Show my Career Passport implication', milestoneOnly: true },
]

interface TutorMessage {
  id: string
  role: 'student' | 'tutor'
  text: string
  generationSource?: 'deepseek' | 'fallback'
}

/**
 * Grounded in the selected milestone and student context via
 * /api/odyssey/tutor. Advisory only — the Tutor never verifies Evidence,
 * assigns Capability truth, or issues a Passport claim.
 */
export function OdysseyMilestoneTutorTab({ milestoneId, milestoneTitle }: OdysseyMilestoneTutorTabProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [controller, setController] = useState<AbortController>()

  async function send(action: OdysseyTutorAction, label: string, customMessage?: string) {
    setError(undefined)
    setPending(true)
    const ac = new AbortController()
    setController(ac)
    setMessages((prev) => [...prev, { id: `${Date.now()}-student`, role: 'student', text: label }])

    try {
      const response = await fetch('/api/odyssey/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, milestoneId, message: customMessage }),
        signal: ac.signal,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message ?? 'The Tutor could not respond.')
      } else {
        setMessages((prev) => [...prev, { id: `${Date.now()}-tutor`, role: 'tutor', text: data.message, generationSource: data.generationSource }])
      }
    } catch (e) {
      if ((e as { name?: string }).name !== 'AbortError') setError('The request could not be sent. Check your connection and try again.')
    } finally {
      setPending(false)
      setController(undefined)
    }
  }

  function stop() {
    controller?.abort()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    send('custom', input.trim(), input.trim())
    setInput('')
  }

  const available = SUGGESTED_ACTIONS.filter((a) => !a.milestoneOnly || milestoneId)

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
            onClick={() => send(a.action, a.label)}
            className="rounded-full border border-campus-border px-2.5 py-1 font-campus-sans text-[11px] text-campus-text hover:bg-campus-surface-raised disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>

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
              <p className={`mt-1 whitespace-pre-wrap font-campus-sans text-campus-sm ${m.role === 'student' ? 'text-campus-muted' : 'text-campus-text'}`}>{m.text}</p>
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div className="flex items-center justify-between rounded-campus-sm border border-campus-border p-2.5">
          <ThinkingIndicator state="thinking" />
          <button type="button" onClick={stop} className="font-campus-sans text-campus-xs text-campus-muted hover:text-campus-text">
            Stop
          </button>
        </div>
      )}

      {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

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
