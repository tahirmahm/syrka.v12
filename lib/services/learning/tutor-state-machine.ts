import type { TutorState, TutorMode, TutorTransition } from '@/lib/campus-types'

/**
 * The complete permitted-transition table. The server validates every
 * state change against this — the model cannot decide on its own to skip
 * from a question straight to a complete answer; there is no edge for it.
 */
export const TUTOR_TRANSITIONS: TutorTransition[] = [
  { from: 'diagnose', to: 'elicit_attempt' },
  { from: 'diagnose', to: 'request_visual' },
  { from: 'elicit_attempt', to: 'classify_misconception' },
  { from: 'elicit_attempt', to: 'check_understanding' },
  { from: 'classify_misconception', to: 'hint' },
  { from: 'hint', to: 'hint' },
  { from: 'hint', to: 'scaffold' },
  { from: 'hint', to: 'request_visual' },
  { from: 'scaffold', to: 'challenge' },
  { from: 'scaffold', to: 'request_visual' },
  { from: 'challenge', to: 'check_understanding' },
  { from: 'check_understanding', to: 'transfer' },
  { from: 'check_understanding', to: 'hint' },
  { from: 'request_visual', to: 'check_understanding' },
  { from: 'transfer', to: 'reflection' },
  { from: 'transfer', to: 'propose_evidence_mission' },
  { from: 'reflection', to: 'summarise' },
  { from: 'summarise', to: 'propose_evidence_mission' },
]

export function isTransitionPermitted(from: TutorState, to: TutorState, mode: TutorMode): { allowed: boolean; reason?: string } {
  const candidates = TUTOR_TRANSITIONS.filter((t) => t.from === from && t.to === to)
  if (candidates.length === 0) {
    return { allowed: false, reason: `"${from}" -> "${to}" is not a permitted Tutor state transition.` }
  }
  const modeOk = candidates.some((t) => !t.allowedModes || t.allowedModes.includes(mode))
  if (!modeOk) return { allowed: false, reason: `"${from}" -> "${to}" is not permitted in ${mode} mode.` }
  return { allowed: true }
}

export interface TutorModePolicy {
  mode: TutorMode
  hintsAllowed: boolean
  /** Whether the mode itself may ever produce an immediate, unearned answer (Explain mode teaches by direct explanation; every other mode must earn a reveal through the hint ladder). */
  immediateAnswerAllowed: boolean
  allowsMidAttemptModeSwitch: boolean
}

export const TUTOR_MODE_POLICIES: Record<TutorMode, TutorModePolicy> = {
  socratic: { mode: 'socratic', hintsAllowed: true, immediateAnswerAllowed: false, allowsMidAttemptModeSwitch: true },
  explain: { mode: 'explain', hintsAllowed: true, immediateAnswerAllowed: true, allowsMidAttemptModeSwitch: true },
  practice: { mode: 'practice', hintsAllowed: true, immediateAnswerAllowed: false, allowsMidAttemptModeSwitch: true },
  exam: { mode: 'exam', hintsAllowed: false, immediateAnswerAllowed: false, allowsMidAttemptModeSwitch: false },
  review: { mode: 'review', hintsAllowed: false, immediateAnswerAllowed: false, allowsMidAttemptModeSwitch: true },
  visualise: { mode: 'visualise', hintsAllowed: false, immediateAnswerAllowed: false, allowsMidAttemptModeSwitch: true },
}

export const HINT_LADDER: { level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; description: string }[] = [
  { level: 0, description: 'Ask for an initial attempt.' },
  { level: 1, description: 'Restate the problem more clearly.' },
  { level: 2, description: 'Ask what the student already knows.' },
  { level: 3, description: 'Point to the relevant concept or prerequisite.' },
  { level: 4, description: 'Provide one partial clue.' },
  { level: 5, description: 'Demonstrate an analogous example.' },
  { level: 6, description: 'Work through one step of the actual problem.' },
  { level: 7, description: 'Reveal the complete solution — only when policy permits.' },
]

/** A complete reveal is only ever the ladder's final rung — never earlier, regardless of mode. */
export function canRevealCompleteSolution(hintLevel: number): boolean {
  return hintLevel >= 7
}

export interface TutorTransitionCheckInput {
  from: TutorState
  to: TutorState
  mode: TutorMode
  hintLevel: number
  /** False while a governed Exam attempt is still open. */
  attemptSubmitted?: boolean
}

/** Rejects: immediate answer reveal in Socratic/Practice, and hints requested during a still-open governed Exam attempt. */
export function validateTutorTransition(input: TutorTransitionCheckInput): string[] {
  const errors: string[] = []
  const { allowed, reason } = isTransitionPermitted(input.from, input.to, input.mode)
  if (!allowed && reason) errors.push(reason)

  if ((input.mode === 'socratic' || input.mode === 'practice') && input.to === 'hint' && input.hintLevel >= 7 && input.from === 'diagnose') {
    errors.push(`${input.mode} mode cannot reveal a complete solution before working through the hint ladder.`)
  }

  if (input.mode === 'exam' && input.to === 'hint' && input.attemptSubmitted === false) {
    errors.push('Exam mode does not permit hints before the attempt is submitted.')
  }

  return errors
}

/** Rejects switching out of Exam mode while a governed attempt is still open. */
export function validateModeSwitch(currentMode: TutorMode, nextMode: TutorMode, attemptInProgress: boolean): string[] {
  const errors: string[] = []
  if (currentMode === 'exam' && attemptInProgress && nextMode !== 'exam') {
    errors.push(`Cannot switch from exam mode to ${nextMode} mode while a governed attempt is in progress.`)
  }
  return errors
}

/** Rejects a session reaching "summarise" without ever having passed through "transfer" — required-transfer cannot be skipped. */
export function requiresTransferBeforeSummary(priorStates: TutorState[]): string[] {
  const summariseIndex = priorStates.lastIndexOf('summarise')
  if (summariseIndex === -1) return []
  const beforeSummary = priorStates.slice(0, summariseIndex)
  if (!beforeSummary.includes('transfer')) return ['Reached "summarise" without passing through "transfer" first.']
  return []
}

export interface IndependenceClaimInput {
  observationType: string
  independenceLevel: string
  hintLevel?: number
  /** True only when an independently-correct response followed a materially different problem after a complete-solution reveal. */
  followsMaterializedTransferAfterReveal?: boolean
}

/** Rejects claiming independent understanding merely because a solution was shown — reading a reveal is never itself demonstrated understanding. */
export function validateIndependenceClaim(observation: IndependenceClaimInput): string[] {
  const errors: string[] = []
  if (observation.observationType === 'independent_solution' && observation.independenceLevel !== 'independent') {
    errors.push('An "independent_solution" observation must carry independenceLevel "independent".')
  }
  if (observation.observationType === 'independent_solution' && canRevealCompleteSolution(observation.hintLevel ?? 0) && !observation.followsMaterializedTransferAfterReveal) {
    errors.push('A response immediately following a complete-solution reveal cannot be recorded as "independent_solution" unless it answered a materially different transfer problem.')
  }
  return errors
}
