'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, PlayCircle, Star, FlagCheckered, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Help me understand this step', answer: 'This project is your current position — the strongest live Evidence source in your plan right now, so keep it moving before starting anything new.' },
  { id: 'why', label: 'Explain why this is on my path', answer: 'It was placed here because your Foundations Evidence showed Proficient confidence, which the plan uses as the prerequisite for applied, project-based work.' },
] as const

interface PreviewMilestone {
  id: string
  title: string
  detail: string
  status: 'completed' | 'in_progress' | 'recommended' | 'optional'
  branch?: boolean
}

const MILESTONES: PreviewMilestone[] = [
  { id: 'foundations', title: 'Foundations course', detail: 'Verified through coursework Evidence — Proficient, Strong confidence.', status: 'completed' },
  { id: 'applied-project', title: 'Applied project', detail: 'Current position — an in-progress capstone project generating fresh Evidence.', status: 'in_progress' },
  { id: 'research-elective', title: 'Research elective', detail: 'An optional branch — not required, but strengthens a research-oriented direction.', status: 'optional', branch: true },
  { id: 'capstone-review', title: 'Faculty capstone review', detail: 'Recommended next — the single most useful action given the current plan.', status: 'recommended' },
]

const STATUS_ICON = { completed: CheckCircle, in_progress: PlayCircle, recommended: Star, optional: PlayCircle }
const STATUS_LABEL = { completed: 'Complete', in_progress: 'Here', recommended: 'Next', optional: 'Optional' }
const STATUS_TONE = {
  completed: 'text-campus-green-600 dark:text-campus-green-dark border-campus-green-600 dark:border-campus-green-dark',
  in_progress: 'text-campus-blue-600 dark:text-campus-blue-dark border-campus-blue-600 dark:border-campus-blue-dark',
  recommended: 'text-campus-amber-600 dark:text-campus-amber-dark border-campus-amber-600 dark:border-campus-amber-dark',
  optional: 'text-campus-muted border-campus-border',
}

/**
 * A compact, real, interactive preview of the reconstructed Student Odyssey
 * roadmap — same trunk/branch marker language, simplified for storytelling.
 * Selecting a milestone opens its explanation and a Tutor processing chip,
 * demonstrating an actual interaction rather than a static screenshot.
 */
export function CampusOdysseyPreview() {
  const [selectedId, setSelectedId] = useState<string>('applied-project')
  const [activeAction, setActiveAction] = useState<(typeof QUICK_ACTIONS)[number]['id'] | null>(null)
  const [pending, setPending] = useState(false)
  const selected = MILESTONES.find((m) => m.id === selectedId)
  const reduceMotion = useReducedMotionSafe()
  const activeAnswer = QUICK_ACTIONS.find((a) => a.id === activeAction)

  function runAction(id: (typeof QUICK_ACTIONS)[number]['id']) {
    if (activeAction === id) {
      setActiveAction(null)
      return
    }
    setActiveAction(id)
    setPending(true)
    window.setTimeout(() => setPending(false), reduceMotion ? 0 : 650)
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex flex-1 flex-col gap-1">
        {MILESTONES.map((m) => {
          const Icon = STATUS_ICON[m.status]
          const isSelected = m.id === selectedId
          return (
            <div key={m.id} className={`flex items-center gap-3 ${m.branch ? 'ml-8' : ''}`}>
              <div className={`h-6 w-px ${m.branch ? 'bg-transparent' : 'bg-campus-border'}`} aria-hidden="true" />
              <button
                type="button"
                onClick={() => {
                  setSelectedId(m.id)
                  setActiveAction(null)
                }}
                aria-pressed={isSelected}
                className={`flex flex-1 items-center gap-2 rounded-campus-sm px-2 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                  isSelected ? 'bg-campus-surface-raised' : 'hover:bg-campus-surface-raised/60'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${STATUS_TONE[m.status]} ${m.branch ? 'border-dashed' : ''}`}>
                  <Icon size={12} weight="fill" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-campus-sans text-campus-sm font-medium text-campus-text">{m.title}</span>
                  <span className={`font-campus-mono text-[9px] uppercase tracking-wide ${STATUS_TONE[m.status].split(' ')[0]}`}>{STATUS_LABEL[m.status]}</span>
                </span>
              </button>
            </div>
          )
        })}
        <div className="ml-2 flex items-center gap-3 pt-2">
          <div className="h-6 w-px bg-campus-border" aria-hidden="true" />
          <div className="flex items-center gap-2 px-2">
            <FlagCheckered size={16} className="text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" />
            <span className="font-campus-sans text-campus-sm font-semibold text-campus-text">Curriculum foundations</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="flex-1 rounded-campus-md border border-campus-border bg-campus-surface p-5">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Selected milestone</p>
          <h4 className="mt-1 font-campus-sans text-campus-base font-medium text-campus-text">{selected.title}</h4>
          <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">{selected.detail}</p>

          {/* AI Tutor command surface — an expanding-controls pattern (Kokonut UI's
              catalogue was network-blocked in this sandbox; the interaction idea,
              a compact action row that expands in place into a response, is
              rebuilt here as an original Motion layout animation). */}
          <div className="mt-4 border-t border-campus-border pt-3">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">AI Tutor</p>
            <motion.div layout className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const isActive = activeAction === action.id
                return (
                  <motion.button
                    key={action.id}
                    layout
                    type="button"
                    onClick={() => runAction(action.id)}
                    aria-pressed={isActive}
                    initial={false}
                    animate={{ gap: isActive ? '0.375rem' : 0, paddingLeft: isActive ? '0.875rem' : '0.75rem', paddingRight: isActive ? '0.875rem' : '0.75rem' }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex items-center rounded-full border py-1.5 font-campus-sans text-campus-xs transition-colors ${
                      isActive
                        ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-white dark:bg-campus-white dark:text-campus-ink-950'
                        : 'border-campus-border text-campus-text hover:bg-campus-surface-raised'
                    }`}
                  >
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={reduceMotion ? false : { width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={reduceMotion ? undefined : { width: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <Sparkle size={12} weight="fill" aria-hidden="true" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span>{action.label}</span>
                  </motion.button>
                )
              })}
            </motion.div>

            <AnimatePresence initial={false} mode="wait">
              {activeAnswer && (
                <motion.div
                  key={activeAnswer.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-campus-sm bg-campus-surface-raised p-3">
                    {pending ? (
                      <SyrkaIntelligenceState state="working" label={`AI Tutor: ${activeAnswer.label.toLowerCase()}`} />
                    ) : (
                      <p className="font-campus-sans text-campus-xs text-campus-text">{activeAnswer.answer}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
