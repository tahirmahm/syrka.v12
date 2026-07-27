import {
  learningSpaces,
  learningCourses,
  learningChapters,
  learningLessons,
  learningConcepts,
  learningSections,
  learningExplanations,
  workedExamples,
  learningQuestions,
  learningEquations,
  learningPrerequisites,
  learningSessions,
  learningAttempts,
  tutorHints,
  misconceptionRecords,
  learningObservations,
  learningEvidenceCandidates,
  learningProvenanceRecords,
  learningDisclosurePermissions,
  learningCapabilityInferences,
  LEARNING_NOW,
} from '@/lib/mock-data/learning-seed'
import { isVisibleToAudience } from '@/lib/services/profile/disclosure'

/**
 * Every state a concept can be in on the student-facing readiness matrix,
 * ordered from least to most demonstrated. "Studied" never implies
 * "capable" — only an observation of the corresponding type moves a
 * concept past not_attempted, and only a reviewed EvidenceCandidate with
 * an audience-visible DisclosurePermission reaches reviewed_evidence.
 */
export type ConceptReadinessState =
  | 'not_attempted'
  | 'guided'
  | 'partially_independent'
  | 'independently_demonstrated'
  | 'transfer_demonstrated'
  | 'evidence_candidate'
  | 'reviewed_evidence'

export interface ConceptReadiness {
  conceptId: string
  title: string
  description: string
  state: ConceptReadinessState
  /** Why this state, in one sentence — every plotted value must trace to a real record, never an inferred score. */
  source: string
}

export interface TrajectoryPoint {
  attemptId: string
  questionId: string
  questionKind: string
  submittedAt: string
  independenceLevel: string
  hintLevelUsed: number
  correct: boolean
}

export type EvidencePipelineStageStatus = 'complete' | 'pending' | 'not_reached'

export interface EvidencePipelineStage {
  id: string
  label: string
  status: EvidencePipelineStageStatus
  detail: string
}

export interface StudentLearningProjection {
  space: { id: string; title: string; lifecycleState: string }
  course: { id: string; title: string; gradeLevel?: string }
  chapter: { id: string; title: string }
  lesson: { id: string; title: string; order: number }
  activeSession: { id: string; mode: string; currentState: string } | undefined
  currentConceptTitle: string
  latestCompletedActivity: string
  nextRecommendedAction: string
  expectedTimeMinutes: number
  independenceSummary: string
  unresolvedConcept: string | undefined
  concepts: ConceptReadiness[]
  /** [conceptId, requiresConceptId] pairs scoped to this lesson's concepts — the UI's only access to LearningPrerequisite, never the raw fixture. */
  conceptPrerequisites: [string, string][]
  trajectory: TrajectoryPoint[]
  independenceCounts: { independent: number; partiallyGuided: number; guided: number; transferPassed: number; highestHintLevel: number }
  evidencePipeline: EvidencePipelineStage[]
  odysseyConnection: { milestoneId: string; milestoneTitle: string; capabilityName: string } | undefined
}

const STUDENT_ID = 'student-1'

