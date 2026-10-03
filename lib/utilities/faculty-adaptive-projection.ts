import { ADAPTIVE_LEARNING_FIXTURES } from '@/lib/mock-data/adaptive-learning-seed'
import { STRATEGY_LABEL } from '@/lib/services/learning/pedagogical-strategies'
import { capabilityDefinitions } from '@/lib/mock-data/seed'

/**
 * Faculty-facing projections over the same adaptive-learning fixtures the
 * Student view reads — never a second copy of the data, and never
 * exposing anything a Faculty member isn't authorised to see (this is
 * their own student's own coursework, which the existing
 * ObservationVisibilityPolicy already treats as Faculty-visible —
 * IAU-001 §5).
 */

export interface FacultyChapterIntelligence {
  chapterId: string
  subject: string
  conceptTitle: string
  capabilityName: string
  sessionCount: number
  finalStrategyLabel: string
  escalated: boolean
  misconceptionDescriptions: string[]
  assistanceEntries: { sessionNumber: number; hintLevel: number }[]
  transferSucceeded: boolean
  retentionSucceeded: boolean
  evidenceReviewed: boolean
  aiUseJudgement: string
  aiUseFacultyNote?: string
}

const ALL_FIXTURES = Object.values(ADAPTIVE_LEARNING_FIXTURES)
const FIXTURE_BY_CHAPTER = Object.fromEntries(ALL_FIXTURES.map((f) => [f.chapterId, f]))

/** The full fixture (sessions, attempts, misconceptions, observations, learner model, Evidence, AI-use) for Faculty inspection of one chapter — undefined for any of the other 22. */
export function getFacultyChapterDetail(chapterId: string) {
  return FIXTURE_BY_CHAPTER[chapterId]
}

export function listFacultyChapterIntelligence(): FacultyChapterIntelligence[] {
  return ALL_FIXTURES.map((fixture) => {
    const finalDecision = fixture.learnerModel.decisions[fixture.learnerModel.decisions.length - 1]
    const capability = capabilityDefinitions.find((c) => c.id === fixture.capabilityId)
    const finalConceptState = fixture.learnerModel.conceptStates[fixture.learnerModel.conceptStates.length - 1]
    return {
      chapterId: fixture.chapterId,
      subject: fixture.subject,
      conceptTitle: fixture.conceptTitle,
      capabilityName: capability?.name ?? fixture.capabilityId,
      sessionCount: fixture.learnerModel.sessionPlans.length,
      finalStrategyLabel: STRATEGY_LABEL[finalDecision.strategy],
      escalated: finalDecision.strategy === 'faculty_escalation',
      misconceptionDescriptions: fixture.misconceptions.map((m) => m.description),
      assistanceEntries: fixture.learnerModel.assistanceHistory.map((a, i) => ({ sessionNumber: i + 1, hintLevel: a.hintLevel })),
      transferSucceeded: Boolean(finalConceptState.transferSucceeded),
      retentionSucceeded: Boolean(finalConceptState.delayedRetrievalSucceeded),
      evidenceReviewed: true,
      aiUseJudgement: fixture.aiUse.assistanceRecord.judgement ?? 'insufficient_evidence',
      aiUseFacultyNote: fixture.aiUse.assistanceRecord.facultyNote,
    }
  })
}

export type InterventionPriorityReason =
  | 'repeated_misconception'
  | 'heavy_scaffolding_dependence'
  | 'failed_transfer'
  | 'faculty_escalation_flagged'

export interface InterventionQueueItem {
  id: string
  chapterId: string
  subject: string
  conceptTitle: string
  reason: InterventionPriorityReason
  reasonExplanation: string
  priority: 'high' | 'moderate'
}

const HEAVY_HINT_THRESHOLD = 3

/**
 * Deterministically derived from the same fixtures — never invented.
 * Priority reflects the brief's own ordering: escalation and failed
 * transfer first, then heavy scaffolding dependence, then a recorded
 * (but resolved) misconception.
 */
export function listInterventionQueue(): InterventionQueueItem[] {
  const items: InterventionQueueItem[] = []

  for (const fixture of ALL_FIXTURES) {
    const finalDecision = fixture.learnerModel.decisions[fixture.learnerModel.decisions.length - 1]
    const finalConceptState = fixture.learnerModel.conceptStates[fixture.learnerModel.conceptStates.length - 1]

    if (finalDecision.strategy === 'faculty_escalation') {
      items.push({
        id: `intervention-${fixture.chapterId}-escalation`,
        chapterId: fixture.chapterId,
        subject: fixture.subject,
        conceptTitle: fixture.conceptTitle,
        reason: 'faculty_escalation_flagged',
        reasonExplanation: finalDecision.reason,
        priority: 'high',
      })
    }
    if (finalConceptState.transferAttempted && finalConceptState.transferSucceeded === false) {
      items.push({
        id: `intervention-${fixture.chapterId}-transfer`,
        chapterId: fixture.chapterId,
        subject: fixture.subject,
        conceptTitle: fixture.conceptTitle,
        reason: 'failed_transfer',
        reasonExplanation: `Independent transfer to a new context did not succeed after a genuine strategy change — the underlying prerequisite may need revisiting, not just this concept.`,
        priority: 'high',
      })
    }
    const heavyHintEntry = fixture.learnerModel.assistanceHistory.find((a) => a.hintLevel >= HEAVY_HINT_THRESHOLD)
    if (heavyHintEntry) {
      items.push({
        id: `intervention-${fixture.chapterId}-scaffolding`,
        chapterId: fixture.chapterId,
        subject: fixture.subject,
        conceptTitle: fixture.conceptTitle,
        reason: 'heavy_scaffolding_dependence',
        reasonExplanation: `${heavyHintEntry.hintLevel} hints were needed in a single attempt — above the threshold this queue flags for review, even though a later session resolved it independently.`,
        priority: 'moderate',
      })
    }
    if (fixture.misconceptions.length > 0) {
      items.push({
        id: `intervention-${fixture.chapterId}-misconception`,
        chapterId: fixture.chapterId,
        subject: fixture.subject,
        conceptTitle: fixture.conceptTitle,
        reason: 'repeated_misconception',
        reasonExplanation: fixture.misconceptions[0].description,
        priority: 'moderate',
      })
    }
  }

  return items.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1))
}
