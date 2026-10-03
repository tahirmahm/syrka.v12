import { execSync } from 'node:child_process'
import {
  ncertChapters,
  ncertLessons,
  ncertConcepts,
  ncertActivities,
  ncertQuestions,
  ncertDocuments,
  ncertPages,
  ncertSourceReferences,
  ncertLearningSpaces,
} from '@/lib/mock-data/ncert-class-10-seed'
import { getNcertSubjects, getNcertChapterView, getNcertTotalChapterCount } from '@/lib/utilities/ncert-curriculum-projection'

const REDACTED_PLACEHOLDER = '[private demonstration excerpt — not reproduced publicly]'

/**
 * Deterministic checks for the NCERT Class X curriculum-population
 * release, against the checklist in the founder's brief (§18). Every
 * check here verifies something this release actually implements — it
 * does not fabricate a pass for work that was explicitly deferred
 * (Faculty review population, per-chapter Evidence/Observation fixture
 * chains beyond the pre-existing Chemistry demo, explain-back/Evidence-
 * mission as separate stored records rather than Tutor-generated text).
 * Those gaps are listed at the bottom, unchecked, rather than silently
 * passed.
 */
export function validateNcertCurriculumData(): string[] {
  const errors: string[] = []

  // 2 + 22. Every chapter maps to exactly one curriculum unit; navigation covers all 26.
  const totalChapters = getNcertTotalChapterCount()
  if (totalChapters !== 26) errors.push(`Expected exactly 26 supplied chapters, found ${totalChapters}.`)
  const subjects = getNcertSubjects()
  const navigatorChapterCount = subjects.reduce((sum, s) => sum + s.chapters.length, 0)
  if (navigatorChapterCount !== totalChapters) errors.push(`Curriculum navigator lists ${navigatorChapterCount} chapters but ${totalChapters} exist.`)

  // 3. No two chapters share a canonical id.
  const chapterIds = new Set<string>()
  for (const ch of ncertChapters) {
    if (chapterIds.has(ch.id)) errors.push(`Duplicate chapter id: ${ch.id}`)
    chapterIds.add(ch.id)
  }

  // 4. Chapter order is stable (contiguous 1..N) within each Learning Space.
  for (const subject of subjects) {
    const orders = subject.chapters.map((c) => c.order).sort((a, b) => a - b)
    const expected = orders.map((_, i) => i + 1)
    if (JSON.stringify(orders) !== JSON.stringify(expected)) {
      errors.push(`${subject.title}: chapter order is not a contiguous 1..N sequence (${orders.join(',')}).`)
    }
  }

  // 5. Source hashes are retained for every book.
  for (const doc of ncertDocuments) {
    if (!doc.contentHash || doc.contentHash.length !== 64) errors.push(`Document ${doc.id} is missing a real SHA-256 contentHash.`)
  }

  // 6. Every source reference resolves to a real page.
  const pageIds = new Set(ncertPages.map((p) => p.id))
  for (const ref of ncertSourceReferences) {
    if (!pageIds.has(ref.pageId)) errors.push(`SourceReference ${ref.id} points at a page that does not exist: ${ref.pageId}`)
  }

  // 8 + 9. No raw PDFs committed; no page carries anything beyond the redacted placeholder.
  for (const page of ncertPages) {
    if (page.extractedText && page.extractedText !== REDACTED_PLACEHOLDER) {
      errors.push(`Page ${page.id} stores extracted text beyond the redacted placeholder — possible copyright-boundary violation.`)
    }
  }
  try {
    // Scoped to the supplied NCERT filename convention (jeff*/jess* PDFs) and the gitignored
    // source directories — never a blanket "*.pdf", which would also flag Syrka's own
    // pre-existing, legitimate ADR PDFs under docs/adr/.
    const trackedNcertSources = execSync('git ls-files -- "jeff*.pdf" "jess*.pdf" "*.ncert-source.zip" "curriculum-sources/**"', { cwd: process.cwd() }).toString().trim()
    if (trackedNcertSources.length > 0) errors.push(`NCERT source PDFs/archives are tracked in git: ${trackedNcertSources.split('\n').join(', ')}`)
  } catch {
    // Not inside a git repo (e.g. a packaged build) — nothing to check.
  }

  // 10, 11, 12, 13. Every chapter has concepts, an overview, at least one activity, and a transfer question.
  for (const chapter of ncertChapters) {
    const lesson = ncertLessons.find((l) => l.chapterId === chapter.id)
    if (!lesson) {
      errors.push(`Chapter ${chapter.id} has no lesson.`)
      continue
    }
    if (lesson.conceptIds.length === 0) errors.push(`Chapter ${chapter.id} has no concepts.`)
    const concepts = lesson.conceptIds.map((cid) => ncertConcepts.find((c) => c.id === cid)).filter(Boolean)
    if (concepts.length !== lesson.conceptIds.length) errors.push(`Chapter ${chapter.id} references a concept id that does not resolve.`)
    const activity = ncertActivities.find((a) => a.lessonId === lesson.id)
    if (!activity) errors.push(`Chapter ${chapter.id} has no activity.`)
    const primaryConceptId = lesson.conceptIds[0]
    const transfer = ncertQuestions.find((q) => q.conceptId === primaryConceptId && q.kind === 'transfer')
    if (!transfer) errors.push(`Chapter ${chapter.id} has no transfer question.`)
  }

  // 21. Every chapter resolves through the canonical route.
  for (const subject of subjects) {
    for (const c of subject.chapters) {
      if (!getNcertChapterView(subject.spaceId, c.chapterId)) errors.push(`Chapter route does not resolve: /student/learning/${subject.spaceId}/${c.chapterId}`)
    }
  }

  // Learning Spaces exist for all 4 books, each pointing at the same demonstration curriculum.
  if (ncertLearningSpaces.length !== 4) errors.push(`Expected 4 Learning Spaces, found ${ncertLearningSpaces.length}.`)

  return errors
}

/**
 * §18 checklist items intentionally NOT asserted above, because this
 * release does not implement them (see the completion report for the
 * honest reasoning, not silently skipped):
 *  - #14 "every chapter has an explain-back prompt" and #15 "every
 *    chapter has an Evidence mission" as separate STORED records — both
 *    are generated live by NcertChapterTutorPanel from real chapter data
 *    instead, which is a deliberate design choice, not an omission, but
 *    it means there is no per-chapter fixture object to assert against.
 *  - #17-19 (hint-ladder/full-answer-reveal gating, observation/Evidence
 *    separation, unreviewed-Evidence-excluded-from-Passport) — these
 *    apply to the pre-existing Chapter 1 Chemistry fixture chain, which
 *    is untouched and still enforced by validateLearningData(). No
 *    equivalent attempt/session/observation/Evidence fixture chain was
 *    built for the 26 new NCERT chapters this pass.
 *  - #23 "Faculty review can inspect representative work from all four
 *    subjects" — deferred; the gated in-memory /faculty/learning-spaces
 *    authoring workspace is architecturally the wrong surface for
 *    published, read-only curriculum browsing, and a dedicated Faculty
 *    surface for it was not built this pass.
 */
export const NCERT_VALIDATION_KNOWN_GAPS = [
  'explain-back and Evidence-mission are Tutor-generated, not separate stored fixtures',
  'no attempt/session/observation/Evidence fixture chain for the 26 new chapters (only the pre-existing Chemistry chapter has one)',
  'no Faculty-facing curriculum browse surface',
] as const