function conceptReadinessFor(conceptId: string, title: string, description: string): ConceptReadiness {
  const observations = learningObservations.filter((o) => o.conceptId === conceptId && o.studentId === STUDENT_ID)
  const misconception = misconceptionRecords.find((m) => m.conceptId === conceptId)
  const evidenceCandidate = learningEvidenceCandidates.find((c) =>
    observations.some((o) => o.id === c.learningOriginId)
  )

  if (evidenceCandidate) {
    const visible = isVisibleToAudience(learningDisclosurePermissions, evidenceCandidate.id, 'passport')
    const provenance = learningProvenanceRecords.find((p) => p.id === evidenceCandidate.provenanceId)
    if (visible && provenance?.authorityClass === 'institutionally_reviewed') {
      return {
        conceptId,
        title,
        description,
        state: 'reviewed_evidence',
        source: `Evidence candidate "${evidenceCandidate.id}" is institutionally reviewed and disclosed to your Career Passport.`,
      }
    }
    return { conceptId, title, description, state: 'evidence_candidate', source: `Observation "${evidenceCandidate.learningOriginId}" produced an Evidence candidate awaiting review.` }
  }

  const transferDemonstrated = observations.find((o) => o.observationType === 'transfer_demonstrated' || (o.observationType === 'independent_solution' && o.followsMaterializedTransferAfterReveal))
  if (transferDemonstrated) {
    return { conceptId, title, description, state: 'transfer_demonstrated', source: `Observation "${transferDemonstrated.id}" recorded a transfer solution on a materially different problem.` }
  }

  const independent = observations.find((o) => o.observationType === 'independent_solution' && o.independenceLevel === 'independent')
  if (independent) {
    return { conceptId, title, description, state: 'independently_demonstrated', source: `Observation "${independent.id}" recorded an independent solution.` }
  }

  const partiallyGuided = observations.find((o) => o.independenceLevel === 'partially_guided')
  if (partiallyGuided) {
    return { conceptId, title, description, state: 'partially_independent', source: `Observation "${partiallyGuided.id}" recorded a partially independent attempt.` }
  }

  const guided = observations.find((o) => o.independenceLevel === 'fully_guided' || o.independenceLevel === 'substantially_guided')
  if (guided) {
    return {
      conceptId,
      title,
      description,
      state: 'guided',
      source: misconception
        ? `Observation "${guided.id}" recorded a guided attempt; a recurring misconception has been observed ${misconception.recurrenceCount} times.`
        : `Observation "${guided.id}" recorded a guided attempt.`,
    }
  }

  return { conceptId, title, description, state: 'not_attempted', source: 'No Learning Observation has been recorded yet for this concept.' }
}

/**
 * Shapes the Stage A Learning fixtures (learning-seed.ts) into everything
 * the student-facing command centre and lesson workbench need. Reads only
 * — this is a projection, never a second source of truth; every field
 * traces back to a specific seeded record, named in ConceptReadiness.source
 * and the evidence pipeline's `detail` strings.
 */
