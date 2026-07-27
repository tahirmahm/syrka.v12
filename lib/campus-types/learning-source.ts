/**
 * Syrka Learning — source and provenance domain. An extracted textbook is
 * never one Markdown string; every extracted object retains its source
 * document, edition/version, page, region, extraction method/confidence,
 * correction history, and publication status.
 */

export type LearningDocumentPublicationStatus = 'draft' | 'in_review' | 'published' | 'withdrawn'

/** Neutral to the actual publisher — NCERT, Cambridge, IB, a university reading pack, a professional manual, an institutional training document. */
export type DocumentSourceType = 'textbook' | 'reading_pack' | 'manual' | 'training_document' | 'other'

/** Stage B declares this at upload time as an audit field — never automatic legal clearance. */
export type SourceRightsDeclaration =
  | 'institution_owned'
  | 'institution_licensed'
  | 'teacher_authored'
  | 'public_domain'
  | 'student_owned'
  | 'permission_confirmed'
  | 'development_demonstration_only'

/** No public tier exists in Stage B — every ingested document stays private to its owning institution/teacher. */
export type DocumentAccessClassification = 'institution_private' | 'teacher_private'

export type DocumentProcessingState = 'uploaded' | 'validating' | 'extracting' | 'extracted' | 'partially_extracted' | 'extraction_failed'

export interface LearningDocument {
  id: string
  title: string
  /** e.g. "NCERT Class X Science" — a label identifying the source, never a claim Syrka is the publisher. */
  sourceLabel: string
  ownerId: string
  currentVersionId?: string
  publicationStatus: LearningDocumentPublicationStatus
  /** Stage B intake fields — optional so Stage A's fixtures (which predate real intake) stay valid untouched. */
  contentHash?: string
  importedAt?: string
  originalFilename?: string
  safeDisplayFilename?: string
  sourceType?: DocumentSourceType
  accessClassification?: DocumentAccessClassification
  processingState?: DocumentProcessingState
  sourceRightsDeclaration?: SourceRightsDeclaration
}

export interface LearningDocumentVersion {
  id: string
  documentId: string
  version: number
  createdAt: string
  /** Extraction method used to produce this version — see DocumentExtractionProvider (learning-ingestion.ts). */
  extractionMethod: 'native_pdf' | 'ocr' | 'manual_correction' | 'mixed'
  /** Stage B extraction-run fields — optional for the same reason as above. */
  contentHash?: string
  extractionProvider?: string
  extractionTimestamp?: string
  /** Document-level aggregate only — see LearningPage.extractionConfidence for the per-page figure. */
  extractionConfidence?: number
  correctionStatus?: 'none' | 'in_progress' | 'complete'
}

/** A structured text run within a page — order/kind preserved where the extractor can determine it; never a substitute for the raw page text. */
export interface LearningTextBlock {
  order: number
  text: string
  kind?: 'heading' | 'paragraph' | 'caption' | 'list_item' | 'table_cell' | 'unknown'
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export interface LearningPage {
  id: string
  documentVersionId: string
  pageNumber: number
  /** Present once extracted; absent for a page still awaiting extraction. Raw text — never flattened across page boundaries. */
  extractedText?: string
  extractionConfidence?: number
  /** Stage B per-page fields — optional for the same reason as above. */
  textBlocks?: LearningTextBlock[]
  pageExtractionMethod?: 'native_pdf' | 'ocr' | 'manual_correction' | 'mixed'
  textItemCount?: number
  readingOrderConfidence?: number
  /** See PageExtractionQualityState (learning-ingestion.ts) — extraction confidence and curriculum correctness are separate concepts. */
  qualityState?: 'reliable' | 'review_recommended' | 'manual_correction_required' | 'ocr_required' | 'failed'
  manualCorrectionRequired?: boolean
  ocrRequired?: boolean
}

/** A precise crop/region on a page — used when a citation or figure points at a specific area rather than the whole page. */
export interface SourceRegion {
  id: string
  pageId: string
  /** Normalised 0-1 bounding box, so it survives image-resolution changes. */
  boundingBox: { x: number; y: number; width: number; height: number }
}

/**
 * The canonical, citable unit — chapter/section/page/excerpt/version/
 * confidence. Every Tutor citation resolves to one of these; the model
 * never authors a citation, it only requests one that Syrka then resolves
 * and renders (see learning-tutor-runtime.ts's TutorCitationResolver).
 */
export interface SourceReference {
  id: string
  documentId: string
  documentVersionId: string
  chapterId?: string
  sectionId?: string
  pageId: string
  regionId?: string
  excerpt?: string
  extractionConfidence?: number
}

export type ExtractionWarningSeverity = 'low' | 'medium' | 'high'

/** The deterministic signal that triggered this warning — see evaluatePageQuality (learning-ingestion.ts / ingestion/extraction-quality.ts). */
export type ExtractionWarningSignal =
  | 'no_extracted_text'
  | 'low_text_volume'
  | 'broken_character_ratio'
  | 'replacement_character_frequency'
  | 'reading_order_fragmentation'
  | 'header_footer_dominance'
  | 'suspicious_character_runs'
  | 'missing_expected_heading'
  | 'image_only_page'

export interface ExtractionWarning {
  id: string
  pageId: string
  severity: ExtractionWarningSeverity
  description: string
  /** True once a TeacherCorrection resolves this warning; citation validation (learning-tutor-runtime.ts) rejects references through an unresolved high-severity warning. */
  resolved: boolean
  /** Optional — Stage A's fixture predates the quality-evaluation signal taxonomy. */
  signal?: ExtractionWarningSignal
}

export type TeacherCorrectionReviewStatus = 'pending' | 'accepted' | 'reverted'

export interface TeacherCorrection {
  id: string
  targetType: 'page' | 'figure' | 'equation' | 'concept' | 'question' | 'heading' | 'paragraph' | 'caption' | 'reading_order' | 'missing_text' | 'joined_text'
  targetId: string
  teacherId: string
  correctedAt: string
  note: string
  /** What changed, kept as a plain description rather than a diff — sufficient for Stage A's architecture-only scope. */
  changeSummary: string
  /** Stage B overlay fields — optional so Stage A's fixture stays valid untouched. A correction overlays the source; it never mutates or deletes LearningPage.extractedText. */
  documentVersionId?: string
  pageId?: string
  sourceRegionId?: string
  originalValue?: string
  correctedValue?: string
  reason?: string
  reviewStatus?: TeacherCorrectionReviewStatus
}
