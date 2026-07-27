/**
 * Syrka Learning — source and provenance domain. An extracted textbook is
 * never one Markdown string; every extracted object retains its source
 * document, edition/version, page, region, extraction method/confidence,
 * correction history, and publication status.
 */

export type LearningDocumentPublicationStatus = 'draft' | 'in_review' | 'published' | 'withdrawn'

export interface LearningDocument {
  id: string
  title: string
  /** e.g. "NCERT Class X Science" — a label identifying the source, never a claim Syrka is the publisher. */
  sourceLabel: string
  ownerId: string
  currentVersionId?: string
  publicationStatus: LearningDocumentPublicationStatus
}

export interface LearningDocumentVersion {
  id: string
  documentId: string
  version: number
  createdAt: string
  /** Extraction method used to produce this version — see DocumentExtractionProvider (learning-extraction.ts). */
  extractionMethod: 'native_pdf' | 'ocr' | 'manual_correction' | 'mixed'
}

export interface LearningPage {
  id: string
  documentVersionId: string
  pageNumber: number
  /** Present once extracted; absent for a page still awaiting extraction. */
  extractedText?: string
  extractionConfidence?: number
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

export interface ExtractionWarning {
  id: string
  pageId: string
  severity: ExtractionWarningSeverity
  description: string
  /** True once a TeacherCorrection resolves this warning; citation validation (learning-tutor-runtime.ts) rejects references through an unresolved high-severity warning. */
  resolved: boolean
}

export interface TeacherCorrection {
  id: string
  targetType: 'page' | 'figure' | 'equation' | 'concept' | 'question'
  targetId: string
  teacherId: string
  correctedAt: string
  note: string
  /** What changed, kept as a plain description rather than a diff — sufficient for Stage A's architecture-only scope. */
  changeSummary: string
}
