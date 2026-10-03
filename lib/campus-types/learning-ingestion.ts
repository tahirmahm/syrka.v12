/**
 * Syrka Learning Stage B — document intake, native PDF extraction,
 * page-level quality evaluation, and structure proposal. This is the
 * "authorised document -> secure intake -> native PDF extraction ->
 * page-level quality evaluation -> structured source representation ->
 * proposed Learning structure -> teacher correction -> curriculum review
 * -> versioned Learning Space draft" pipeline. It does not yet prove
 * "student lesson -> live Tutor -> Evidence -> Capability" — that begins
 * in later stages. Builds on lib/campus-types/learning-source.ts's
 * LearningDocument/LearningDocumentVersion/LearningPage/SourceReference/
 * SourceRegion/ExtractionWarning and learning-governance.ts's LearningSpace.
 */

// ---------------------------------------------------------------------------
// Intake configuration and validation
// ---------------------------------------------------------------------------

/** Central, conservative development defaults — see ingestion/document-intake.ts's INTAKE_LIMITS. */
export interface IntakeLimits {
  maxFileSizeBytes: number
  maxPageCount: number
  processingTimeoutMs: number
  /** Fraction of pages (0-1) that may carry an unresolved warning before the whole document is flagged for extraction_review rather than proceeding straight to structure_review. */
  extractionWarningThreshold: number
}

/** Every failure reason maps to one concrete, user-readable message — never generic "upload failed" copy. */
export type IntakeFailureReason =
  | 'invalid_mime_type'
  | 'invalid_pdf_signature'
  | 'empty_file'
  | 'file_exceeds_limit'
  | 'page_count_exceeds_limit'
  | 'encrypted_unsupported'
  | 'document_malformed'
  | 'duplicate_document'
  | 'no_extractable_text'
  | 'some_pages_require_ocr'
  | 'processing_timeout'

export interface IntakeValidationResult {
  ok: boolean
  reason?: IntakeFailureReason
  /** The concrete, user-readable explanation — e.g. "This document is password-protected; encrypted PDFs are not supported yet." */
  message: string
}

/** What the intake route receives before any parsing happens. */
export interface DocumentIntakeRequest {
  originalFilename: string
  mimeType: string
  sizeBytes: number
  ownerId: string
  sourceLabel: string
  sourceType: import('./learning-source').DocumentSourceType
  sourceRightsDeclaration: import('./learning-source').SourceRightsDeclaration
}

/** The safe, non-throwing record produced once intake validation has run — never exposes the original file through a public path. */
export interface DocumentIntakeRecord {
  documentId: string
  contentHash: string
  importedAt: string
  ownerId: string
  originalFilename: string
  safeDisplayFilename: string
  sourceType: import('./learning-source').DocumentSourceType
  accessClassification: import('./learning-source').DocumentAccessClassification
  processingState: import('./learning-source').DocumentProcessingState
  sourceRightsDeclaration: import('./learning-source').SourceRightsDeclaration
}

// ---------------------------------------------------------------------------
// Extraction providers
// ---------------------------------------------------------------------------

export interface ExtractedPageResult {
  pageNumber: number
  rawText: string
  textItemCount: number
  /** 0-1 — the extractor's own confidence in reading order, not curriculum correctness. */
  readingOrderConfidence: number
  extractionMethod: 'native_pdf' | 'ocr' | 'manual_correction' | 'mixed'
  /** True when the page produced ~zero extractable text and appears to be a scanned image. */
  imageOnly: boolean
}

export interface DocumentExtractionResult {
  totalPages: number
  pages: ExtractedPageResult[]
  contentHash: string
  encrypted: boolean
  malformed: boolean
  /** True when some pages extracted and others failed — a partially extracted document stays inspectable, never discarded wholesale. */
  partial: boolean
  failureReason?: IntakeFailureReason
}

/** Implemented by NativePdfProvider (ingestion/pdf-provider.ts). Never implemented by anything that fabricates text for a page it could not read. */
export interface DocumentExtractionProvider {
  readonly id: string
  extract(buffer: Uint8Array, opts?: { partial?: number[] }): Promise<DocumentExtractionResult>
}

export interface OcrExtractionResult {
  pageNumber: number
  text: string
  confidence: number
}

/**
 * Interface only — never implemented or bound in Stage A or Stage B. A
 * scanned/unreadable page is marked ocrRequired: true and left for a later
 * stage; it must never silently produce fabricated text in the meantime.
 */
export interface OcrProvider {
  readonly id: string
  extractPage(pageImage: Uint8Array, pageNumber: number): Promise<OcrExtractionResult>
}

