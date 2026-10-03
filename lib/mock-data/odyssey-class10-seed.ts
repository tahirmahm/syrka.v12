import type {
  OdysseyDestination,
  OdysseyLearnerStageContext,
  OdysseyInstitutionalResource,
  OdysseyPlan,
  OdysseyPlanVersion,
  OdysseyMilestone,
  OdysseyAction,
  OdysseyEvidenceRequirement,
  OdysseyExpectedImpact,
  OdysseyRecommendationFactor,
  OdysseyConstraint,
  OdysseyBlocker,
  OdysseyAlternativeAction,
} from '@/lib/campus-types'
import { getNcertSubjects, getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'
import { ADAPTIVE_LEARNING_FIXTURES } from '@/lib/mock-data/adaptive-learning-seed'
import { MONEY_CREDIT_SPACE_ID, MONEY_CREDIT_CHAPTER_ID, MONEY_CREDIT_CAPABILITY_ID, FACULTY_REVIEWER_ID } from '@/lib/mock-data/economics-signal-events-seed'

/**
 * Odyssey product correction — the default Odyssey for the Class X
 * demonstration student. Built entirely from the real, already-canonical
 * 26-chapter NCERT curriculum (PR #16) and the real adaptive learner-model
 * fixtures (PR #17's IAU-001 pass) — no chapter content is duplicated
 * here, only referenced by id, and no unsupplied subject (Maths, Science,
 * History, etc.) is invented. This replaces the university/"Data
 * Scientist" fixture (lib/mock-data/odyssey-seed.ts) as the DEFAULT for
 * student-1; that fixture is preserved unchanged for the university-stage
 * regression case (see odyssey-repository.ts).
 */

export const CLASS10_STAGE_CONTEXT: OdysseyLearnerStageContext = {
  stage: 'secondary_class_10',
  curriculumLabel: 'NCERT Class X demonstration curriculum',
  institutionLabel: 'NCERT Class X · Syrka Demonstration School',
  defaultPathwayType: 'curriculum_progression',
}

export const class10Destination: OdysseyDestination = {
  id: 'dest-class10-curriculum',
  title: 'NCERT Class X curriculum progression',
  description: 'Complete and demonstrate understanding of the supplied NCERT Class X curriculum — English, Geography, Economics, and Political Science — building the concepts, transfer, and reviewed Evidence a broader academic direction would later draw on.',
  pathwayType: 'curriculum_progression',
}

const subjects = getNcertSubjects()

function chapterViewOrThrow(spaceId: string, chapterId: string) {
  const view = getNcertChapterView(spaceId, chapterId)
  if (!view) throw new Error(`Odyssey Class X seed: canonical chapter ${spaceId}/${chapterId} did not resolve — curriculum data may have changed.`)
  return view
}

interface SubjectPlan {
  spaceId: string
  subjectLane: string
  representativeChapterId: string
  fixtureKey: keyof typeof ADAPTIVE_LEARNING_FIXTURES
}

const SUBJECT_PLANS: SubjectPlan[] = [
  { spaceId: 'ncert-space-english', subjectLane: 'English', representativeChapterId: 'ncert-chapter-eng-1', fixtureKey: 'english' },
  { spaceId: 'ncert-space-geography', subjectLane: 'Geography', representativeChapterId: 'ncert-chapter-geo-1', fixtureKey: 'geography' },
  { spaceId: 'ncert-space-economics', subjectLane: 'Economics', representativeChapterId: 'ncert-chapter-eco-3', fixtureKey: 'economics' },
  { spaceId: 'ncert-space-polisci', subjectLane: 'Political Science', representativeChapterId: 'ncert-chapter-pol-4', fixtureKey: 'politicalScience' },
]

const actions: OdysseyAction[] = []
const evidenceRequirements: OdysseyEvidenceRequirement[] = []
const expectedImpacts: OdysseyExpectedImpact[] = []
const recommendationFactors: OdysseyRecommendationFactor[] = []
const milestones: OdysseyMilestone[] = []
const institutionalResources: OdysseyInstitutionalResource[] = []

let rfSeq = 0
function addFactor(f: Omit<OdysseyRecommendationFactor, 'id'>): string {
  rfSeq += 1
  const id = `class10-rf-${rfSeq}`
  recommendationFactors.push({ id, ...f })
  return id
}

for (const plan of SUBJECT_PLANS) {
  const repView = chapterViewOrThrow(plan.spaceId, plan.representativeChapterId)
  const subject = subjects.find((s) => s.spaceId === plan.spaceId)
  const nextChapter = repView.nextChapter

  institutionalResources.push({
    id: `class10-res-${plan.fixtureKey}-current`,
    type: 'chapter',
    title: `${plan.subjectLane} — ${repView.title}`,
    description: repView.overview,
    relatedCapabilityIds: [repView.capability.id],
  })
  if (nextChapter) {
    institutionalResources.push({
      id: `class10-res-${plan.fixtureKey}-next`,
      type: 'chapter',
      title: `${plan.subjectLane} — ${nextChapter.title}`,
      description: `Chapter ${subject?.chapters.find((c) => c.chapterId === nextChapter.chapterId)?.order ?? '?'} of ${plan.subjectLane}.`,
      relatedCapabilityIds: [repView.capability.id],
    })
  }

  const transferRf = addFactor({
    type: 'completed_work',
    summary: `Independent transfer and a delayed retention check both succeeded on "${repView.title}" — ${plan.subjectLane}'s strongest evidenced concept so far.`,
    relatedCapabilityId: repView.capability.id,
  })

  const currentMilestoneId = `class10-ms-${plan.fixtureKey}-current`
  const currentAction: OdysseyAction = {
    id: `class10-action-${plan.fixtureKey}-current`,
    type: 'module',
    title: `Review "${repView.title}"`,
    description: 'Revisit the chapter workbench, Learning Intelligence timeline, and reviewed Evidence for this concept.',
    developsCapabilityIds: [repView.capability.id],
    producesEvidenceRequirementIds: [],
    requiresReview: false,
    resourceId: `class10-res-${plan.fixtureKey}-current`,
    isAiProposed: false,
  }
  actions.push(currentAction)
  const currentImpact: OdysseyExpectedImpact = { id: `class10-impact-${plan.fixtureKey}-current`, capabilityId: repView.capability.id, projectedMaturity: 'Developing', projectedConfidence: 'Supported', isProjection: true }
  expectedImpacts.push(currentImpact)

  milestones.push({
    id: currentMilestoneId,
    type: 'chapter_progress',
    title: repView.title,
    description: `${plan.subjectLane} · Chapter ${repView.order} — independent transfer demonstrated, confirmed by a 7-day delayed retention check, teacher-reviewed.`,
    capabilityIds: [repView.capability.id],
    prerequisiteMilestoneIds: [],
    currentMaturity: 'Developing',
    targetMaturity: 'Developing',
    currentConfidence: 'Supported',
    targetConfidence: 'Supported',
    actionIds: [currentAction.id],
    evidenceRequirementIds: [],
    expectedImpactIds: [currentImpact.id],
    reasoningSummary: `Reviewed Evidence from this chapter's three sessions (diagnose, change strategy, transfer and retention) already supports ${repView.capability.name}.`,
    alternativeActionIds: [],
    constraintIds: [],
    recommendationConfidence: 'Strong',
    status: 'verified',
    sourceSignalIds: [transferRf],
    planVersionId: 'class10-planv-1',
    completionImpact: 'Already complete — this Evidence supports the current Career Passport claim for this capability.',
    subjectLane: plan.subjectLane,
    learningRoute: { spaceId: plan.spaceId, chapterId: plan.representativeChapterId },
  })

  if (nextChapter) {
    const nextRf = addFactor({
      type: 'prerequisite',
      summary: `"${repView.title}" is complete, so "${nextChapter.title}" is the next unattempted chapter in ${plan.subjectLane}.`,
      relatedCapabilityId: repView.capability.id,
    })
    const nextAction: OdysseyAction = {
      id: `class10-action-${plan.fixtureKey}-next`,
      type: 'module',
      title: `Continue chapter — "${nextChapter.title}"`,
      description: 'Open the chapter workbench and attempt its guided activity for the first time.',
      developsCapabilityIds: [repView.capability.id],
      producesEvidenceRequirementIds: [`class10-evreq-${plan.fixtureKey}-next`],
      requiresReview: true,
      resourceId: `class10-res-${plan.fixtureKey}-next`,
      isAiProposed: false,
    }
    actions.push(nextAction)
    const nextEvreq: OdysseyEvidenceRequirement = {
      id: `class10-evreq-${plan.fixtureKey}-next`,
      description: `A first attempt on "${nextChapter.title}" that could become an Evidence mission once independently transferred and teacher-reviewed.`,
      satisfiedByEvidenceIds: [],
    }
    evidenceRequirements.push(nextEvreq)
    const nextImpact: OdysseyExpectedImpact = { id: `class10-impact-${plan.fixtureKey}-next`, capabilityId: repView.capability.id, projectedMaturity: 'Developing', projectedConfidence: 'Emerging', isProjection: true }
    expectedImpacts.push(nextImpact)

    milestones.push({
      id: `class10-ms-${plan.fixtureKey}-next`,
      type: 'evidence_mission',
      title: nextChapter.title,
      description: `${plan.subjectLane} · Chapter ${subject?.chapters.find((c) => c.chapterId === nextChapter.chapterId)?.order ?? '?'} — not yet attempted.`,
      capabilityIds: [repView.capability.id],
      prerequisiteMilestoneIds: [currentMilestoneId],
      actionIds: [nextAction.id],
      evidenceRequirementIds: [nextEvreq.id],
      expectedImpactIds: [nextImpact.id],
      reasoningSummary: 'Recommended next because the prerequisite chapter in this lane is already reviewed and verified — no other chapter in this lane is currently blocking it.',
      alternativeActionIds: [],
      constraintIds: [],
      recommendationConfidence: 'Supported',
      status: 'recommended',
      sourceSignalIds: [nextRf],
      planVersionId: 'class10-planv-1',
      completionImpact: `Would produce a first Evidence mission for "${nextChapter.title}" once submitted and teacher-reviewed.`,
      subjectLane: plan.subjectLane,
      learningRoute: { spaceId: plan.spaceId, chapterId: nextChapter.chapterId },
    })
  }
}

// --- Economics concept-2 ("Formal vs. informal credit") — genuinely in-progress, distinct from the fully-reviewed concept-1 chain above ---
const moneyCreditChapterView = chapterViewOrThrow(MONEY_CREDIT_SPACE_ID, MONEY_CREDIT_CHAPTER_ID)
const revisionRf = addFactor({
  type: 'evidence_gap',
  summary: 'Independent transfer on formal-vs-informal credit succeeded on July 20, but no retention check beyond the 7-day mark has been attempted yet — unlike Money and Credit’s other concept, which already has one.',
  relatedCapabilityId: MONEY_CREDIT_CAPABILITY_ID,
})
const revisionAction: OdysseyAction = {
  id: 'class10-action-money-credit-revision',
  type: 'assessment',
  title: 'Revisit formal vs. informal credit after a longer gap',
  description: 'Re-justify the formal/informal credit distinction from memory, without notes, after a longer interval than the 7-day check already passed.',
  developsCapabilityIds: [MONEY_CREDIT_CAPABILITY_ID],
  producesEvidenceRequirementIds: [],
  requiresReview: true,
  resourceId: undefined,
  isAiProposed: false,
}
actions.push(revisionAction)
const revisionImpact: OdysseyExpectedImpact = { id: 'class10-impact-money-credit-revision', capabilityId: MONEY_CREDIT_CAPABILITY_ID, projectedMaturity: 'Developing', projectedConfidence: 'Strong', isProjection: true }
expectedImpacts.push(revisionImpact)
milestones.push({
  id: 'class10-ms-money-credit-revision',
  type: 'revision',
  title: 'Formal vs. informal credit — longer-interval retention check',
  description: `Economics · ${moneyCreditChapterView.title} — a second concept in the same chapter as the fully-verified "Functions of money," genuinely still mid-loop.`,
  capabilityIds: [MONEY_CREDIT_CAPABILITY_ID],
  prerequisiteMilestoneIds: [],
  currentMaturity: 'Developing',
  targetMaturity: 'Developing',
  currentConfidence: 'Supported',
  targetConfidence: 'Strong',
  actionIds: [revisionAction.id],
  evidenceRequirementIds: [],
  expectedImpactIds: [revisionImpact.id],
  reasoningSummary: 'Review formal and informal credit through a new household scenario because the earlier attempt succeeded only after guided classification, and a longer-interval retention check remains outstanding even though the first transfer and 7-day check both succeeded.',
  alternativeActionIds: [],
  constraintIds: [],
  recommendationConfidence: 'Supported',
  status: 'recommended',
  sourceSignalIds: [revisionRf],
  planVersionId: 'class10-planv-1',
  completionImpact: 'Would strengthen the existing Economic Reasoning Passport claim with a second, independent, longer-gap retention signal.',
  subjectLane: 'Economics',
  learningRoute: { spaceId: MONEY_CREDIT_SPACE_ID, chapterId: MONEY_CREDIT_CHAPTER_ID },
})

const reviewRf = addFactor({
  type: 'institutional_constraint',
  summary: `${FACULTY_REVIEWER_ID === 'fac-1' ? 'Faculty' : 'A reviewer'} verification is required before submitted Evidence counts toward Capability confidence — this is what already happened for the formal/informal credit Evidence above.`,
})
milestones.push({
  id: 'class10-ms-money-credit-review',
  type: 'human_review',
  title: 'Faculty review: formal vs. informal credit Evidence',
  description: 'Institutional review gate the formal/informal credit Evidence already passed through.',
  capabilityIds: [MONEY_CREDIT_CAPABILITY_ID],
  prerequisiteMilestoneIds: [],
  actionIds: [],
  evidenceRequirementIds: [],
  expectedImpactIds: [],
  reasoningSummary: 'Institutionally reviewed and accepted — included here so the review step itself, not only its outcome, is visible in the roadmap.',
  alternativeActionIds: [],
  constraintIds: [],
  recommendationConfidence: 'Strong',
  status: 'verified',
  sourceSignalIds: [reviewRf],
  planVersionId: 'class10-planv-1',
  completionImpact: 'Already cleared this Evidence for Capability support and Passport eligibility.',
  subjectLane: 'Economics',
  learningRoute: { spaceId: MONEY_CREDIT_SPACE_ID, chapterId: MONEY_CREDIT_CHAPTER_ID },
})

// --- Overall checkpoint ---
milestones.push({
  id: 'class10-ms-checkpoint',
  type: 'goal',
  title: 'Complete NCERT Class X curriculum foundations',
  description: 'A checkpoint across all four supplied subjects — not a claim that Mathematics, Science, History, or any unsupplied Class X subject is complete.',
  capabilityIds: SUBJECT_PLANS.map((p) => chapterViewOrThrow(p.spaceId, p.representativeChapterId).capability.id),
  prerequisiteMilestoneIds: SUBJECT_PLANS.map((p) => `class10-ms-${p.fixtureKey}-current`),
  actionIds: [],
  evidenceRequirementIds: [],
  expectedImpactIds: [],
  reasoningSummary: 'The natural checkpoint once every supplied subject has at least one chapter with independently transferred, reviewed Evidence.',
  alternativeActionIds: [],
  constraintIds: [],
  recommendationConfidence: 'Supported',
  status: 'planned',
  sourceSignalIds: [],
  planVersionId: 'class10-planv-1',
  completionImpact: 'Would confirm foundational coverage across English, Geography, Economics, and Political Science — the four subjects currently supplied.',
})

export const class10Milestones = milestones
export const class10Actions = actions
export const class10EvidenceRequirements = evidenceRequirements
export const class10ExpectedImpacts = expectedImpacts
export const class10RecommendationFactors = recommendationFactors
export const class10InstitutionalResources = institutionalResources
export const class10Constraints: OdysseyConstraint[] = [
  { id: 'class10-con-1', type: 'institutional', description: 'Faculty verification is required before submitted Evidence counts toward Capability confidence.' },
]
export const class10Blockers: OdysseyBlocker[] = []
export const class10AlternativeActions: OdysseyAlternativeAction[] = []

export const class10Plan: OdysseyPlan = { id: 'class10-plan-1', studentId: 'student-1', currentVersionId: 'class10-planv-1' }

export const class10PlanVersions: OdysseyPlanVersion[] = [
  {
    id: 'class10-planv-1',
    planId: 'class10-plan-1',
    version: 1,
    createdAt: '2026-07-27T00:00:00.000Z',
    trigger: 'initial_generation',
    triggerSummary: 'Initial plan generated from the supplied NCERT Class X curriculum and current learner state.',
    title: 'NCERT Class X curriculum progression',
    destinationId: class10Destination.id,
    reasoningSummary: 'Grounded in four subjects’ real chapter status: one chapter per subject already has independently-transferred, reviewed Evidence; the next chapter in each lane is recommended; Economics additionally has a second concept still mid-loop.',
    recommendationConfidence: 'Strong',
    milestoneIds: milestones.map((m) => m.id),
    milestonesAddedIds: milestones.map((m) => m.id),
    milestonesRemovedIds: [],
    milestonesReorderedIds: [],
    milestonesChangedIds: [],
    milestonesSupersededIds: [],
    validationStatus: 'valid',
    providerStatus: 'fallback_typed',
  },
]
