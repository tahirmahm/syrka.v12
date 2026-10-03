import { ADAPTIVE_LEARNING_FIXTURES } from '@/lib/mock-data/adaptive-learning-seed'
import { STRATEGY_LABEL } from '@/lib/services/learning/pedagogical-strategies'
import type { EvidencePipelineStage } from '@/lib/utilities/learning-projection'
import type { AdaptationDecision, PedagogicalMemoryEntry } from '@/lib/campus-types'

export interface AdaptiveSessionView {
  sessionNumber: 1 | 2 | 3
  goal: string
  startedAt: string
  activity: string
  studentResponse: string
  strategyLabel: string
  reason: string
  rejectedAlternatives: { strategyLabel: string; reasonRejected: string }[]
  uncertainty: AdaptationDecision['uncertainty']
  expectedNextSignal: string
}

export interface AdaptiveChapterView {
  chapterId: string
  conceptId: string
  conceptTitle: string
  capabilityId: string
  sessions: AdaptiveSessionView[]
  memory: PedagogicalMemoryEntry[]
  evidencePipeline: EvidencePipelineStage[]
  evidenceEligible: boolean
  aiUse: {
    toolUsed: string
    declaredPurpose: string
    taskCategories: string[]
    verification: string
    detectedError: string
    independentDefence: string
    judgement: string
    facultyNote?: string
  }
}

const GOAL_LABEL: Record<string, string> = { diagnose: 'Diagnose', change_strategy: 'Change strategy', transfer_and_retention: 'Transfer and retention' }

const FIXTURES_BY_CHAPTER = Object.fromEntries(Object.values(ADAPTIVE_LEARNING_FIXTURES).map((f) => [f.chapterId, f]))

/** Returns the full adaptive-learning view for one of the four representative chapters, or undefined for any of the other 22 (which intentionally have no session history). */
export function getAdaptiveChapterView(chapterId: string): AdaptiveChapterView | undefined {
  const fixture = FIXTURES_BY_CHAPTER[chapterId]
  if (!fixture) return undefined

  const { learnerModel, sessionNarratives, evidenceCandidate, capabilityInference, aiUse } = fixture

  const sessions: AdaptiveSessionView[] = learnerModel.sessionPlans.map((plan) => {
    const decision = learnerModel.decisions.find((d) => d.id === plan.decisionId)
    const narrative = sessionNarratives.find((n) => n.sessionNumber === plan.sessionNumber)
    return {
      sessionNumber: plan.sessionNumber,
      goal: GOAL_LABEL[plan.goal] ?? plan.goal,
      startedAt: plan.createdAt,
      activity: narrative?.activity ?? '',
      studentResponse: narrative?.studentResponse ?? '',
      strategyLabel: decision ? STRATEGY_LABEL[decision.strategy] : '',
      reason: decision?.reason ?? '',
      rejectedAlternatives: (decision?.rejectedAlternatives ?? []).map((r) => ({ strategyLabel: STRATEGY_LABEL[r.strategy], reasonRejected: r.reasonRejected })),
      uncertainty: decision?.uncertainty ?? 'moderate',
      expectedNextSignal: decision?.expectedNextSignal ?? '',
    }
  })

  const evidencePipeline: EvidencePipelineStage[] = [
    { id: 'attempt', label: 'Attempt', status: 'complete', detail: 'Three sessions of real attempts recorded, moving from guided to independent.' },
    { id: 'observation', label: 'Learning Observation', status: 'complete', detail: 'Independent transfer observed and recorded.' },
    { id: 'evidence-candidate', label: 'Evidence candidate', status: 'complete', detail: evidenceCandidate.rationale },
    { id: 'teacher-review', label: 'Teacher review', status: 'complete', detail: 'Institutionally reviewed.' },
    { id: 'capability-support', label: 'Capability support', status: 'complete', detail: `Supports "${capabilityInference.capabilityId}" at ${capabilityInference.confidence.band} confidence (${Math.round(capabilityInference.confidence.score * 100)}%).` },
    { id: 'passport-eligibility', label: 'Career Passport eligibility', status: 'complete', detail: 'Disclosed to the Career Passport audience.' },
  ]

  return {
    chapterId,
    conceptId: fixture.conceptId,
    conceptTitle: fixture.conceptTitle,
    capabilityId: fixture.capabilityId,
    sessions,
    memory: learnerModel.memory,
    evidencePipeline,
    evidenceEligible: true,
    aiUse: {
      toolUsed: aiUse.disclosure.toolOrTutorUsed,
      declaredPurpose: aiUse.disclosure.declaredPurpose,
      taskCategories: aiUse.disclosure.taskCategories,
      verification: aiUse.verificationAction.description,
      detectedError: aiUse.detectedError.description,
      independentDefence: aiUse.independentDefence.explanation,
      judgement: aiUse.assistanceRecord.judgement ?? 'insufficient_evidence',
      facultyNote: aiUse.assistanceRecord.facultyNote,
    },
  }
}
