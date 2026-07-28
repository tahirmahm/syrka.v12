'use client'

import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Users, Buildings, Scales, Flag, MapTrifold, MapPin, ArrowsLeftRight, ArrowDown, Play, Pause, ArrowClockwise, ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

type Institution = 'legislature' | 'executive' | 'judiciary'
type Level = 'union' | 'state' | 'local'
type Focus = 'horizontal' | 'vertical'
type ScenarioAnswer = 'horizontal' | 'vertical' | 'both' | 'neither'

interface InstitutionInfo {
  id: Institution
  label: string
  icon: typeof Users
  role: string
  relationship: string
}

const INSTITUTIONS: InstitutionInfo[] = [
  { id: 'legislature', label: 'Legislature', icon: Users, role: 'Makes laws and scrutinises the executive through questions, debate and votes of confidence.', relationship: 'Questions and can remove the executive; passes the laws the executive must implement.' },
  { id: 'executive', label: 'Executive', icon: Buildings, role: 'Implements laws and carries out day-to-day government policy.', relationship: 'Answerable to the legislature; its actions can be reviewed by the judiciary.' },
  { id: 'judiciary', label: 'Judiciary', icon: Scales, role: 'Interprets the Constitution and reviews whether laws and executive actions are legal.', relationship: 'Can strike down a law passed by the legislature or an act of the executive that violates the Constitution.' },
]

interface LevelInfo {
  id: Level
  label: string
  icon: typeof Flag
  jurisdiction: string
  example: string
}

const LEVELS: LevelInfo[] = [
  { id: 'union', label: 'Union / Central government', icon: Flag, jurisdiction: 'Constitutionally allocated national-level subjects — defence, foreign affairs, currency.', example: 'Sets national defence and foreign policy for the whole country.' },
  { id: 'state', label: 'State government', icon: MapTrifold, jurisdiction: 'Constitutionally allocated state-level subjects — police, agriculture, public health.', example: 'A state government manages a state subject such as agriculture policy for its own territory.' },
  { id: 'local', label: 'Local government', icon: MapPin, jurisdiction: 'Issues handled closest to citizens — neighbourhood services, local infrastructure.', example: 'A municipality manages neighbourhood waste collection.' },
]

interface Scenario {
  id: string
  text: string
  answer: ScenarioAnswer
  feedback: Record<ScenarioAnswer, string>
}

const SCENARIOS: Scenario[] = [
  {
    id: 'sc-judiciary-review',
    text: 'The Supreme Court reviews a law passed by Parliament and finds part of it unconstitutional.',
    answer: 'horizontal',
    feedback: {
      horizontal: 'Correct — this is a check between two institutions at the same (national) level: the judiciary reviewing the legislature. No other level of government is involved.',
      vertical: 'Not quite — both the Supreme Court and Parliament sit at the same, national level. Vertical power-sharing is about different levels (Union/State/Local), not different institutions at one level.',
      both: 'Not quite — only one relationship is shown here, and it is between two institutions at the same level, so this is horizontal only.',
      neither: 'Not quite — this is exactly the judiciary‑reviewing‑legislature check the horizontal system depends on.',
    },
  },
  {
    id: 'sc-municipality',
    text: 'A municipality manages neighbourhood waste collection.',
    answer: 'vertical',
    feedback: {
      horizontal: 'Not quite — this is a single level of government (local) acting alone, not a check between institutions at the same level.',
      vertical: 'Correct — a local government handling an issue close to citizens is exactly the vertical distribution of authority across levels.',
      both: 'Not quite — no legislature/executive/judiciary interaction is shown here, only one level of government acting within its own jurisdiction.',
      neither: 'Not quite — local government handling a local issue is a direct example of vertical power-sharing.',
    },
  },
  {
    id: 'sc-legislature-questions',
    text: 'The legislature questions ministers about a policy the executive has implemented.',
    answer: 'horizontal',
    feedback: {
      horizontal: 'Correct — the legislature scrutinising the executive is a check between two institutions at the same level of government.',
      vertical: 'Not quite — both the legislature and the executive being questioned are at the same (national) level; no other level of government appears here.',
      both: 'Not quite — only the horizontal relationship (legislature checking executive) is shown.',
      neither: 'Not quite — this is one of the clearest examples of horizontal checks and balances.',
    },
  },
  {
    id: 'sc-state-subject',
    text: 'A state government manages a state subject such as agriculture policy for its own territory, while the Union government separately handles national defence.',
    answer: 'vertical',
    feedback: {
      horizontal: 'Not quite — no institutions at the same level (legislature/executive/judiciary) are interacting here; the contrast is between two different levels of government.',
      vertical: 'Correct — the Union and a State each hold distinct constitutionally allocated responsibilities, which is exactly vertical power-sharing across levels.',
      both: 'Not quite — this scenario only shows the vertical division between Union and State, not any horizontal check between institutions.',
      neither: 'Not quite — division of authority between Union and State government is the core case of vertical power-sharing.',
    },
  },
]

