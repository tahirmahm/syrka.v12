/**
 * Syrka Learning Stage B — deterministic ingestion/authoring fixtures.
 *
 * The real supplied NCERT Class X Science material (jesc101.pdf, Chapter 1
 * "Chemical Reactions and Equations") WAS accessible in this environment
 * and was used for a genuine, one-time, non-committed verification of the
 * full pipeline (native extraction -> quality evaluation -> structure
 * proposal -> governance -> correction) against real content — see the
 * Stage B completion report. Per the explicit instruction not to include a
 * large copyrighted textbook fixture in the repository, none of that PDF
 * or its extracted text is reproduced here. Everything below is small,
 * synthetic, and authored for this fixture — modeled on the same
 * structure (a chapter heading, two sections, a paragraph, a chemical
 * equation, an activity, a question) without reproducing NCERT content.
 */
import type {
  CurriculumOwner,
  CurriculumReview,
  ExtractionWarning,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  LearningSpace,
  LearningSpaceVersion,
  LearningStructureProposal,
  SourceReference,
  TeacherCorrection,
} from '@/lib/campus-types'
import { evaluatePageQuality, createExtractionWarningsForPage } from '@/lib/services/learning/extraction-quality'
import { sourceReferenceIdForPage, DeterministicStructureProposalProvider } from '@/lib/services/learning/structure-proposal'
import { createCorrection, acceptCorrection, resolveWarningsAffectedByCorrection } from '@/lib/services/learning/correction-repository'
import { computeContentHash, sanitizeFilename } from '@/lib/services/learning/document-intake'
import { validateLearningIngestionData } from '@/lib/validation/validate-learning-ingestion'

export const TEACHER_ID = 'fac-1'
export const INGESTION_NOW = '2026-07-20T00:00:00.000Z'

// ---------------------------------------------------------------------------
// Document + version
// ---------------------------------------------------------------------------

const syntheticBuffer = new TextEncoder().encode('%PDF-1.4 synthetic development fixture — not a real PDF binary, just a byte source for a deterministic content hash.')
const contentHash = computeContentHash(syntheticBuffer)

export const learningDocuments: LearningDocument[] = [
  {
    id: 'lgi-doc-1',
    title: 'Synthetic Science Demonstration Chapter',
    sourceLabel: 'Development fixture — not derived from any copyrighted textbook',
    ownerId: TEACHER_ID,
    currentVersionId: 'lgi-docver-1',
    publicationStatus: 'draft',
    contentHash,
    importedAt: INGESTION_NOW,
    originalFilename: 'synthetic-chapter.pdf',
    safeDisplayFilename: sanitizeFilename('synthetic-chapter.pdf'),
    sourceType: 'textbook',
    accessClassification: 'institution_private',
    processingState: 'extracted',
    sourceRightsDeclaration: 'development_demonstration_only',
  },
]

export const learningDocumentVersions: LearningDocumentVersion[] = [
  {
    id: 'lgi-docver-1',
    documentId: 'lgi-doc-1',
    version: 1,
    createdAt: INGESTION_NOW,
    extractionMethod: 'native_pdf',
    contentHash,
    extractionProvider: 'native_pdf_v1',
    extractionTimestamp: INGESTION_NOW,
    extractionConfidence: 0.83,
    correctionStatus: 'in_progress',
  },
]

// ---------------------------------------------------------------------------
// Pages — page boundaries preserved throughout; never one flattened string.
// Page 2 is deliberately reading-order-fragmented to demonstrate a real,
// function-derived extraction warning (not hand-authored).
// ---------------------------------------------------------------------------

const page1Text =
  'Chapter 1: Reactions of Matter\n\nEvery day, ordinary substances around us change into something new. Wood burns to ash, milk turns sour, and metal rusts. Each of these changes is a sign that a chemical reaction has taken place.'

const page2RawText =
  '1.1 Combining Substances\n\nWhen two simple substances are combined under the right conditions, they can join to form a new substance with different properties.\nA + B → AB\nActivity 1: Mix two household liquids in a clear container and record what you observe over five minutes.\nWhat evidence shows that a chemical reaction has occurred?'

