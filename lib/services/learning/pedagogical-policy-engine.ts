import type { AdaptationDecision, ConceptLearningState, PedagogicalStrategy, RejectedStrategyAlternative } from '@/lib/campus-types'
import { SUBJECT_STRATEGY_CATALOG, STRATEGY_LABEL } from './pedagogical-strategies'

export interface PedagogicalDecisionInput {
  subject: string
  conceptTitle: string
  conceptState: ConceptLearningState
  /** This concept's prior decisions, chronological — length determines which session stage this is. */
  priorDecisions: AdaptationDecision[]
  currentAttempt: { correct?: boolean; hintLevelUsed: number }
}

export type PedagogicalDecisionOutput = Pick<AdaptationDecision, 'strategy' | 'reason' | 'supportingObservationIds' | 'rejectedAlternatives' | 'uncertainty' | 'expectedNextSignal'>

const HEAVY_HINT_THRESHOLD = 3

function catalogFor(subject: string): PedagogicalStrategy[] {
  const catalog = SUBJECT_STRATEGY_CATALOG[subject]
  if (!catalog) throw new Error(`No strategy catalogue registered for subject "${subject}".`)
  return catalog
}

function rejectOthers(catalog: PedagogicalStrategy[], chosen: PedagogicalStrategy, reasonRejected: string): RejectedStrategyAlternative[] {
  return catalog.filter((s) => s !== chosen).map((strategy) => ({ strategy, reasonRejected }))
}

/**
 * Deterministic, rule-based next-teaching-action selector (IAU-001 §7).
 * Pure: identical input always produces an identical decision — no
 * clock reads, no randomness. The three-stage structure below
 * (diagnose -> change strategy -> transfer/retention) is what makes the
 * brief's three-session demonstration a genuine progression rather than
 * three independently-authored scripts: each stage's decision is a
 * function of the previous stage's actual recorded outcome.
 */
export const PedagogicalPolicyEngine = {
  selectNextAction(input: PedagogicalDecisionInput): PedagogicalDecisionOutput {
    const { subject, conceptTitle, conceptState, priorDecisions, currentAttempt } = input
    const catalog = catalogFor(subject)
    const stage = priorDecisions.length

    // Stage 0 — diagnose: no prior decision exists yet for this concept.
    if (stage === 0) {
      const strategy = catalog[0]
      return {
        strategy,
        reason: `First recorded attempt at "${conceptTitle}" — starting with ${STRATEGY_LABEL[strategy]} to see where understanding actually breaks down before choosing anything more targeted.`,
        supportingObservationIds: conceptState.observedFrom,
        rejectedAlternatives: rejectOthers(catalog, strategy, 'Not yet applicable before an initial attempt has been observed.'),
        uncertainty: 'moderate',
        expectedNextSignal: 'Whether this attempt reveals a specific misconception or reasoning gap, or a genuine independent success.',
      }
    }

    // Stage 1 — change strategy: react to what stage 0 actually showed.
    if (stage === 1) {
      const previousStrategy = priorDecisions[0].strategy
      const heavyHints = currentAttempt.hintLevelUsed >= HEAVY_HINT_THRESHOLD
      const hasMisconception = conceptState.recurringMisconceptionIds.length > 0
      const strategy = catalog[1]
      const difficultyDescription = hasMisconception
        ? `a recurring misconception was observed`
        : heavyHints
          ? `${currentAttempt.hintLevelUsed} hints were needed before a correct response`
          : `the first attempt did not yet show independent understanding`
      return {
        strategy,
        reason: `In the previous session, ${difficultyDescription} using ${STRATEGY_LABEL[previousStrategy]} — switching to ${STRATEGY_LABEL[strategy]} and reducing scaffolding where the record justifies it.`,
        supportingObservationIds: conceptState.observedFrom,
        rejectedAlternatives: [
          { strategy: previousStrategy, reasonRejected: 'Already used in the previous session without resolving the difficulty — repeating it is unlikely to help.' },
          ...rejectOthers(catalog, strategy, 'Not yet indicated by the current observation history.').filter((r) => r.strategy !== previousStrategy),
        ],
        uncertainty: hasMisconception ? 'low' : 'moderate',
        expectedNextSignal: 'Whether the changed approach reduces hint dependence and resolves the specific difficulty on retry.',
      }
    }

    // Stage 2 — transfer and retention: react to whether transfer/retention have actually been demonstrated.
    const transferStrategy: PedagogicalStrategy = 'transfer_task'
    const retrievalStrategy: PedagogicalStrategy = 'delayed_retrieval'
    const escalation: PedagogicalStrategy = 'faculty_escalation'

    if (!conceptState.transferAttempted) {
      return {
        strategy: transferStrategy,
        reason: `Independence has improved since the strategy change — asking for transfer to a materially different context is the only way to distinguish real understanding from a memorised pattern.`,
        supportingObservationIds: conceptState.observedFrom,
        rejectedAlternatives: rejectOthers(catalog, transferStrategy, 'Transfer has not yet been attempted, so retention and further scaffolding changes are premature.'),
        uncertainty: 'moderate',
        expectedNextSignal: 'Whether the concept transfers to a new context without the scaffolding used earlier.',
      }
    }

    if (conceptState.transferSucceeded && !conceptState.delayedRetrievalAttempted) {
      return {
        strategy: retrievalStrategy,
        reason: `Transfer succeeded without the earlier scaffolding — the remaining open question is whether that understanding holds after a delay, not whether it exists right now.`,
        supportingObservationIds: conceptState.observedFrom,
        rejectedAlternatives: rejectOthers(catalog, retrievalStrategy, 'Transfer is already demonstrated; repeating an earlier strategy would not test what is actually still uncertain.'),
        uncertainty: 'low',
        expectedNextSignal: 'Whether performance holds on retesting after a genuine delay, independent of immediate scaffolding.',
      }
    }

    if (conceptState.transferSucceeded === false) {
      return {
        strategy: escalation,
        reason: `Transfer did not succeed even after a genuine strategy change — this is exactly the pattern the brief reserves for Faculty escalation rather than another automated retry.`,
        supportingObservationIds: conceptState.observedFrom,
        rejectedAlternatives: rejectOthers(catalog, escalation, 'A further automated strategy change is not indicated after a failed transfer attempt — this belongs to a human reviewer.'),
        uncertainty: 'high',
        expectedNextSignal: "A Faculty reviewer's judgement on whether the underlying prerequisite, not just the current concept, needs revisiting.",
      }
    }

    // Transfer succeeded and delayed retrieval already attempted — the three-session arc is complete for this concept.
    return {
      strategy: retrievalStrategy,
      reason: `Both transfer and a delayed retrieval check have already been recorded for this concept — this session's role is confirmation, not new instruction.`,
      supportingObservationIds: conceptState.observedFrom,
      rejectedAlternatives: rejectOthers(catalog, retrievalStrategy, 'The remaining strategies address problems this concept has already resolved.'),
      uncertainty: 'low',
      expectedNextSignal: 'No further adaptation is indicated for this concept unless a future attempt regresses.',
    }
  },
}