// ---------------------------------------------------------------------------
// Extraction quality evaluation
// ---------------------------------------------------------------------------

export type PageExtractionQualityState = 'reliable' | 'review_recommended' | 'manual_correction_required' | 'ocr_required' | 'failed'

export type PageQualitySignal =
  | 'no_extracted_text'
  | 'low_text_volume'
  | 'broken_character_ratio'
  | 'replacement_character_frequency'
  | 'reading_order_fragmentation'
  | 'header_footer_dominance'
  | 'suspicious_character_runs'
  | 'missing_expected_heading'
  | 'image_only_page'

/** Extraction confidence and curriculum correctness are separate concepts — this never claims the page's content is pedagogically correct, only that it was read reliably. */
export interface PageQualityEvaluation {
  pageId: string
  state: PageExtractionQualityState
  signals: PageQualitySignal[]
  extractionConfidence: number
}

// ---------------------------------------------------------------------------
// Structure proposal
// ---------------------------------------------------------------------------

export type ProposalConfidenceBand = 'low' | 'moderate' | 'high'

/** Kept as an explicit band + reason rather than one collapsed number — a heading may be extracted reliably but classified incorrectly; a concept may be proposed with uncertainty despite perfect text extraction. */
export interface StructureProposalConfidence {
  band: ProposalConfidenceBand
  reason: string
}

interface ProposedWithSource {
  id: string
  sourceReferenceIds: string[]
  confidence: StructureProposalConfidence
}

export interface ProposedChapter extends ProposedWithSource {
  title: string
  order: number
}

export interface ProposedSection extends ProposedWithSource {
  chapterProposalId: string
  title: string
  order: number
}

export interface ProposedConcept extends ProposedWithSource {
  title: string
  description: string
  /** The section this concept was proposed under, when the provider could determine one. */
  sectionProposalId?: string
}

export interface ProposedPrerequisite {
  id: string
  conceptProposalId: string
  requiresConceptProposalId: string
}

export interface ProposedExplanation extends ProposedWithSource {
  conceptProposalId: string
  body: string
}

export interface ProposedExample {
  id: string
  conceptProposalId: string
  prompt: string
  steps: string[]
  sourceReferenceIds: string[]
}

export interface ProposedActivity {
  id: string
  title: string
  instructions: string
  sourceReferenceIds: string[]
  safetyClassification?: 'safe_independent' | 'adult_supervision_recommended' | 'teacher_supervision_required' | 'simulation_only' | 'do_not_attempt'
  sectionProposalId?: string
}

export interface ProposedQuestion {
  id: string
  conceptProposalId: string
  kind: 'diagnostic' | 'practice' | 'transfer' | 'reflection'
  prompt: string
  sourceReferenceIds: string[]
}

export interface ProposedAssessment {
  id: string
  title: string
  questionProposalIds: string[]
  sourceReferenceIds: string[]
}

export interface ProposedFigure {
  id: string
  caption: string
  sourceReferenceId?: string
}

export interface ProposedEquation {
  id: string
  expression: string
  sourceReferenceId?: string
  sectionProposalId?: string
}

/** A proposal is not published curriculum — every object here points back to canonical source references and awaits teacher review/approval before any LearningSpaceVersion is created from it. */
export interface LearningStructureProposal {
  id: string
  documentVersionId: string
  generatedAt: string
  /** Which provider produced this — a deterministic/rule-based provider in Stage B; never a live AI call. */
  providerId: string
  chapters: ProposedChapter[]
  sections: ProposedSection[]
  concepts: ProposedConcept[]
  prerequisites: ProposedPrerequisite[]
  explanations: ProposedExplanation[]
  examples: ProposedExample[]
  activities: ProposedActivity[]
  questions: ProposedQuestion[]
  assessments: ProposedAssessment[]
  figures: ProposedFigure[]
  equations: ProposedEquation[]
  unresolvedWarningIds: string[]
  structuralConfidence: StructureProposalConfidence
}

/** The input a structure-proposal provider receives — canonical page text plus each page's own quality state, never one flattened document string. */
export interface ParsedLearningDocument {
  documentId: string
  documentVersionId: string
  pages: Array<{ pageId: string; pageNumber: number; text: string; quality: PageExtractionQualityState }>
}

/** Stage B ships a deterministic/rule-based implementation only (ingestion/structure-proposal.ts). A stronger DeepSeek-backed implementation is Stage C+ work and is not authorised here. */
export interface LearningStructureProposalProvider {
  readonly id: string
  proposeStructure(document: ParsedLearningDocument): Promise<LearningStructureProposal>
}
