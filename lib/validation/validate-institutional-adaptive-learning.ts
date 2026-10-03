import { ADAPTIVE_LEARNING_FIXTURES } from '@/lib/mock-data/adaptive-learning-seed'
import { getNcertSubjects, getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'
import { getAdaptiveChapterView } from '@/lib/utilities/adaptive-learning-projection'
import { listInterventionQueue } from '@/lib/utilities/faculty-adaptive-projection'

const EXPECTED_ADAPTIVE_CHAPTERS = ['ncert-chapter-eng-1', 'ncert-chapter-geo-1', 'ncert-chapter-eco-3', 'ncert-chapter-pol-4']

/**
 * Deterministic checks against the brief's §23 checklist for the
 * genuinely checkable items. Items that depend on manual visual
 * inspection (regression of /campus or the authenticated portal) or on
 * work explicitly deferred this pass (Department/University projections,
 * the curriculum-evolution workflow) are listed, unchecked, in
 * KNOWN_UNCHECKED_ITEMS rather than faked as passing.
 */
export function validateInstitutionalAdaptiveLearning(): string[] {
  const errors: string[] = []

  // 1. All 26 existing chapter routes still resolve.
  const subjects = getNcertSubjects()
  let totalChapters = 0
  for (const subject of subjects) {
    for (const c of subject.chapters) {
      totalChapters++
      if (!getNcertChapterView(subject.spaceId, c.chapterId)) errors.push(`Chapter route no longer resolves: ${subject.spaceId}/${c.chapterId}`)
    }
  }
  if (totalChapters !== 26) errors.push(`Expected 26 total chapters from PR #16, found ${totalChapters}.`)

  // 4 + 5. The four representative chapters have real three-session adaptive histories, using PR #16's own canonical ids.
  for (const chapterId of EXPECTED_ADAPTIVE_CHAPTERS) {
    const view = getAdaptiveChapterView(chapterId)
    if (!view) {
      errors.push(`Expected an adaptive session history for canonical chapter "${chapterId}", found none.`)
      continue
    }
    if (view.sessions.length !== 3) errors.push(`Chapter "${chapterId}" does not have exactly 3 sessions (found ${view.sessions.length}).`)
  }
  // No other chapter should have fabricated history (IAU-001 §12 boundary).
  for (const subject of subjects) {
    for (const c of subject.chapters) {
      if (!EXPECTED_ADAPTIVE_CHAPTERS.includes(c.chapterId) && getAdaptiveChapterView(c.chapterId)) {
        errors.push(`Chapter "${c.chapterId}" unexpectedly has an adaptive session history — only the four representative chapters should.`)
      }
    }
  }

  for (const fixture of Object.values(ADAPTIVE_LEARNING_FIXTURES)) {
    // 6. Every strategy decision has a non-empty, non-generic reason.
    for (const decision of fixture.learnerModel.decisions) {
      if (!decision.reason || decision.reason.length < 20) errors.push(`Decision ${decision.id} lacks a substantive explanation.`)
    }
    // 9. Hint usage remains visible in the assistance history.
    if (fixture.learnerModel.assistanceHistory.length === 0) errors.push(`Chapter "${fixture.chapterId}" has no recorded assistance history.`)
    // 10. Transfer is a distinct prompt from the original diagnostic activity.
    const [session1, , session3] = fixture.sessionNarratives
    if (session1.activity === session3.activity) errors.push(`Chapter "${fixture.chapterId}": the transfer prompt is identical to the original diagnostic activity.`)
    // 11. Delayed retrieval is distinguishable from immediate transfer success (a real gap in days, not the same timestamp).
    const retention = fixture.learnerModel.retentionObservations[0]
    if (!retention || retention.gapDays <= 0) errors.push(`Chapter "${fixture.chapterId}" has no genuine delayed-retention gap recorded.`)
    // 13 + 15 + 18. Evidence is never unreviewed, and Faculty review gates the AI-use judgement.
    if (fixture.provenance.authorityClass !== 'institutionally_reviewed') errors.push(`Chapter "${fixture.chapterId}": Evidence provenance is not institutionally reviewed.`)
    if (!fixture.aiUse.assistanceRecord.facultyReviewed) errors.push(`Chapter "${fixture.chapterId}": AI-use assistance record is not marked Faculty-reviewed.`)
    // 16 + 17. Copied output vs. verified orchestration is structurally distinguishable — this fixture claims orchestration, so it must carry both a verification action and an independent defence.
    if (fixture.aiUse.assistanceRecord.judgement === 'independent_orchestration') {
      if (fixture.aiUse.assistanceRecord.verificationActionIds.length === 0) errors.push(`Chapter "${fixture.chapterId}": judged independent_orchestration with no recorded verification action.`)
      if (!fixture.aiUse.assistanceRecord.independentDefenceId) errors.push(`Chapter "${fixture.chapterId}": judged independent_orchestration with no independent defence recorded.`)
    }
  }

  // Faculty intervention queue is derived, not invented — every item must trace to one of the four fixtures.
  const queue = listInterventionQueue()
  for (const item of queue) {
    if (!EXPECTED_ADAPTIVE_CHAPTERS.includes(item.chapterId)) errors.push(`Intervention queue item references a chapter outside the four representative ones: ${item.chapterId}`)
  }

  return errors
}

export const KNOWN_UNCHECKED_ITEMS = [
  '#2/#3 — /campus and authenticated-portal non-regression: verified by manual route walkthrough + screenshot, not this validator.',
  '#7 — deterministic replay: covered separately by validate-pedagogical-policy-engine.ts.',
  '#8/#12/#14 — answer-reveal gating, Observation/Evidence separation, Learning-never-mutates-Capability: structural type-system invariants inherited unchanged from the existing Chemistry chain; not re-tested here because nothing in this pass touches that code path.',
  '#19/#20/#21/#22 — curriculum-evolution auto-publish guard, Department/University projection privacy: NOT APPLICABLE — the curriculum-evolution workflow and Department/University institutional-intelligence views were not built this pass (see the completion report\'s honest limitations).',
  '#24/#25/#26/#27/#28 — authoring gate, OCR, live model calls, Global Pathway Intelligence, Vercel domains: true by the simple absence of any such code in this diff, not something a data validator can assert.',
] as const
