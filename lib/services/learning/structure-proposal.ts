import type {
  LearningStructureProposal,
  LearningStructureProposalProvider,
  ParsedLearningDocument,
  ProposedActivity,
  ProposedChapter,
  ProposedConcept,
  ProposedEquation,
  ProposedExplanation,
  ProposedQuestion,
  ProposedSection,
  StructureProposalConfidence,
} from '@/lib/campus-types'

/** The shared id convention a caller uses when creating the canonical per-page SourceReference the proposal below cites. */
export function sourceReferenceIdForPage(pageId: string): string {
  return `sref-${pageId}`
}

const HEADING_MAX_WORDS = 10
const HEADING_MAX_CHARS = 80
const ENDS_WITH_SENTENCE_PUNCTUATION = /[.,;:]$/
const ACTIVITY_PATTERN = /activity/i
const QUESTION_PATTERN = /\?\s*$/
// A crude but deterministic chemical-equation shape: element/compound tokens joined by "+" on one side of an arrow.
const EQUATION_PATTERN = /[A-Z][a-zA-Z0-9()]*(\s*\+\s*[A-Z][a-zA-Z0-9()]*)*\s*(->|-->|→)\s*[A-Z][a-zA-Z0-9()]*/

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > HEADING_MAX_CHARS) return false
  if (ENDS_WITH_SENTENCE_PUNCTUATION.test(trimmed)) return false
  if (EQUATION_PATTERN.test(trimmed) || QUESTION_PATTERN.test(trimmed)) return false
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > HEADING_MAX_WORDS) return false
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
  const isTitleCaseStart = /^[A-Z0-9]/.test(trimmed)
  return isAllCaps || isTitleCaseStart
}

function confidenceFor(band: StructureProposalConfidence['band'], reason: string): StructureProposalConfidence {
  return { band, reason }
}

/**
 * Deterministic, rule-based development provider — never a live AI call.
 * Segments each page's raw text by heading-like lines, then classifies
 * remaining lines as equation/activity/question/explanation. Every
 * proposed object cites the canonical per-page SourceReference id via
 * sourceReferenceIdForPage — the caller is responsible for having
 * created that SourceReference from the same page before this runs.
 * A structure proposal is not published curriculum; it is only ever a
 * starting point for teacher review.
 */
/**
 * The synchronous, pure core of the deterministic provider — exported
 * separately so a determinism check (same input twice) can be run without
 * needing to resolve a promise at module-evaluation time. The interface's
 * async proposeStructure() below simply wraps this.
 */
export function proposeStructureSync(document: ParsedLearningDocument, generatedAt: string = new Date().toISOString()): LearningStructureProposal {
  const chapters: ProposedChapter[] = []
    const sections: ProposedSection[] = []
    const concepts: ProposedConcept[] = []
    const explanations: ProposedExplanation[] = []
    const activities: ProposedActivity[] = []
    const questions: ProposedQuestion[] = []
    const equations: ProposedEquation[] = []

    let chapterCounter = 0
    let sectionCounter = 0
    let conceptCounter = 0
    let currentChapter: ProposedChapter | undefined
    let currentSectionId: string | undefined
    let currentConceptId: string | undefined

    for (const page of document.pages) {
      const sourceReferenceId = sourceReferenceIdForPage(page.pageId)
      if (page.quality === 'failed' || page.quality === 'ocr_required') {
        // A page that could not be reliably read contributes no structure — never fabricated.
        continue
      }

      const lines = page.text.split('\n')
      let paragraphBuffer: string[] = []

      const flushParagraph = () => {
        const body = paragraphBuffer.join(' ').trim()
        paragraphBuffer = []
        if (body.length === 0 || !currentConceptId) return
        explanations.push({
          id: `prop-explanation-${explanations.length + 1}`,
          conceptProposalId: currentConceptId,
          body,
          sourceReferenceIds: [sourceReferenceId],
          confidence: confidenceFor('moderate', 'Derived from a contiguous paragraph following the nearest detected heading.'),
        })
      }

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (line.length === 0) {
          flushParagraph()
          continue
        }

        if (!currentChapter && isHeadingLine(line)) {
          chapterCounter += 1
          currentChapter = {
            id: `prop-chapter-${chapterCounter}`,
            title: line,
            order: chapterCounter,
            sourceReferenceIds: [sourceReferenceId],
            confidence: confidenceFor('moderate', 'First heading-like line on the first readable page.'),
          }
          chapters.push(currentChapter)
          continue
        }

        if (currentChapter && isHeadingLine(line)) {
          flushParagraph()
          sectionCounter += 1
          conceptCounter += 1
          const section: ProposedSection = {
            id: `prop-section-${sectionCounter}`,
            chapterProposalId: currentChapter.id,
            title: line,
            order: sectionCounter,
            sourceReferenceIds: [sourceReferenceId],
            confidence: confidenceFor('moderate', 'Heading-like line — short, unpunctuated, capitalised.'),
          }
          sections.push(section)
          currentSectionId = section.id

          const concept: ProposedConcept = {
            id: `prop-concept-${conceptCounter}`,
            title: line,
            description: `Concept proposed from section heading "${line}" — requires teacher confirmation.`,
            sourceReferenceIds: [sourceReferenceId],
            confidence: confidenceFor('low', 'A section heading does not by itself establish a well-formed concept.'),
            sectionProposalId: section.id,
          }
          concepts.push(concept)
          currentConceptId = concept.id
          continue
        }

        if (ACTIVITY_PATTERN.test(line)) {
          flushParagraph()
          activities.push({
            id: `prop-activity-${activities.length + 1}`,
            title: line.length <= HEADING_MAX_CHARS ? line : `Activity (${currentSectionId ?? 'unsectioned'})`,
            instructions: line,
            sourceReferenceIds: [sourceReferenceId],
            sectionProposalId: currentSectionId,
          })
          continue
        }

        if (EQUATION_PATTERN.test(line)) {
          flushParagraph()
          equations.push({ id: `prop-equation-${equations.length + 1}`, expression: line, sourceReferenceId, sectionProposalId: currentSectionId })
          continue
        }

        if (QUESTION_PATTERN.test(line) && currentConceptId) {
          flushParagraph()
          questions.push({
            id: `prop-question-${questions.length + 1}`,
            conceptProposalId: currentConceptId,
            kind: 'practice',
            prompt: line,
            sourceReferenceIds: [sourceReferenceId],
          })
          continue
        }

        paragraphBuffer.push(line)
      }
      flushParagraph()
    }

    const structuralConfidence: StructureProposalConfidence =
      chapters.length === 0
        ? confidenceFor('low', 'No heading-like line was found on any readable page — the proposal is effectively empty.')
        : confidenceFor(sections.length > 0 ? 'moderate' : 'low', `Detected ${chapters.length} chapter(s) and ${sections.length} section(s) from heading-shaped lines.`)

  return {
    id: `proposal-${document.documentVersionId}`,
    documentVersionId: document.documentVersionId,
    generatedAt,
    providerId: 'deterministic_rule_based_v1',
    chapters,
    sections,
    concepts,
    prerequisites: [],
    explanations,
    examples: [],
    activities,
    questions,
    assessments: [],
    figures: [],
    equations,
    unresolvedWarningIds: [],
    structuralConfidence,
  }
}

export const DeterministicStructureProposalProvider: LearningStructureProposalProvider = {
  id: 'deterministic_rule_based_v1',
  async proposeStructure(document: ParsedLearningDocument): Promise<LearningStructureProposal> {
    return proposeStructureSync(document)
  },
}
