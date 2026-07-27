import type { IndependenceLevel } from './learning-observation'

/**
 * Syrka Learning — interaction domain (what happens during teaching).
 * Kept separate from the content domain (learning-content.ts) and the
 * observation domain (learning-observation.ts) — an interaction is an
 * event; an observation is what Syrka concludes from it.
 */

export type TutorMode = 'socratic' | 'explain' | 'practice' | 'exam' | 'review' | 'visualise'

export type TutorState =
  | 'diagnose'
  | 'elicit_attempt'
  | 'classify_misconception'
  | 'hint'
  | 'scaffold'
  | 'challenge'
  | 'check_understanding'
  | 'transfer'
  | 'reflection'
  | 'summarise'
  | 'request_visual'
  | 'propose_evidence_mission'

/** One permitted edge in the Tutor state machine — see lib/services/learning/tutor-state-machine.ts for the validator built on this table. */
export interface TutorTransition {
  from: TutorState
  to: TutorState
  /** Modes in which this transition is permitted; omitted means all modes. */
  allowedModes?: TutorMode[]
}

/** One session — a bounded Tutor conversation over a lesson, in one mode, moving through TutorStates. */
export interface LearningSession {
  id: string
  studentId: string
  lessonId: string
  mode: TutorMode
  currentState: TutorState
  startedAt: string
  endedAt?: string
}

/** One student attempt at a specific question within a session. */
export interface LearningAttempt {
  id: string
  sessionId: string
  studentId: string
  questionId: string
  hintLevelUsed: number
  independenceLevel: IndependenceLevel
  submittedAt: string
  correct?: boolean
}

/** One rung of the hint ladder actually issued during a session. */
export interface TutorHint {
  id: string
  sessionId: string
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  issuedAt: string
}

/**
 * The persisted record of one validated Tutor turn — the structured,
 * server-validated output (matching the checkpoint's LearningTutorTurn
 * shape) once it has passed validation, not the model's raw text.
 */
export interface TutorResponse {
  id: string
  sessionId: string
  intent:
    | 'diagnose'
    | 'question'
    | 'hint'
    | 'explain'
    | 'challenge'
    | 'check_understanding'
    | 'transfer'
    | 'request_visual'
    | 'summarise'
    | 'propose_evidence_mission'
  text: string
  hintLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  mayRevealFinalAnswer: boolean
  recommendedNextState: TutorState
  sourceReferenceIds: string[]
  visualRequestId?: string
  recordedAt: string
}

export interface MisconceptionRecord {
  id: string
  studentId: string
  conceptId: string
  description: string
  firstObservedAt: string
  recurrenceCount: number
}

export interface ReflectionRecord {
  id: string
  sessionId: string
  studentId: string
  prompt: string
  response: string
  recordedAt: string
}
