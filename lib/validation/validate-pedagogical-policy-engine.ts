import type { AdaptationDecision, ConceptLearningState } from '@/lib/campus-types'
import { PedagogicalPolicyEngine, type PedagogicalDecisionInput } from '@/lib/services/learning/pedagogical-policy-engine'

function baseConceptState(overrides: Partial<ConceptLearningState> = {}): ConceptLearningState {
  return {
    id: 'test-concept-state',
    studentId: 'student-1',
    conceptId: 'test-concept',
    chapterId: 'test-chapter',
    currentIndependence: 'fully_guided',
    recurringMisconceptionIds: [],
    hintsUsedLastAttempt: 0,
    transferAttempted: false,
    delayedRetrievalAttempted: false,
    observedFrom: ['obs-1'],
    lastUpdatedAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  }
}

/**
 * Deterministic-replay + scenario tests for PedagogicalPolicyEngine
 * (IAU-001 §7 / brief checklist item 7), following this repository's
 * existing convention of validator functions returning string[] errors
 * rather than a separate test-runner framework.
 */
export function validatePedagogicalPolicyEngine(): string[] {
  const errors: string[] = []

  // 1. Deterministic replay: identical input twice must produce byte-identical output.
  const input: PedagogicalDecisionInput = {
    subject: 'English',
    conceptTitle: 'Narrative irony',
    conceptState: baseConceptState({ recurringMisconceptionIds: ['mc-1'] }),
    priorDecisions: [],
    currentAttempt: { correct: false, hintLevelUsed: 2 },
  }
  const first = PedagogicalPolicyEngine.selectNextAction(input)
  const second = PedagogicalPolicyEngine.selectNextAction(input)
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    errors.push('PedagogicalPolicyEngine is not deterministic: identical input produced different output across two calls.')
  }

  // 2. Stage 0 (diagnose) never has a prior-decision-based reason and always carries moderate uncertainty.
  if (first.uncertainty !== 'moderate') errors.push(`Stage 0 decision should carry moderate uncertainty (no observation yet), got "${first.uncertainty}".`)
  if (first.rejectedAlternatives.length === 0) errors.push('Stage 0 decision rejected no alternatives — every non-chosen strategy should be listed with a reason.')

  // 3. Stage 1 (change strategy) must select a genuinely different strategy than stage 0, and must reference the prior strategy as rejected.
  const stage0Decision: AdaptationDecision = {
    id: 'dec-0',
    studentId: 'student-1',
    conceptId: 'test-concept',
    sessionId: 'session-1',
    decidedAt: '2026-07-27T00:00:00.000Z',
    ...first,
  }
  const stage1 = PedagogicalPolicyEngine.selectNextAction({
    ...input,
    priorDecisions: [stage0Decision],
    currentAttempt: { correct: false, hintLevelUsed: 4 },
  })
  if (stage1.strategy === stage0Decision.strategy) {
    errors.push(`Stage 1 selected the same strategy as stage 0 ("${stage1.strategy}") — a genuine strategy change is required.`)
  }
  if (!stage1.rejectedAlternatives.some((r) => r.strategy === stage0Decision.strategy)) {
    errors.push('Stage 1 decision does not explicitly reject the previously-used strategy.')
  }

  // 4. Stage 2 (transfer): a concept with successful independent transfer but no delayed retrieval yet must select delayed_retrieval, not transfer_task again.
  const stage1Decision: AdaptationDecision = { id: 'dec-1', studentId: 'student-1', conceptId: 'test-concept', sessionId: 'session-2', decidedAt: '2026-07-27T00:00:00.000Z', ...stage1 }
  const transferSucceededState = baseConceptState({ currentIndependence: 'independent', transferAttempted: true, transferSucceeded: true, delayedRetrievalAttempted: false })
  const stage2 = PedagogicalPolicyEngine.selectNextAction({
    ...input,
    conceptState: transferSucceededState,
    priorDecisions: [stage0Decision, stage1Decision],
    currentAttempt: { correct: true, hintLevelUsed: 0 },
  })
  if (stage2.strategy !== 'delayed_retrieval') {
    errors.push(`Expected stage 2 to select delayed_retrieval after successful transfer, got "${stage2.strategy}".`)
  }

  // 5. A failed transfer must escalate to Faculty rather than silently retrying an automated strategy.
  const failedTransferState = baseConceptState({ currentIndependence: 'partially_guided', transferAttempted: true, transferSucceeded: false })
  const escalated = PedagogicalPolicyEngine.selectNextAction({
    ...input,
    conceptState: failedTransferState,
    priorDecisions: [stage0Decision, stage1Decision],
    currentAttempt: { correct: false, hintLevelUsed: 1 },
  })
  if (escalated.strategy !== 'faculty_escalation') {
    errors.push(`Expected a failed transfer to escalate to Faculty, got "${escalated.strategy}".`)
  }

  // 6. Every subject registered in the catalogue must be able to complete all three stages without throwing.
  for (const subject of ['English', 'Geography', 'Economics', 'Political Science']) {
    try {
      const s0 = PedagogicalPolicyEngine.selectNextAction({ subject, conceptTitle: 'X', conceptState: baseConceptState(), priorDecisions: [], currentAttempt: { hintLevelUsed: 0 } })
      const d0: AdaptationDecision = { id: 'd0', studentId: 's', conceptId: 'c', sessionId: 'se', decidedAt: '2026-07-27T00:00:00.000Z', ...s0 }
      PedagogicalPolicyEngine.selectNextAction({ subject, conceptTitle: 'X', conceptState: baseConceptState({ recurringMisconceptionIds: ['m'] }), priorDecisions: [d0], currentAttempt: { hintLevelUsed: 3 } })
    } catch (e) {
      errors.push(`Subject "${subject}" failed to produce a decision: ${String(e)}`)
    }
  }

  return errors
}