const page3Text =
  '1.2 Signs of Change\n\nA change of colour, the release of a gas, a change in temperature, or the formation of a solid where there was none before are all signs that a reaction may have taken place.'

const page1Evaluation = evaluatePageQuality('lgi-page-1', {
  pageNumber: 1,
  rawText: page1Text,
  textItemCount: page1Text.trim().split(/\s+/).length,
  readingOrderConfidence: 0.92,
  extractionMethod: 'native_pdf',
  imageOnly: false,
})

const page2Evaluation = evaluatePageQuality('lgi-page-2', {
  pageNumber: 2,
  rawText: page2RawText,
  textItemCount: page2RawText.trim().split(/\s+/).length,
  // Deliberately low — demonstrates the real reading_order_fragmentation signal, not a hand-authored one.
  readingOrderConfidence: 0.3,
  extractionMethod: 'native_pdf',
  imageOnly: false,
})

const page3Evaluation = evaluatePageQuality('lgi-page-3', {
  pageNumber: 3,
  rawText: page3Text,
  textItemCount: page3Text.trim().split(/\s+/).length,
  readingOrderConfidence: 0.94,
  extractionMethod: 'native_pdf',
  imageOnly: false,
})

export const learningPages: LearningPage[] = [
  {
    id: 'lgi-page-1',
    documentVersionId: 'lgi-docver-1',
    pageNumber: 1,
    extractedText: page1Text,
    extractionConfidence: page1Evaluation.extractionConfidence,
    pageExtractionMethod: 'native_pdf',
    textItemCount: page1Text.trim().split(/\s+/).length,
    readingOrderConfidence: 0.92,
    qualityState: page1Evaluation.state,
    manualCorrectionRequired: page1Evaluation.state === 'manual_correction_required',
    ocrRequired: page1Evaluation.state === 'ocr_required',
  },
  {
    id: 'lgi-page-2',
    documentVersionId: 'lgi-docver-1',
    pageNumber: 2,
    extractedText: page2RawText,
    extractionConfidence: page2Evaluation.extractionConfidence,
    pageExtractionMethod: 'native_pdf',
    textItemCount: page2RawText.trim().split(/\s+/).length,
    readingOrderConfidence: 0.3,
    qualityState: page2Evaluation.state,
    manualCorrectionRequired: page2Evaluation.state === 'manual_correction_required',
    ocrRequired: page2Evaluation.state === 'ocr_required',
  },
  {
    id: 'lgi-page-3',
    documentVersionId: 'lgi-docver-1',
    pageNumber: 3,
    extractedText: page3Text,
    extractionConfidence: page3Evaluation.extractionConfidence,
    pageExtractionMethod: 'native_pdf',
    textItemCount: page3Text.trim().split(/\s+/).length,
    readingOrderConfidence: 0.94,
    qualityState: page3Evaluation.state,
    manualCorrectionRequired: page3Evaluation.state === 'manual_correction_required',
    ocrRequired: page3Evaluation.state === 'ocr_required',
  },
]

// A dedicated image-only page fixture (not part of the main 3-page document) —
// demonstrates the ocr_required path without needing a second full document.
export const imageOnlyPageEvaluation = evaluatePageQuality('lgi-page-image-only', {
  pageNumber: 4,
  rawText: '',
  textItemCount: 0,
  readingOrderConfidence: 0,
  extractionMethod: 'native_pdf',
  imageOnly: true,
})

// ---------------------------------------------------------------------------
// Extraction warnings — derived from the real evaluator, not hand-authored.
// ---------------------------------------------------------------------------

export const extractionWarnings: ExtractionWarning[] = [...createExtractionWarningsForPage('lgi-warn-page2', page2Evaluation)]

// ---------------------------------------------------------------------------
// Source references — one canonical citation unit per page.
// ---------------------------------------------------------------------------

export const sourceReferences: SourceReference[] = learningPages.map((page) => ({
  id: sourceReferenceIdForPage(page.id),
  documentId: 'lgi-doc-1',
  documentVersionId: 'lgi-docver-1',
  pageId: page.id,
  excerpt: page.extractedText?.slice(0, 200),
  extractionConfidence: page.extractionConfidence,
}))