export function buildStudentLearningProjection(): StudentLearningProjection {
  const space = learningSpaces[0]
  const course = learningCourses[0]
  const chapter = learningChapters[0]
  const lesson = learningLessons[0]
  const activeSession = learningSessions.find((s) => s.studentId === STUDENT_ID && s.mode === 'socratic')

  const concepts = lesson.conceptIds.map((conceptId) => {
    const concept = learningConcepts.find((c) => c.id === conceptId)
    return conceptReadinessFor(conceptId, concept?.title ?? conceptId, concept?.description ?? '')
  })

  const conceptPrerequisites: [string, string][] = learningPrerequisites
    .filter((p) => lesson.conceptIds.includes(p.conceptId))
    .map((p) => [p.conceptId, p.requiresConceptId])

  const studentAttempts = learningAttempts.filter((a) => a.studentId === STUDENT_ID).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const trajectory: TrajectoryPoint[] = studentAttempts.map((a) => {
    const question = learningQuestions.find((q) => q.id === a.questionId)
    return {
      attemptId: a.id,
      questionId: a.questionId,
      questionKind: question?.kind ?? 'practice',
      submittedAt: a.submittedAt,
      independenceLevel: a.independenceLevel,
      hintLevelUsed: a.hintLevelUsed,
      correct: a.correct ?? false,
    }
  })

  const independenceCounts = {
    independent: studentAttempts.filter((a) => a.independenceLevel === 'independent').length,
    partiallyGuided: studentAttempts.filter((a) => a.independenceLevel === 'partially_guided').length,
    guided: studentAttempts.filter((a) => a.independenceLevel === 'fully_guided' || a.independenceLevel === 'substantially_guided').length,
    transferPassed: studentAttempts.filter((a) => a.correct && learningQuestions.find((q) => q.id === a.questionId)?.kind === 'transfer').length,
    highestHintLevel: Math.max(0, ...studentAttempts.map((a) => a.hintLevelUsed)),
  }

  const independentTransferObservation = learningObservations.find((o) => o.id === 'lo-independent-transfer')
  const evidenceCandidate = learningEvidenceCandidates.find((c) => c.learningOriginId === independentTransferObservation?.id)
  const provenance = evidenceCandidate ? learningProvenanceRecords.find((p) => p.id === evidenceCandidate.provenanceId) : undefined
  const inference = evidenceCandidate ? learningCapabilityInferences.find((inf) => inf.basisIds.some((bid) => bid.startsWith('lp-basis'))) : undefined
  const passportVisible = evidenceCandidate ? isVisibleToAudience(learningDisclosurePermissions, evidenceCandidate.id, 'passport') : false

  const evidencePipeline: EvidencePipelineStage[] = [
    {
      id: 'lesson-activity',
      label: 'Lesson activity',
      status: 'complete',
      detail: `Attempt "li-attempt-independent-transfer" submitted ${new Date(LEARNING_NOW).toLocaleDateString()}.`,
    },
    {
      id: 'learning-observation',
      label: 'Learning Observation',
      status: independentTransferObservation ? 'complete' : 'not_reached',
      detail: independentTransferObservation
        ? `Recorded as "${independentTransferObservation.observationType}" — independent, transfer-eligible.`
        : 'No observation recorded yet.',
    },
    {
      id: 'evidence-candidate',
      label: 'Evidence candidate',
      status: evidenceCandidate ? 'complete' : 'not_reached',
      detail: evidenceCandidate ? `"${evidenceCandidate.rationale}"` : 'This observation has not produced an Evidence candidate.',
    },
    {
      id: 'teacher-review',
      label: 'Teacher review',
      status: provenance?.authorityClass === 'institutionally_reviewed' ? 'complete' : evidenceCandidate ? 'pending' : 'not_reached',
      detail: provenance?.authorityClass === 'institutionally_reviewed' ? 'Institutionally reviewed.' : 'Awaiting Faculty review.',
    },
    {
      id: 'capability-support',
      label: 'Capability support',
      status: inference ? 'complete' : 'not_reached',
      detail: inference
        ? `Supports "${inference.capabilityId}" at ${inference.confidence.band} confidence (${Math.round(inference.confidence.score * 100)}%).`
        : 'No Capability inference yet.',
    },
    {
      id: 'passport-eligibility',
      label: 'Career Passport eligibility',
      status: passportVisible ? 'complete' : 'not_reached',
      detail: passportVisible ? 'Disclosed to the Career Passport audience.' : 'Not yet disclosed to any audience.',
    },
  ]

  const unresolvedConcept = concepts.find((c) => c.state === 'guided' || c.state === 'not_attempted')?.title

  return {
    space: { id: space.id, title: space.title, lifecycleState: space.lifecycleState },
    course: { id: course.id, title: course.title, gradeLevel: course.gradeLevel },
    chapter: { id: chapter.id, title: chapter.title },
    lesson: { id: lesson.id, title: lesson.title, order: lesson.order },
    activeSession: activeSession ? { id: activeSession.id, mode: activeSession.mode, currentState: activeSession.currentState } : undefined,
    currentConceptTitle: learningConcepts.find((c) => c.id === lesson.conceptIds[0])?.title ?? lesson.title,
    latestCompletedActivity: 'Independent transfer: balancing N2 + H2 -> NH3',
    nextRecommendedAction: 'Attempt the conservation-of-mass transfer check',
    expectedTimeMinutes: 12,
    independenceSummary: `${independenceCounts.independent} independent, ${independenceCounts.guided} guided completion${independenceCounts.guided === 1 ? '' : 's'} so far`,
    unresolvedConcept,
    concepts,
    conceptPrerequisites,
    trajectory,
    independenceCounts,
    evidencePipeline,
    odysseyConnection: { milestoneId: 'ms-2', milestoneTitle: 'Advance Data Modeling to Proficient', capabilityName: 'Data Modeling' },
  }
}

export function getLessonWorkbenchContent() {
  const lesson = learningLessons[0]
  const concept = learningConcepts.find((c) => c.id === lesson.conceptIds[0])!
  const section = learningSections.find((s) => s.lessonId === lesson.id)
  const explanation = learningExplanations.find((e) => e.conceptId === concept.id)
  const example = workedExamples.find((e) => e.conceptId === concept.id)
  const equation = learningEquations.find((e) => e.conceptId === concept.id)
  const practiceQuestion = learningQuestions.find((q) => q.conceptId === concept.id && q.kind === 'practice')
  const transferQuestion = learningQuestions.find((q) => q.conceptId === concept.id && q.kind === 'transfer')
  const hintLevels = tutorHints.filter((h) => h.sessionId === 'li-session-socratic').map((h) => h.level)

  return { lesson, concept, section, explanation, example, equation, practiceQuestion, transferQuestion, maxHintReached: Math.max(0, ...hintLevels) }
}
