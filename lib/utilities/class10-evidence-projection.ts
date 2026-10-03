import { ADAPTIVE_LEARNING_FIXTURES, TEACHER_ACTOR_ID } from '@/lib/mock-data/adaptive-learning-seed'
import {
  MONEY_CREDIT_CAPABILITY_ID,
  MONEY_CREDIT_CHAPTER_ID,
  MONEY_CREDIT_CONCEPT_ID,
  MONEY_CREDIT_SPACE_ID,
  FACULTY_REVIEWER_ID,
} from '@/lib/mock-data/economics-signal-events-seed'
import { capabilityDefinitions } from '@/lib/mock-data/seed'
import { getNcertChapterView, getAllNcertConceptRoutes, getNcertConceptView } from '@/lib/utilities/ncert-curriculum-projection'
import type { LearningObservation } from '@/lib/campus-types'

/**
 * CLASSX-001 §10/§11 — the ONE canonical Class X Evidence chain:
 * Learning Observation -> Evidence candidate -> Faculty review ->
 * accepted Evidence -> Capability support. Reads the same real fixture
 * data class10-capability-projection.ts already consumes (the four
 * ADAPTIVE_LEARNING_FIXTURES chapters plus the Economics "Formal vs.
 * informal credit" canonical-event chain) rather than a second,
 * competing Evidence system. The old university EvidenceRecord/
 * EvidenceStatus model (lib/campus-types/evidence.ts) is untouched and
 * remains visible only on the university-stage regression path.
 *
 * Every record in this demonstration happens to already be reviewed and
 * accepted — there is no fabricated "awaiting review"/"needs revision"/
 * "revoked" instance, because no such case exists in the real
 * demonstration data. Those tabs are still real, structural parts of the
 * Evidence lifecycle; they render honest empty states rather than
 * invented records.
 */
export type ClassXEvidenceLifecycleState = 'evidence_candidate' | 'awaiting_review' | 'accepted' | 'needs_revision' | 'revoked_or_superseded'

const LIFECYCLE_LABEL: Record<ClassXEvidenceLifecycleState, string> = {
  evidence_candidate: 'Evidence candidate',
  awaiting_review: 'Awaiting Faculty review',
  accepted: 'Accepted Evidence',
  needs_revision: 'Needs revision',
  revoked_or_superseded: 'Revoked or superseded',
}

export interface ClassXObservationView {
  id: string
  type: LearningObservation['observationType']
  description: string
  independenceLevel: LearningObservation['independenceLevel']
  hintLevel?: number
  recordedAt: string
}

export interface ClassXEvidenceChainRecord {
  id: string
  subject: string
  spaceId: string
  chapterId: string
  chapterTitle: string
  conceptId: string
  conceptTitle: string
  capabilityId: string
  capabilityName: string
  lifecycleState: ClassXEvidenceLifecycleState
  lifecycleLabel: string
  observations: ClassXObservationView[]
  candidateRationale: string
  candidateSubmittedAt: string
  reviewerId?: string
  reviewedAt?: string
  reviewDecision?: 'accepted' | 'revision_requested' | 'revoked'
  sourceHref: string
}

const SUBJECT_SPACE: Record<string, string> = {
  english: 'ncert-space-english',
  geography: 'ncert-space-geography',
  economics: 'ncert-space-economics',
  politicalScience: 'ncert-space-polisci',
}

const OBSERVATION_DESCRIPTION: Record<LearningObservation['observationType'], string> = {
  attempt: 'A recorded attempt at this concept.',
  misconception: 'A misconception was identified in the response.',
  hint_used: 'A hint was used while attempting this concept.',
  concept_demonstrated: 'The concept was demonstrated correctly.',
  transfer_demonstrated: 'The concept was correctly applied to a new, unpractised scenario.',
  revision_needed: 'The response needs revision before it can support Evidence.',
  independent_solution: 'The concept was solved without assistance.',
  guided_solution: 'The concept was solved correctly with scaffolding still present.',
}

function buildFixtureRecords(): ClassXEvidenceChainRecord[] {
  return Object.entries(ADAPTIVE_LEARNING_FIXTURES).map(([key, fixture]) => {
    const spaceId = SUBJECT_SPACE[key]
    const chapterView = getNcertChapterView(spaceId, fixture.chapterId)
    const capability = capabilityDefinitions.find((c) => c.id === fixture.capabilityId)
    const retention = fixture.learnerModel.retentionObservations[0]

    return {
      id: fixture.evidenceCandidate.id,
      subject: fixture.subject,
      spaceId,
      chapterId: fixture.chapterId,
      chapterTitle: chapterView?.title ?? fixture.chapterId,
      conceptId: fixture.conceptId,
      conceptTitle: fixture.conceptTitle,
      capabilityId: fixture.capabilityId,
      capabilityName: capability?.name ?? fixture.capabilityId,
      lifecycleState: 'accepted',
      lifecycleLabel: LIFECYCLE_LABEL.accepted,
      observations: fixture.observations.map((o) => ({
        id: o.id,
        type: o.observationType,
        description: OBSERVATION_DESCRIPTION[o.observationType],
        independenceLevel: o.independenceLevel,
        hintLevel: o.hintLevel,
        recordedAt: o.recordedAt,
      })),
      candidateRationale: fixture.evidenceCandidate.rationale,
      candidateSubmittedAt: fixture.provenance.importedAt,
      reviewerId: TEACHER_ACTOR_ID,
      reviewedAt: retention?.retestedAt ?? fixture.provenance.importedAt,
      reviewDecision: 'accepted',
      sourceHref: `/student/learning/${spaceId}/${fixture.chapterId}/${fixture.conceptId}`,
    }
  })
}

