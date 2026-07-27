'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { CampusCapabilityConstellation, type InstitutionalLens } from './CampusCapabilityConstellation'

const LENSES: { id: InstitutionalLens; label: string; question: string; nextAction: string; aggregation: string }[] = [
  {
    id: 'faculty',
    label: 'Faculty',
    question: 'What student work requires review?',
    nextAction: 'Three submissions are ageing past 7 days in the Evidence review queue.',
    aggregation: 'Individual student, course-scoped',
  },
  {
    id: 'department',
    label: 'Department',
    question: 'Where does the programme fail to produce required capability?',
    nextAction: 'CS410 Advanced Research Methods shows a 1-capability coverage gap across the current cohort.',
    aggregation: 'Programme and cohort, de-identified where required',
  },
  {
    id: 'university',
    label: 'University',
    question: 'What is the institution’s current capability condition?',
    nextAction: 'Data Modeling capability is Developing across 62% of eligible students — below the target distribution.',
    aggregation: 'Institution-wide, governed aggregate only',
  },
]

/**
 * One shared institutional model, three selectable lenses — not three
 * identical cards. Switching the lens changes the operational question,
 * the next action, the stated aggregation level, and which cluster the
 * capability-constellation visual converges toward.
 */
export function CampusInstitutionalLens() {
  const [activeLens, setActiveLens] = useState<InstitutionalLens>('faculty')
  const active = LENSES.find((l) => l.id === activeLens)!
  const reduceMotion = useReducedMotionSafe()

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative inline-flex rounded-campus-sm border border-campus-border p-0.5" role="tablist" aria-label="Institutional perspective">
          {LENSES.map((lens, i) => (
            <button
              key={lens.id}
              type="button"
              role="tab"
              id={`lens-tab-${lens.id}`}
              aria-selected={activeLens === lens.id}
              aria-controls={`lens-panel-${lens.id}`}
              tabIndex={activeLens === lens.id ? 0 : -1}
              onClick={() => setActiveLens(lens.id)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                e.preventDefault()
                const nextIndex = e.key === 'ArrowRight' ? (i + 1) % LENSES.length : (i - 1 + LENSES.length) % LENSES.length
                const nextLens = LENSES[nextIndex]
                setActiveLens(nextLens.id)
                document.getElementById(`lens-tab-${nextLens.id}`)?.focus()
              }}
              className="relative z-10 px-4 py-1.5 font-campus-sans text-campus-sm transition-colors"
            >
              {activeLens === lens.id && (
                <motion.span
                  layoutId={reduceMotion ? undefined : 'institutional-lens-pill'}
                  className="absolute inset-0 -z-10 rounded-[5px] bg-campus-ink-950 dark:bg-campus-stone-100"
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className={activeLens === lens.id ? 'text-campus-white dark:text-campus-ink-950' : 'text-campus-text hover:text-campus-muted'}>{lens.label}</span>
            </button>
          ))}
        </div>

        <div id={`lens-panel-${active.id}`} role="tabpanel" aria-labelledby={`lens-tab-${active.id}`} tabIndex={0}>
          <p className="mt-6 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Operational question</p>
          <h4 className="mt-1 max-w-md font-campus-sans text-campus-xl font-semibold text-campus-text">{active.question}</h4>

          <p className="mt-4 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Next action</p>
          <p className="mt-1 max-w-md font-campus-sans text-campus-sm text-campus-text">{active.nextAction}</p>

          <p className="mt-4 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Aggregation level</p>
          <p className="mt-1 font-campus-sans text-campus-sm text-campus-muted">{active.aggregation}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <CampusCapabilityConstellation lens={activeLens} />
      </div>
    </div>
  )
}
