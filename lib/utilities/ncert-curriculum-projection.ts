import {
  ncertLearningSpaces,
  ncertCourses,
  ncertChapters,
  ncertLessons,
  ncertConcepts,
  ncertExplanations,
  ncertExamples,
  ncertActivities,
  ncertQuestions,
  ncertDocuments,
  ncertSourceReferences,
  ncertPages,
} from '@/lib/mock-data/ncert-class-10-seed'
import { capabilityDefinitions } from '@/lib/mock-data/seed'
// Side-effect import: proves Mermaid and generic node-edge graphs are absent from the runtime —
// runs wherever any Learning concept is looked up (every "Visualise this" call, Tutor action, and concept page).
import '@/lib/validation/validate-no-mermaid'
import type { LearningActivityKind } from '@/lib/campus-types'

/**
 * Advisory-only curriculum-to-Odyssey pathway text, per subject Capability.
 * Deliberately not a full second Odyssey roadmap: the brief asks for an
 * inspectable "preparedness indicator," not a claim that finishing a
 * chapter unlocks a career. Nothing here mutates a verified Capability or
 * an active Odyssey plan.
 */
const PATHWAY_ADVISORY_BY_CAPABILITY: Record<string, string> = {
  'cap-7': 'Communication- and writing-intensive pathways (for example, a Humanities or Communications-oriented Odyssey track) draw on exactly this kind of evidence-backed interpretation.',
  'cap-8': 'Environmental Studies, regional planning, and geography-adjacent Odyssey pathways draw on this classification-and-reasoning skill.',
  'cap-9': 'Economics, Commerce, and Public Policy pathways draw on this kind of case-based economic reasoning.',
  'cap-10': 'Public Policy, Law, and Civil Service pathways draw on this kind of institutional and constitutional reasoning.',
}

export interface NcertSubjectSummary {
  spaceId: string
  courseId: string
  title: string
  subject: string
  chapters: { chapterId: string; order: number; title: string }[]
}

export interface NcertChapterConceptView {
  id: string
  title: string
  description: string
}

export interface NcertChapterView {
  spaceId: string
  spaceTitle: string
  subject: string
  chapterId: string
  order: number
  title: string
  overview: string
  concepts: NcertChapterConceptView[]
  example: { prompt: string; steps: string[] }
  activity: { kind: LearningActivityKind; title: string; instructions: string }
  transferQuestion: string
  capability: { id: string; name: string; domain: string; description: string; pathwayAdvisory: string }
  citation: { bookTitle: string; page: number; sourceLabel: string }
  prevChapter?: { spaceId: string; chapterId: string; title: string }
  nextChapter?: { spaceId: string; chapterId: string; title: string }
}

const SPACE_CODE: Record<string, string> = {
  'ncert-space-english': 'eng',
  'ncert-space-geography': 'geo',
  'ncert-space-economics': 'eco',
  'ncert-space-polisci': 'pol',
}

const SPACE_CAPABILITY: Record<string, string> = {
  'ncert-space-english': 'cap-7',
  'ncert-space-geography': 'cap-8',
  'ncert-space-economics': 'cap-9',
  'ncert-space-polisci': 'cap-10',
}

/** The four-subject curriculum navigator — every chapter in every supplied book, grouped by Learning Space. */
export function getNcertSubjects(): NcertSubjectSummary[] {
  return ncertLearningSpaces.map((space) => {
    const course = ncertCourses.find((c) => c.title === space.title)
    const chapters = allChaptersBySpace(space.id)
    return { spaceId: space.id, courseId: course?.id ?? space.id, title: space.title, subject: space.title.split(' — ')[0], chapters: chapters.map((ch) => ({ chapterId: ch.id, order: ch.order, title: ch.title })) }
  })
}

/** All chapters for one Learning Space, in canonical order — used for the navigator, prev/next, and route validation. */
function allChaptersBySpace(spaceId: string) {
  const code = SPACE_CODE[spaceId] ?? ''
  return ncertChapters.filter((ch) => ch.id.startsWith(`ncert-chapter-${code}-`)).sort((a, b) => a.order - b.order)
}

