'use client'

import { useCallback, useRef, useState } from 'react'

export interface TutorCitation {
  kind: 'capability' | 'evidence'
  label: string
  href?: string
}

export interface TutorMessage {
  id: string
  role: 'student' | 'tutor'
  text: string
  generationSource?: 'deepseek' | 'fallback'
  citations?: TutorCitation[]
  /** Stopped mid-stream — the partial response is kept, not discarded, and marked as such. */
  incomplete?: boolean
}

/** A suggested action any Tutor surface can offer — the reusable shape Odyssey's action bar (and future Praxis/Maxima Tutor surfaces) build on. */
export interface TutorSuggestedAction<TAction extends string> {
  action: TAction
  label: string
  /** Only offer this action when the surface has the grounding context it needs (e.g. a selected milestone). */
  requiresContext?: boolean
}

interface PendingRequest {
  body: Record<string, unknown>
  label: string
}

interface StreamEvent {
  type: 'delta' | 'done' | 'fallback' | 'error'
  text?: string
  generationSource?: 'deepseek' | 'fallback'
  citations?: TutorCitation[]
}

/**
 * Reusable streaming-Tutor client: NDJSON parsing, stop (abort), retry
 * (resend the last request), retained partial responses on stop, and a
 * coarse accessible status announcement — not a per-token one, which would
 * spam assistive tech. Any Tutor surface (Odyssey today; Praxis/Maxima
 * later) can be built on this instead of a bespoke fetch loop.
 */
export function useTutorConversation(endpoint: string) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [statusAnnouncement, setStatusAnnouncement] = useState('')
  const controllerRef = useRef<AbortController>()
  const lastRequestRef = useRef<PendingRequest>()

  const send = useCallback(
    async (body: Record<string, unknown>, label: string) => {
      setError(undefined)
      setPending(true)
      setStatusAnnouncement('Tutor is composing a response…')
      lastRequestRef.current = { body, label }

      const controller = new AbortController()
      controllerRef.current = controller

      const tutorMessageId = `${Date.now()}-tutor`
      setMessages((prev) => [...prev, { id: `${Date.now()}-student`, role: 'student', text: label }, { id: tutorMessageId, role: 'tutor', text: '' }])

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => undefined)
          setError(data?.message ?? 'The Tutor could not respond.')
          setMessages((prev) => prev.filter((m) => m.id !== tutorMessageId))
          setStatusAnnouncement('The Tutor could not respond.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            const event = JSON.parse(line) as StreamEvent
            if (event.type === 'delta' && event.text) {
              setMessages((prev) => prev.map((m) => (m.id === tutorMessageId ? { ...m, text: m.text + event.text } : m)))
            } else if (event.type === 'done' || event.type === 'fallback') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tutorMessageId
                    ? { ...m, text: event.type === 'fallback' && event.text ? event.text : m.text, generationSource: event.generationSource, citations: event.citations }
                    : m
                )
              )
            } else if (event.type === 'error') {
              setError(event.text ?? 'The Tutor could not respond.')
            }
          }
        }

        setStatusAnnouncement('Tutor finished responding.')
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') {
          setMessages((prev) => prev.map((m) => (m.id === tutorMessageId ? { ...m, incomplete: true } : m)))
          setStatusAnnouncement('Tutor response stopped.')
        } else {
          setError('The request could not be sent. Check your connection and try again.')
          setMessages((prev) => prev.filter((m) => m.id !== tutorMessageId))
          setStatusAnnouncement('The Tutor could not respond.')
        }
      } finally {
        setPending(false)
        controllerRef.current = undefined
      }
    },
    [endpoint]
  )

  const stop = useCallback(() => controllerRef.current?.abort(), [])

  const retry = useCallback(() => {
    const last = lastRequestRef.current
    if (last) send(last.body, last.label)
  }, [send])

  return { messages, pending, error, statusAnnouncement, send, stop, retry, canRetry: Boolean(lastRequestRef.current) }
}