// An invalid reference for the citation-integrity scenarios — points at a version belonging to a different document.
export const mismatchedVersionSourceReference: SourceReference = {
  id: 'lgi-ref-mismatched-version',
  documentId: 'lgi-doc-1',
  documentVersionId: 'lgi-docver-other',
  pageId: 'lgi-page-1',
}

export const otherDocumentVersion: LearningDocumentVersion = {
  id: 'lgi-docver-other',
  documentId: 'lgi-doc-other',
  version: 1,
  createdAt: INGESTION_NOW,
  extractionMethod: 'native_pdf',
}

// ---------------------------------------------------------------------------
// Manual correction — overlays page 2's fragmented reading order without
// mutating the original extracted text; resolves the extraction warning.
// ---------------------------------------------------------------------------

const pendingCorrection = createCorrection(
  {
    id: 'lgi-correction-1',
    targetType: 'reading_order',
    targetId: 'lgi-page-2',
    documentVersionId: 'lgi-docver-1',
    pageId: 'lgi-page-2',
    teacherId: TEACHER_ID,
    originalValue: page2RawText,
    correctedValue:
      '1.1 Combining Substances\n\nWhen two simple substances are combined under the right conditions, they can join to form a new substance with different properties.\nA + B → AB\n\nActivity 1: Mix two household liquids in a clear container and record what you observe over five minutes.\n\nWhat evidence shows that a chemical reaction has occurred?',
    reason: 'Extractor interleaved the activity instructions with the closing question; reordered to match the true reading order.',
    changeSummary: 'Corrected reading order on page 2.',
  },
  '2026-07-21T00:00:00.000Z'
)

export const acceptedCorrection: TeacherCorrection = acceptCorrection(pendingCorrection)
export const teacherCorrections: TeacherCorrection[] = [acceptedCorrection]

export const extractionWarningsAfterCorrection: ExtractionWarning[] = resolveWarningsAffectedByCorrection(acceptedCorrection, extractionWarnings)

// Demonstrates reversal: a correction that was accepted and then reverted stays fully auditable.
export const revertedCorrectionExample: TeacherCorrection = { ...acceptedCorrection, id: 'lgi-correction-reverted-example', reviewStatus: 'reverted' }

// ---------------------------------------------------------------------------
// Structure proposal — hand-verified deterministic output for this exact
// fixture text (the real DeterministicStructureProposalProvider was
// separately verified live against the real NCERT chapter during Stage B
// development; this fixture demonstrates the same shape without an async
// call at module-load time).
// ---------------------------------------------------------------------------

export const structureProposal: LearningStructureProposal = {
  id: 'lgi-proposal-1',
  documentVersionId: 'lgi-docver-1',
  generatedAt: INGESTION_NOW,
  providerId: DeterministicStructureProposalProvider.id,
  chapters: [
    {
      id: 'lgi-prop-chapter-1',
      title: 'Chapter 1: Reactions of Matter',
      order: 1,
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-1')],
      confidence: { band: 'moderate', reason: 'First heading-like line on the first readable page.' },
    },
  ],
  sections: [
    {
      id: 'lgi-prop-section-1',
      chapterProposalId: 'lgi-prop-chapter-1',
      title: '1.1 Combining Substances',
      order: 1,
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-2')],
      confidence: { band: 'moderate', reason: 'Heading-like line — short, unpunctuated, capitalised.' },
    },
    {
      id: 'lgi-prop-section-2',
      chapterProposalId: 'lgi-prop-chapter-1',
      title: '1.2 Signs of Change',
      order: 2,
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-3')],
      confidence: { band: 'moderate', reason: 'Heading-like line — short, unpunctuated, capitalised.' },
    },
  ],
  concepts: [
    {
      id: 'lgi-prop-concept-1',
      title: '1.1 Combining Substances',
      description: 'Concept proposed from section heading "1.1 Combining Substances" — requires teacher confirmation.',
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-2')],
      confidence: { band: 'low', reason: 'A section heading does not by itself establish a well-formed concept.' },
      sectionProposalId: 'lgi-prop-section-1',
    },
    {
      id: 'lgi-prop-concept-2',
      title: '1.2 Signs of Change',
      description: 'Concept proposed from section heading "1.2 Signs of Change" — requires teacher confirmation.',
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-3')],
      confidence: { band: 'low', reason: 'A section heading does not by itself establish a well-formed concept.' },
      sectionProposalId: 'lgi-prop-section-2',
    },
  ],
  prerequisites: [],
  explanations: [],
  examples: [],
  activities: [
    {
      id: 'lgi-prop-activity-1',
      title: 'Activity 1: Mix two household liquids in a clear container and record what you observe over five minutes.',
      instructions: 'Activity 1: Mix two household liquids in a clear container and record what you observe over five minutes.',
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-2')],
      sectionProposalId: 'lgi-prop-section-1',
    },
  ],
  questions: [
    {
      id: 'lgi-prop-question-1',
      conceptProposalId: 'lgi-prop-concept-1',
      kind: 'practice',
      prompt: 'What evidence shows that a chemical reaction has occurred?',
      sourceReferenceIds: [sourceReferenceIdForPage('lgi-page-2')],
    },
  ],
  assessments: [],
  figures: [],
  equations: [{ id: 'lgi-prop-equation-1', expression: 'A + B → AB', sourceReferenceId: sourceReferenceIdForPage('lgi-page-2'), sectionProposalId: 'lgi-prop-section-1' }],
  unresolvedWarningIds: [],
  structuralConfidence: { band: 'moderate', reason: 'Detected 1 chapter(s) and 2 section(s) from heading-shaped lines.' },
}