interface SequenceStage {
  id: string
  label: string
  narration: string
  highlightInstitutions: Institution[]
  highlightLevels: Level[]
  showChecksAndBalances: boolean
  showLevels: boolean
}

const SEQUENCE_STAGES: SequenceStage[] = [
  {
    id: 'concentrated',
    label: '1. Concentrated power',
    narration: 'Imagine all law-making, implementation and legal interpretation held by one authority, with no other level of government involved.',
    highlightInstitutions: [],
    highlightLevels: [],
    showChecksAndBalances: false,
    showLevels: false,
  },
  {
    id: 'horizontal-distribution',
    label: '2. Horizontal distribution',
    narration: 'Power is instead split among three institutions at the same level: the legislature makes laws, the executive implements them, the judiciary interprets the Constitution.',
    highlightInstitutions: ['legislature', 'executive', 'judiciary'],
    highlightLevels: [],
    showChecksAndBalances: false,
    showLevels: false,
  },
  {
    id: 'checks-and-balances',
    label: '3. Checks and balances',
    narration: 'Each institution limits the others — the legislature scrutinises the executive, the judiciary can review both — so no single institution can concentrate power.',
    highlightInstitutions: ['legislature', 'executive', 'judiciary'],
    highlightLevels: [],
    showChecksAndBalances: true,
    showLevels: false,
  },
  {
    id: 'vertical-distribution',
    label: '4. Vertical distribution',
    narration: 'Power is also split across different levels of government — Union, State and Local — each with its own constitutionally allocated jurisdiction.',
    highlightInstitutions: [],
    highlightLevels: ['union', 'state', 'local'],
    showChecksAndBalances: false,
    showLevels: true,
  },
  {
    id: 'both-together',
    label: '5. Both systems together',
    narration: 'A real government runs both systems at once: horizontal checks within each level, and vertical division of authority across levels.',
    highlightInstitutions: ['legislature', 'executive', 'judiciary'],
    highlightLevels: ['union', 'state', 'local'],
    showChecksAndBalances: true,
    showLevels: true,
  },
  {
    id: 'stability',
    label: '6. Why it matters',
    narration: 'Dividing power both ways — horizontally and vertically — prevents any single institution or level of government from concentrating power, which is what makes this arrangement prudent for a stable democracy.',
    highlightInstitutions: ['legislature', 'executive', 'judiciary'],
    highlightLevels: ['union', 'state', 'local'],
    showChecksAndBalances: true,
    showLevels: true,
  },
]

/**
 * VISUAL SEMANTIC QUALITY CORRECTION — replaces the rejected generic
 * two-card "Context / Outcome" composition for "Horizontal and vertical
 * power-sharing" (ncert-concept-pol-1-1) with a dedicated institutional
 * comparison: horizontal power-sharing (legislature/executive/judiciary at
 * one level, with checks and balances) side by side with vertical
 * power-sharing (Union/State/Local across levels), a scenario
 * classification exercise, and a GSAP-driven explanatory sequence. No
 * generic node-edge graph — every relationship shown is a specific,
 * grounded sentence tied to a fixed set of institutions and levels.
 */
