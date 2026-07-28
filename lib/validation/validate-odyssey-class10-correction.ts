import { class10Destination, class10Milestones, class10RecommendationFactors, class10PlanVersions } from '@/lib/mock-data/odyssey-class10-seed'
import { odysseyDestination } from '@/lib/mock-data/odyssey-seed'
import { getNcertSubjects, getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'
import { MONEY_CREDIT_CHAPTER_ID } from '@/lib/mock-data/economics-signal-events-seed'

/**
 * The Odyssey product correction's genuinely checkable claims. Manual
 * visual checks (the roadmap graph reads clearly, the mobile tree isn't
 * cluttered, the Tutor's answers read as curriculum-aware) are verified
 * by screenshot, not asserted here — see docs/visual-qa/ncert-class-10-
 * odyssey/ and KNOWN_UNCHECKED_ITEMS below.
 */
export function validateOdysseyClass10Correction(): string[] {
  const errors: string[] = []

  // 1 + 3. Default student Odyssey is Class X curriculum progression, not a career/job-title destination.
  if (class10Destination.pathwayType !== 'curriculum_progression') errors.push('Default Class X destination is not pathwayType curriculum_progression.')
  if (class10Destination.title === 'Data Scientist') errors.push('Default Class X destination title is still "Data Scientist".')

  // 2. "Meridian University" absent from the Class X projection's own text fields.
  const class10Text = [
    class10Destination.title,
    class10Destination.description,
    ...class10Milestones.flatMap((m) => [m.title, m.description, m.reasoningSummary, m.completionImpact, m.blockedReason ?? '']),
    ...class10RecommendationFactors.map((f) => f.summary),
    ...class10PlanVersions.map((v) => `${v.title} ${v.reasoningSummary} ${v.triggerSummary}`),
  ].join(' ')
  if (class10Text.includes('Meridian University')) errors.push('"Meridian University" appears in the Class X Odyssey projection text.')
  if (class10Text.includes('Data Scientist')) errors.push('"Data Scientist" appears in the Class X Odyssey projection text.')

  // 4 + 5. Every milestone's learningRoute resolves to a real canonical NCERT chapter; all 26 chapters still resolve.
  for (const m of class10Milestones) {
    if (m.learningRoute && !getNcertChapterView(m.learningRoute.spaceId, m.learningRoute.chapterId)) {
      errors.push(`Milestone "${m.id}" references a learningRoute that does not resolve to a canonical NCERT chapter.`)
    }
  }
  let totalChapters = 0
  for (const subject of getNcertSubjects()) {
    for (const c of subject.chapters) {
      totalChapters++
      if (!getNcertChapterView(subject.spaceId, c.chapterId)) errors.push(`Chapter route no longer resolves: ${subject.spaceId}/${c.chapterId}`)
    }
  }
  if (totalChapters !== 26) errors.push(`Expected 26 total chapters, found ${totalChapters}.`)

  // 6. Four distinct subject lanes are present.
  const lanes = new Set(class10Milestones.map((m) => m.subjectLane).filter(Boolean))
  if (lanes.size !== 4) errors.push(`Expected 4 subject lanes, found ${lanes.size}: ${Array.from(lanes).join(', ')}`)

  // 7 + 8. A distinct, genuinely in-progress "revision" milestone exists (Economics formal-vs-informal credit), separate from the fully-verified chapter_progress milestone for the same chapter.
  const revisionMilestone = class10Milestones.find((m) => m.type === 'revision')
  if (!revisionMilestone) errors.push('No "revision" milestone found — a misconception/incomplete-retention signal should be able to change the next Odyssey action.')
  else if (revisionMilestone.learningRoute?.chapterId !== MONEY_CREDIT_CHAPTER_ID) errors.push('The revision milestone is not grounded in the expected Money and Credit chapter.')
  const verifiedEconomicsMilestone = class10Milestones.find((m) => m.id === 'class10-ms-economics-current')
  if (revisionMilestone && verifiedEconomicsMilestone && revisionMilestone.status === verifiedEconomicsMilestone.status) {
    errors.push('The revision milestone and the fully-verified Economics milestone have the same status — they should be distinguishable.')
  }

  // 9. Evidence review (institutional) is represented as its own, verified milestone.
  const humanReviewMilestone = class10Milestones.find((m) => m.type === 'human_review')
  if (!humanReviewMilestone) errors.push('No human_review milestone found.')
  else if (humanReviewMilestone.status !== 'verified') errors.push('The human_review milestone is not marked verified, even though the underlying Evidence was institutionally reviewed and accepted.')

  // 10. The career-pathway architecture is preserved, not deleted.
  if (odysseyDestination.pathwayType !== 'career_pathway') errors.push('The preserved university-stage destination no longer carries pathwayType career_pathway.')
  if (odysseyDestination.title !== 'Data Scientist') errors.push('The preserved university-stage regression fixture unexpectedly changed its destination title.')

  return errors
}

export const KNOWN_UNCHECKED_ITEMS = [
  '#2/#6/#11/#12/#13 (partial) — roadmap graph readability, Tutor answer quality, and Future-directions/List view rendered text: verified by screenshot in docs/visual-qa/ncert-class-10-odyssey/, not asserted here.',
  '#16 — no Global Pathway Intelligence code integrated: true by absence of any such import, not something this validator can positively assert.',
  '#17 — /campus and accepted Learning surfaces do not regress: verified by manual route walkthrough + screenshot, not this validator.',
  "True four-collapsible-subject-lane GRAPH layout (as opposed to the List view's subject grouping and each milestone's subjectLane field) was not implemented — the existing xyflow depth/trunk layout is reused unchanged with new data; see the completion report's honest limitations.",
] as const