/** Resolves one chapter's full, real content bundle for the dynamic route + Tutor — or undefined if spaceId/chapterId don't resolve to a supplied chapter. */
export function getNcertChapterView(spaceId: string, chapterId: string): NcertChapterView | undefined {
  const space = ncertLearningSpaces.find((s) => s.id === spaceId)
  const chapter = ncertChapters.find((c) => c.id === chapterId)
  if (!space || !chapter) return undefined

  const lesson = ncertLessons.find((l) => l.chapterId === chapter.id)
  if (!lesson) return undefined

  const concepts = lesson.conceptIds
    .map((cid) => ncertConcepts.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
  const [primaryConcept] = concepts
  const overview = ncertExplanations.find((e) => e.conceptId === primaryConcept?.id)?.body ?? ''
  const example = ncertExamples.find((e) => e.conceptId === primaryConcept?.id)
  const activity = ncertActivities.find((a) => a.lessonId === lesson.id)
  const transferQuestion = ncertQuestions.find((q) => q.conceptId === primaryConcept?.id && q.kind === 'transfer')

  const document = ncertDocuments.find((d) => d.id === chapter.sourceDocumentId)
  const reference = ncertSourceReferences.find((r) => r.chapterId === chapter.id)
  const page = reference ? ncertPages.find((p) => p.id === reference.pageId) : undefined

  const capabilityId = SPACE_CAPABILITY[spaceId] ?? 'cap-7'
  const capabilityDefinition = capabilityDefinitions.find((c) => c.id === capabilityId)

  const siblingChapters = allChaptersBySpace(spaceId)
  const index = siblingChapters.findIndex((c) => c.id === chapter.id)
  const prev = index > 0 ? siblingChapters[index - 1] : undefined
  const next = index >= 0 && index < siblingChapters.length - 1 ? siblingChapters[index + 1] : undefined

  return {
    spaceId: space.id,
    spaceTitle: space.title,
    subject: space.title.split(' — ')[0],
    chapterId: chapter.id,
    order: chapter.order,
    title: chapter.title,
    overview,
    concepts: concepts.map((c) => ({ id: c.id, title: c.title, description: c.description })),
    example: { prompt: example?.prompt ?? '', steps: example?.steps ?? [] },
    activity: { kind: (activity?.kind ?? 'discussion') as LearningActivityKind, title: activity?.title ?? '', instructions: activity?.instructions ?? '' },
    transferQuestion: transferQuestion?.prompt ?? '',
    capability: {
      id: capabilityId,
      name: capabilityDefinition?.name ?? '',
      domain: capabilityDefinition?.domain ?? '',
      description: capabilityDefinition?.description ?? '',
      pathwayAdvisory: PATHWAY_ADVISORY_BY_CAPABILITY[capabilityId] ?? '',
    },
    citation: { bookTitle: space.title, page: page?.pageNumber ?? 0, sourceLabel: document?.sourceLabel ?? '' },
    prevChapter: prev ? { spaceId, chapterId: prev.id, title: prev.title } : undefined,
    nextChapter: next ? { spaceId, chapterId: next.id, title: next.title } : undefined,
  }
}

/** Total chapter count across all supplied books — used by Learning home's aggregate counts and the completion validator. */
export function getNcertTotalChapterCount(): number {
  return ncertChapters.length
}

/**
 * CLASSX-001 §3 — concept-level Learning. Every chapter has exactly two
 * concepts (lesson.conceptIds). The first concept has an authored
 * activity/example/transfer question (ncertActivities/ncertExamples/
 * ncertQuestions, all originally keyed at the lesson/first-concept
 * level); the second does not — rather than fabricate a second authored
 * activity, its "Try"/"Test" prompts are generated deterministically
 * from that concept's own real explanation text (see extractKeyTerms
 * below), never invented content unconnected to the curriculum.
 */
export interface NcertConceptRouteRef {
  spaceId: string
  chapterId: string
  conceptId: string
  title: string
}

export interface NcertConceptWorkbenchView {
  spaceId: string
  chapterId: string
  chapterTitle: string
  chapterOrder: number
  subject: string
  conceptId: string
  conceptIndex: number
  title: string
  description: string
  explanation: string
  hasAuthoredActivity: boolean
  example?: { prompt: string; steps: string[] }
  tryPrompt: string
  tryInstructions: string
  transferPrompt: string
  /** Deterministic evaluation criteria — real terms drawn from this concept's own curriculum text, never fabricated. */
  keyTerms: string[]
  capability: { id: string; name: string; domain: string }
  citation: { bookTitle: string; page: number; sourceLabel: string }
  prevConcept?: NcertConceptRouteRef
  nextConcept?: NcertConceptRouteRef
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'because', 'before', 'between', 'cannot', 'could', 'during',
  'either', 'especially', 'however', 'neither', 'other', 'others', 'should', 'themselves',
  'therefore', 'though', 'through', 'toward', 'towards', 'until', 'various', 'whether', 'which', 'while', 'within',
  'without', 'would',
])