function buildMoneyCreditSecondConceptRecord(): ClassXEvidenceChainRecord {
  const chapterView = getNcertChapterView(MONEY_CREDIT_SPACE_ID, MONEY_CREDIT_CHAPTER_ID)
  const capability = capabilityDefinitions.find((c) => c.id === MONEY_CREDIT_CAPABILITY_ID)

  return {
    id: 'evidence-candidate-money-credit-001',
    subject: 'Economics',
    spaceId: MONEY_CREDIT_SPACE_ID,
    chapterId: MONEY_CREDIT_CHAPTER_ID,
    chapterTitle: chapterView?.title ?? MONEY_CREDIT_CHAPTER_ID,
    conceptId: MONEY_CREDIT_CONCEPT_ID,
    conceptTitle: 'Formal vs. informal credit',
    capabilityId: MONEY_CREDIT_CAPABILITY_ID,
    capabilityName: capability?.name ?? MONEY_CREDIT_CAPABILITY_ID,
    lifecycleState: 'accepted',
    lifecycleLabel: LIFECYCLE_LABEL.accepted,
    observations: [
      { id: 'evt-money-credit-obs-1', type: 'misconception', description: 'Confuses a single visible cost (interest rate) with the full risk/benefit comparison between formal and informal credit.', independenceLevel: 'substantially_guided', hintLevel: 2, recordedAt: '2026-07-06T09:00:00.000Z' },
      { id: 'evt-money-credit-obs-2', type: 'guided_solution', description: 'Correct comparison reached with a structured table still in front of the student.', independenceLevel: 'partially_guided', hintLevel: 1, recordedAt: '2026-07-13T09:00:00.000Z' },
      { id: 'evt-money-credit-obs-3', type: 'transfer_demonstrated', description: 'Applied the same collateral/urgency/documentation reasoning to a new, unprompted scenario without the comparison table in front of them.', independenceLevel: 'independent', hintLevel: 0, recordedAt: '2026-07-20T09:00:00.000Z' },
    ],
    candidateRationale: 'Independent transfer to a new borrowing scenario, confirmed by a 7-day delayed retention check, on Formal vs. informal credit.',
    candidateSubmittedAt: '2026-07-27T09:05:00.000Z',
    reviewerId: FACULTY_REVIEWER_ID,
    reviewedAt: '2026-07-21T10:00:00.000Z',
    reviewDecision: 'accepted',
    sourceHref: `/student/learning/${MONEY_CREDIT_SPACE_ID}/${MONEY_CREDIT_CHAPTER_ID}/${MONEY_CREDIT_CONCEPT_ID}`,
  }
}

export function getClassXEvidenceChains(): ClassXEvidenceChainRecord[] {
  return [...buildFixtureRecords(), buildMoneyCreditSecondConceptRecord()]
}

export function getClassXEvidenceChain(evidenceId: string): ClassXEvidenceChainRecord | undefined {
  return getClassXEvidenceChains().find((r) => r.id === evidenceId)
}

export interface ClassXNeedsActionItem {
  spaceId: string
  chapterId: string
  chapterTitle: string
  conceptId: string
  conceptTitle: string
  subject: string
  reason: string
  href: string
}

/**
 * Concepts that have not yet produced any Evidence chain in this
 * demonstration — real curriculum routes the student could act on next,
 * never fabricated Evidence. Bounded to one recommendation per subject
 * so the tab stays a short, actionable list rather than all 47 remaining
 * concepts.
 */
export function getClassXNeedsActionItems(): ClassXNeedsActionItem[] {
  const evidencedConceptIds = new Set(getClassXEvidenceChains().map((r) => r.conceptId))
  const seenSubjects = new Set<string>()
  const items: ClassXNeedsActionItem[] = []

  for (const route of getAllNcertConceptRoutes()) {
    if (evidencedConceptIds.has(route.conceptId)) continue
    const view = getNcertConceptView(route.spaceId, route.chapterId, route.conceptId)
    if (!view) continue
    if (seenSubjects.has(view.subject)) continue
    seenSubjects.add(view.subject)
    items.push({
      spaceId: route.spaceId,
      chapterId: route.chapterId,
      chapterTitle: view.chapterTitle,
      conceptId: route.conceptId,
      conceptTitle: view.title,
      subject: view.subject,
      reason: 'Complete this concept to generate your next Learning Observation and Evidence candidate.',
      href: `/student/learning/${route.spaceId}/${route.chapterId}/${route.conceptId}`,
    })
  }

  return items
}
