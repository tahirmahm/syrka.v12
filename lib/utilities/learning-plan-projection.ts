import { getClassXNeedsActionItems } from '@/lib/utilities/class10-evidence-projection'
import { getAllNcertConceptRoutes, getNcertConceptView } from '@/lib/utilities/ncert-curriculum-projection'
import { getClassXCapabilities } from '@/lib/utilities/class10-capability-projection'
import type { PlanStepInput } from '@/lib/services/learning/providers/types'

export type PlanHorizon = 'interaction' | 'session' | 'week' | 'chapter' | 'term'

const CAPABILITY_BY_SUBJECT: Record<string, string> = {
  English: 'Textual Interpretation and Communication',
  Geography: 'Geographic and Spatial Reasoning',
  Economics: 'Economic Reasoning',
  'Political Science': 'Constitutional and Political Reasoning',
}

function buildCandidate(spaceId: string, chapterId: string, conceptId: string, previousObservation: string, reasonSignal: string): PlanStepInput | undefined {
  const view = getNcertConceptView(spaceId, chapterId, conceptId)
  if (!view) return undefined
  const capabilityName = CAPABILITY_BY_SUBJECT[view.subject] ?? view.subject
  return {
    subject: view.subject,
    chapterTitle: view.chapterTitle,
    conceptTitle: view.title,
    conceptHref: `/student/learning/${spaceId}/${chapterId}/${conceptId}`,
    reasonSignal,
    previousObservation,
    evidenceImplication: `Independent transfer + explain-back here would make this concept Evidence-eligible for ${capabilityName}.`,
    odysseyImplication: `Strengthens the ${capabilityName} preparedness signal already on your NCERT Class X curriculum-progression Odyssey path.`,
  }
}

/**
 * LEARN-002 §3 — real candidates per horizon, never a generic
 * recommendation list. Each horizon selects a genuinely different slice
 * of the same underlying Class X Evidence/needs-action data
 * (class10-evidence-projection.ts), not a relabelled copy of the same
 * four items.
 */
export function buildPlanCandidates(horizon: PlanHorizon): PlanStepInput[] {
  const needsAction = getClassXNeedsActionItems()

  if (horizon === 'interaction') {
    const first = needsAction[0]
    if (!first) return []
    const c = buildCandidate(first.spaceId, first.chapterId, first.conceptId, 'No Learning Observation recorded yet for this concept.', 'The single highest-priority next action across all four subjects.')
    return c ? [c] : []
  }

  if (horizon === 'session') {
    return needsAction.slice(0, 2).flatMap((item) => {
      const c = buildCandidate(item.spaceId, item.chapterId, item.conceptId, 'No Learning Observation recorded yet for this concept.', "Today's two highest-priority concepts across subjects.")
      return c ? [c] : []
    })
  }

  if (horizon === 'week') {
    return needsAction.flatMap((item) => {
      const c = buildCandidate(item.spaceId, item.chapterId, item.conceptId, 'No Learning Observation recorded yet for this concept.', 'One remaining concept per subject — a realistic week of work.')
      return c ? [c] : []
    })
  }

  if (horizon === 'chapter') {
    // English "A Letter to God" — concept 1 already has reviewed Evidence; concept 2 is the chapter's remaining work.
    const routes = getAllNcertConceptRoutes().filter((r) => r.chapterId === 'ncert-chapter-eng-1')
    return routes.flatMap((r, i) => {
      const c = buildCandidate(
        r.spaceId, r.chapterId, r.conceptId,
        i === 0 ? 'Independent transfer already demonstrated and Faculty-reviewed for this concept.' : 'No Learning Observation recorded yet for this concept.',
        'Both concepts in the current chapter, "A Letter to God" — completing the chapter, not just one concept.'
      )
      return c ? [c] : []
    })
  }

  // term: the week's four subjects plus one look-ahead concept in the subject furthest along.
  const weekCandidates = needsAction.flatMap((item) => {
    const c = buildCandidate(item.spaceId, item.chapterId, item.conceptId, 'No Learning Observation recorded yet for this concept.', 'Spread across the term: one concept per subject now, plus what follows.')
    return c ? [c] : []
  })
  const allEconomics = getAllNcertConceptRoutes().filter((r) => r.spaceId === 'ncert-space-economics')
  const lookAheadRoute = allEconomics[2]
  const lookAhead = lookAheadRoute ? buildCandidate(lookAheadRoute.spaceId, lookAheadRoute.chapterId, lookAheadRoute.conceptId, 'Not yet reached — follows after the current Economics chapter.', 'Term look-ahead: the next Economics chapter after the current one.') : undefined
  return lookAhead ? [...weekCandidates, lookAhead] : weekCandidates
}

export function getPlanHorizonSummary(horizon: PlanHorizon): string {
  const capabilities = getClassXCapabilities()
  const reviewed = capabilities.filter((c) => c.state === 'reviewed_evidence_available').length
  const summaries: Record<PlanHorizon, string> = {
    interaction: 'The single next thing to do right now.',
    session: "Today's session — two concepts across subjects.",
    week: `This week — one remaining concept in each of the four subjects. ${reviewed} of ${capabilities.length} capabilities currently have reviewed Evidence.`,
    chapter: 'Finishing the current chapter, "A Letter to God" — both its concepts, not just the next one.',
    term: 'Across the term — this week\'s four concepts plus a look at what comes next in Economics.',
  }
  return summaries[horizon]
}