/** Deterministic keyword extraction — no fabrication, just a heuristic over real curriculum text so the Try/Test steps have visible, explainable evaluation criteria. */
function extractKeyTerms(text: string, max = 5): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const seen = new Set<string>()
  const terms: string[] = []
  for (const word of words) {
    if (word.length < 6 || STOPWORDS.has(word) || seen.has(word)) continue
    seen.add(word)
    terms.push(word)
    if (terms.length >= max) break
  }
  return terms
}

function allConceptsBySpace(spaceId: string): NcertConceptRouteRef[] {
  return allChaptersBySpace(spaceId).flatMap((chapter) => {
    const lesson = ncertLessons.find((l) => l.chapterId === chapter.id)
    if (!lesson) return []
    return lesson.conceptIds.map((conceptId) => ({
      spaceId,
      chapterId: chapter.id,
      conceptId,
      title: ncertConcepts.find((c) => c.id === conceptId)?.title ?? conceptId,
    }))
  })
}

/** Every concept route across all 26 chapters (52 total) — used by generateStaticParams. */
export function getAllNcertConceptRoutes(): NcertConceptRouteRef[] {
  return ncertLearningSpaces.flatMap((space) => allConceptsBySpace(space.id))
}

export function getNcertConceptView(spaceId: string, chapterId: string, conceptId: string): NcertConceptWorkbenchView | undefined {
  const space = ncertLearningSpaces.find((s) => s.id === spaceId)
  const chapter = ncertChapters.find((c) => c.id === chapterId)
  if (!space || !chapter) return undefined
  const lesson = ncertLessons.find((l) => l.chapterId === chapter.id)
  if (!lesson) return undefined
  const conceptIndex = lesson.conceptIds.indexOf(conceptId)
  if (conceptIndex === -1) return undefined
  const concept = ncertConcepts.find((c) => c.id === conceptId)
  if (!concept) return undefined

  const explanation = ncertExplanations.find((e) => e.conceptId === conceptId)
  const example = ncertExamples.find((e) => e.conceptId === conceptId)
  const activity = ncertActivities.find((a) => a.lessonId === lesson.id)
  const transferQuestion = ncertQuestions.find((q) => q.conceptId === conceptId && q.kind === 'transfer')
  const hasAuthoredActivity = conceptIndex === 0 && Boolean(activity)

  const tryPrompt = hasAuthoredActivity && activity ? activity.title : `Check your understanding: ${concept.title}`
  const tryInstructions = hasAuthoredActivity && activity ? activity.instructions : `In your own words, explain: ${concept.description}`
  const transferPrompt = transferQuestion?.prompt ?? `Apply "${concept.title}" to a new example not covered in the chapter, in your own words.`

  const capabilityId = SPACE_CAPABILITY[spaceId] ?? 'cap-7'
  const capabilityDefinition = capabilityDefinitions.find((c) => c.id === capabilityId)
  const document = ncertDocuments.find((d) => d.id === chapter.sourceDocumentId)
  const reference = ncertSourceReferences.find((r) => r.chapterId === chapter.id)
  const page = reference ? ncertPages.find((p) => p.id === reference.pageId) : undefined

  const allConcepts = allConceptsBySpace(spaceId)
  const flatIndex = allConcepts.findIndex((c) => c.conceptId === conceptId)
  const prevConcept = flatIndex > 0 ? allConcepts[flatIndex - 1] : undefined
  const nextConcept = flatIndex >= 0 && flatIndex < allConcepts.length - 1 ? allConcepts[flatIndex + 1] : undefined

  return {
    spaceId,
    chapterId,
    chapterTitle: chapter.title,
    chapterOrder: chapter.order,
    subject: space.title.split(' — ')[0],
    conceptId,
    conceptIndex,
    title: concept.title,
    description: concept.description,
    explanation: explanation?.body ?? concept.description,
    hasAuthoredActivity,
    example: example ? { prompt: example.prompt, steps: example.steps } : undefined,
    tryPrompt,
    tryInstructions,
    transferPrompt,
    keyTerms: extractKeyTerms(`${concept.description} ${explanation?.body ?? ''}`),
    capability: { id: capabilityId, name: capabilityDefinition?.name ?? '', domain: capabilityDefinition?.domain ?? '' },
    citation: { bookTitle: space.title, page: page?.pageNumber ?? 0, sourceLabel: document?.sourceLabel ?? '' },
    prevConcept,
    nextConcept,
  }
}