// ---------------------------------------------------------------------------
// Learning Space governance — an approved draft.
// ---------------------------------------------------------------------------

export const curriculumOwners: CurriculumOwner[] = [{ id: 'lgi-owner-1', learningSpaceId: 'lgi-space-1', primaryOwnerId: TEACHER_ID, contributorIds: [] }]

export const learningSpaces: LearningSpace[] = [
  { id: 'lgi-space-1', title: 'Synthetic Chapter 1 (Stage B demonstration)', curriculumId: 'lc-curriculum-1', ownerId: 'lgi-owner-1', currentVersionId: 'lgi-spacever-1', lifecycleState: 'approved' },
]

export const learningSpaceVersions: LearningSpaceVersion[] = [
  {
    id: 'lgi-spacever-1',
    learningSpaceId: 'lgi-space-1',
    version: 1,
    createdAt: INGESTION_NOW,
    sourceDocumentVersionId: 'lgi-docver-1',
    structureProposalId: 'lgi-proposal-1',
    approvedAt: '2026-07-22T00:00:00.000Z',
  },
]

export const curriculumReviews: CurriculumReview[] = [
  { id: 'lgi-review-1', learningSpaceVersionId: 'lgi-spacever-1', reviewerId: TEACHER_ID, decision: 'approved', note: 'Structure reviewed against source; reading-order correction accepted.', reviewedAt: '2026-07-22T00:00:00.000Z' },
]

// A withdrawn Learning Space — proves withdrawal is reachable and terminal.
export const withdrawnLearningSpace: LearningSpace = {
  id: 'lgi-space-withdrawn',
  title: 'Withdrawn draft (Stage B demonstration)',
  curriculumId: 'lc-curriculum-1',
  ownerId: 'lgi-owner-1',
  currentVersionId: undefined,
  lifecycleState: 'withdrawn',
  withdrawalReason: 'Source document superseded by a corrected upload.',
}

const learningIngestionValidationErrors = validateLearningIngestionData({
  learningDocuments,
  learningDocumentVersions: [...learningDocumentVersions, otherDocumentVersion],
  learningPages,
  extractionWarnings,
  sourceReferences: [...sourceReferences, mismatchedVersionSourceReference],
  teacherCorrections,
  structureProposal,
  learningSpaces: [...learningSpaces, withdrawnLearningSpace],
  learningSpaceVersions,
  curriculumReviews,
  imageOnlyPageEvaluation,
  page2Evaluation,
})

if (learningIngestionValidationErrors.length > 0) {
  throw new Error(`Learning ingestion fixture data is invalid:\n${learningIngestionValidationErrors.join('\n')}`)
}