export function HorizontalVerticalPowerSharingVisual() {
  const reduceMotion = useReducedMotionSafe()
  const [focus, setFocus] = useState<Focus>('horizontal')
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, ScenarioAnswer>>({})
  const [showText, setShowText] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline>()

  const stage = SEQUENCE_STAGES[stageIndex]
  const scenario = SCENARIOS[scenarioIndex]
  const chosenAnswer = scenarioAnswers[scenario.id]

  useGSAP(
    () => {
      if (reduceMotion) return
      const tl = gsap.timeline({ paused: true, onComplete: () => setPlaying(false) })
      SEQUENCE_STAGES.forEach((_, i) => {
        tl.call(() => setStageIndex(i))
        tl.to({}, { duration: 2.2 })
      })
      timelineRef.current = tl
      return () => {
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [reduceMotion] }
  )

  function handlePlay() {
    if (stageIndex === SEQUENCE_STAGES.length - 1) {
      timelineRef.current?.restart()
    }
    timelineRef.current?.play()
    setPlaying(true)
  }
  function handlePause() {
    timelineRef.current?.pause()
    setPlaying(false)
  }
  function handleStep(direction: 1 | -1) {
    timelineRef.current?.pause()
    setPlaying(false)
    setStageIndex((i) => Math.min(Math.max(i + direction, 0), SEQUENCE_STAGES.length - 1))
  }
  function handleReplay() {
    timelineRef.current?.restart()
    setStageIndex(0)
    setPlaying(true)
    timelineRef.current?.play()
  }

  const structuredTextEquivalent = useMemo(
    () =>
      [
        'Horizontal power-sharing: power divided among the legislature, executive and judiciary, all at the same (national) level of government, held in check by checks and balances between them.',
        ...INSTITUTIONS.map((inst) => `${inst.label}: ${inst.role} ${inst.relationship}`),
        'Vertical power-sharing: power divided among the Union, State and Local levels of government, each with its own constitutionally allocated jurisdiction.',
        ...LEVELS.map((lvl) => `${lvl.label}: ${lvl.jurisdiction} Example: ${lvl.example}`),
        'Both systems operate together in a stable democracy: horizontal checks prevent any one institution from dominating, and vertical division prevents any one level of government from dominating.',
      ].join(' '),
    []
  )

  const activeInstitutions = reduceMotion ? [] : stage.highlightInstitutions
  const activeLevels = reduceMotion ? [] : stage.highlightLevels

  return (
    <div ref={containerRef} className="flex flex-col gap-5 rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Interactive — institutional comparison</p>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Focus">
          {(['horizontal', 'vertical'] as Focus[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={focus === f}
              onClick={() => setFocus(f)}
              className={`rounded-full border px-3 py-1 font-campus-mono text-[10px] uppercase tracking-wide ${
                focus === f
                  ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-stone-100 dark:bg-campus-stone-100 dark:text-campus-ink-950'
                  : 'border-campus-border text-campus-muted hover:bg-campus-surface-raised'
              }`}
            >
              {f === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </button>
          ))}
        </div>
      </div>

      {/* Central distinction panel — always visible, never left for the learner to infer. */}
      <div className="grid gap-3 rounded-campus-sm border border-campus-border bg-campus-surface-raised p-3 sm:grid-cols-2">
        <div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Horizontal</p>
          <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">Same level · different institutions · checks and balances.</p>
        </div>
        <div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-green-600 dark:text-campus-green-dark">Vertical</p>
          <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">Different levels · different jurisdictions · division of authority.</p>
        </div>
      </div>

      {/* Main spatial composition. */}
      {focus === 'horizontal' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-stretch justify-center gap-3">
            {INSTITUTIONS.map((inst, i) => {
              const Icon = inst.icon
              const isHighlighted = activeInstitutions.includes(inst.id)
              const isSelected = selectedInstitution === inst.id
              return (
                <div key={inst.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInstitution((cur) => (cur === inst.id ? null : inst.id))}
                    aria-pressed={isSelected}
                    className={`flex w-40 flex-col items-center gap-2 rounded-campus-sm border p-3 text-center transition-colors ${
                      isSelected
                        ? 'border-campus-blue-600 bg-campus-blue-600/10 dark:border-campus-blue-dark'
                        : isHighlighted
                          ? 'border-campus-blue-600/60 bg-campus-blue-600/5 dark:border-campus-blue-dark/60'
                          : 'border-campus-border bg-campus-surface hover:bg-campus-surface-raised'
                    }`}
                  >
                    <Icon size={26} weight="duotone" className="text-campus-ink-950 dark:text-campus-stone-100" />
                    <span className="font-campus-sans text-campus-sm font-medium text-campus-text">{inst.label}</span>
                  </button>
                  {i < INSTITUTIONS.length - 1 && (
                    <ArrowsLeftRight
                      size={18}
                      aria-hidden="true"
                      className={stage.showChecksAndBalances ? 'text-campus-blue-600 dark:text-campus-blue-dark' : 'text-campus-faint'}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {stage.showChecksAndBalances && !reduceMotion && (
            <p className="text-center font-campus-mono text-[10px] uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Checks and balances active</p>
          )}
          {selectedInstitution && (
            <div className="rounded-campus-sm border border-campus-border bg-campus-surface-raised p-3">
              <p className="font-campus-sans text-campus-sm text-campus-text">{INSTITUTIONS.find((i) => i.id === selectedInstitution)?.role}</p>
              <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-muted">{INSTITUTIONS.find((i) => i.id === selectedInstitution)?.relationship}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
            {LEVELS.map((lvl, i) => {
              const Icon = lvl.icon
              const isHighlighted = activeLevels.includes(lvl.id)
              const isSelected = selectedLevel === lvl.id
              return (
                <div key={lvl.id} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedLevel((cur) => (cur === lvl.id ? null : lvl.id))}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3 rounded-campus-sm border p-3 transition-colors ${
                      isSelected
                        ? 'border-campus-green-600 bg-campus-green-600/10 dark:border-campus-green-dark'
                        : isHighlighted
                          ? 'border-campus-green-600/60 bg-campus-green-600/5 dark:border-campus-green-dark/60'
                          : 'border-campus-border bg-campus-surface hover:bg-campus-surface-raised'
                    }`}
                  >
                    <Icon size={24} weight="duotone" className="shrink-0 text-campus-ink-950 dark:text-campus-stone-100" />
                    <span className="font-campus-sans text-campus-sm font-medium text-campus-text">{lvl.label}</span>
                  </button>
                  {i < LEVELS.length - 1 && (
                    <ArrowDown size={16} aria-hidden="true" className={stage.showLevels ? 'text-campus-green-600 dark:text-campus-green-dark' : 'text-campus-faint'} />
                  )}
                </div>
              )
            })}
          </div>
          {selectedLevel && (
            <div className="rounded-campus-sm border border-campus-border bg-campus-surface-raised p-3">
              <p className="font-campus-sans text-campus-sm text-campus-text">{LEVELS.find((l) => l.id === selectedLevel)?.jurisdiction}</p>
              <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-muted">{LEVELS.find((l) => l.id === selectedLevel)?.example}</p>
            </div>
          )}
        </div>
      )}

      {/* Animated explanatory sequence. */}
      {reduceMotion ? (
        <div className="flex flex-col gap-2.5 border-t border-campus-border pt-3">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Explanatory sequence</p>
          {SEQUENCE_STAGES.map((s) => (
            <div key={s.id} className="rounded-campus-sm border border-campus-border p-2.5">
              <p className="font-campus-sans text-campus-xs font-medium text-campus-text">{s.label}</p>
              <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{s.narration}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 border-t border-campus-border pt-3">
          <div className="flex items-center justify-between">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{stage.label}</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => handleStep(-1)} aria-label="Previous stage" disabled={stageIndex === 0} className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised disabled:opacity-30">
                <ArrowLeft size={12} />
              </button>
              <button type="button" onClick={playing ? handlePause : handlePlay} aria-label={playing ? 'Pause' : 'Play'} className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised">
                {playing ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
              </button>
              <button type="button" onClick={() => handleStep(1)} aria-label="Next stage" disabled={stageIndex === SEQUENCE_STAGES.length - 1} className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised disabled:opacity-30">
                <ArrowRight size={12} />
              </button>
              <button type="button" onClick={handleReplay} aria-label="Replay" className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised">
                <ArrowClockwise size={12} />
              </button>
            </div>
          </div>
          <p className="font-campus-sans text-campus-sm text-campus-text">{stage.narration}</p>
          <div className="flex items-center gap-1" aria-hidden="true">
            {SEQUENCE_STAGES.map((s, i) => (
              <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= stageIndex ? 'bg-campus-ink-950 dark:bg-campus-stone-100' : 'bg-campus-border'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Scenario classification exercise. */}
      <div className="border-t border-campus-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Classify this example ({scenarioIndex + 1} of {SCENARIOS.length})</p>
          {chosenAnswer && scenarioIndex < SCENARIOS.length - 1 && (
            <button type="button" onClick={() => setScenarioIndex((i) => i + 1)} className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
              Next example →
            </button>
          )}
        </div>
        <p className="mt-2 font-campus-sans text-campus-sm text-campus-text">&ldquo;{scenario.text}&rdquo;</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['horizontal', 'vertical', 'both', 'neither'] as ScenarioAnswer[]).map((answer) => (
            <button
              key={answer}
              type="button"
              onClick={() => setScenarioAnswers((s) => ({ ...s, [scenario.id]: answer }))}
              aria-pressed={chosenAnswer === answer}
              className={`rounded-campus-sm border px-3 py-1.5 font-campus-sans text-campus-sm capitalize ${
                chosenAnswer === answer
                  ? answer === scenario.answer
                    ? 'border-campus-green-600 bg-campus-green-600/10 text-campus-text'
                    : 'border-campus-amber-600 bg-campus-amber-600/10 text-campus-text'
                  : 'border-campus-border text-campus-text hover:bg-campus-surface-raised'
              }`}
            >
              {answer}
            </button>
          ))}
        </div>
        {chosenAnswer && <p className="mt-3 font-campus-sans text-campus-sm text-campus-text">{scenario.feedback[chosenAnswer]}</p>}
        {chosenAnswer && (
          <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
            This exploratory interactive is not connected to the concept&rsquo;s own Evidence chain — complete the Test step below for a transfer attempt that counts toward Evidence.
          </p>
        )}
      </div>

      <div className="border-t border-campus-border pt-3">
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
          className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
        >
          {showText ? 'Hide' : 'Show'} structured text equivalent
        </button>
        {showText && <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">{structuredTextEquivalent}</p>}
      </div>
    </div>
  )
}
