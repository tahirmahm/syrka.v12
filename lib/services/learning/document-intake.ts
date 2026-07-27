import { createHash } from 'node:crypto'
import type { DocumentExtractionResult, DocumentIntakeRequest, DocumentIntakeRecord, IntakeLimits, IntakeValidationResult } from '@/lib/campus-types'

/** Conservative development defaults — central configuration per Stage B §5. */
export const INTAKE_LIMITS: IntakeLimits = {
  maxFileSizeBytes: 25 * 1024 * 1024,
  maxPageCount: 60,
  processingTimeoutMs: 20_000,
  extractionWarningThreshold: 0.3,
}

const PDF_MAGIC = '%PDF-'

export function hasValidPdfSignature(header: Uint8Array): boolean {
  return Buffer.from(header.slice(0, 5)).toString('ascii') === PDF_MAGIC
}

export function computeContentHash(buffer: Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/** Strips any path component and disallowed characters — never trusts the client-supplied filename directly. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return safe.length > 0 ? safe : 'document.pdf'
}

export interface IntakeMetadata {
  mimeType: string
  sizeBytes: number
  header: Uint8Array
}

/** Runs before any parsing — MIME type, size, empty-file, and signature checks, each with a concrete reason. */
export function validateIntakeMetadata(meta: IntakeMetadata, limits: IntakeLimits = INTAKE_LIMITS): IntakeValidationResult {
  if (meta.mimeType !== 'application/pdf') {
    return { ok: false, reason: 'invalid_mime_type', message: `Unsupported file type "${meta.mimeType}" — only PDF documents are accepted.` }
  }
  if (meta.sizeBytes === 0) {
    return { ok: false, reason: 'empty_file', message: 'This file is empty and contains no pages to extract.' }
  }
  if (meta.sizeBytes > limits.maxFileSizeBytes) {
    return {
      ok: false,
      reason: 'file_exceeds_limit',
      message: `This file (${(meta.sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the ${(limits.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB upload limit.`,
    }
  }
  if (!hasValidPdfSignature(meta.header)) {
    return { ok: false, reason: 'invalid_pdf_signature', message: 'This file does not appear to be a valid PDF document (missing PDF signature).' }
  }
  return { ok: true, message: 'Metadata valid.' }
}

export function validatePageCount(totalPages: number, limits: IntakeLimits = INTAKE_LIMITS): IntakeValidationResult {
  if (totalPages > limits.maxPageCount) {
    return { ok: false, reason: 'page_count_exceeds_limit', message: `This document has ${totalPages} pages, exceeding the ${limits.maxPageCount}-page limit.` }
  }
  return { ok: true, message: 'Page count valid.' }
}

export function isDuplicateDocument(contentHash: string, existingHashes: string[]): boolean {
  return existingHashes.includes(contentHash)
}

/**
 * Interprets a completed extraction run into one concrete, user-readable
 * outcome. A document with some image-only pages is not rejected — it
 * stays inspectable and is flagged for OCR/manual correction rather than
 * discarded wholesale (Stage B §20).
 */
export function classifyExtractionOutcome(result: DocumentExtractionResult): IntakeValidationResult {
  if (result.encrypted) {
    return {
      ok: false,
      reason: 'encrypted_unsupported',
      message: 'This document is password-protected. Encrypted PDFs are not supported yet — please provide an unencrypted copy.',
    }
  }
  if (result.malformed) {
    return { ok: false, reason: 'document_malformed', message: 'This document appears malformed and could not be parsed. Please verify the file and try again.' }
  }
  if (result.failureReason === 'no_extractable_text') {
    return {
      ok: false,
      reason: 'no_extractable_text',
      message: 'No extractable text was found on any page — this document may be entirely scanned images. OCR is not available yet; a manually transcribed version may be uploaded instead.',
    }
  }
  const imageOnlyCount = result.pages.filter((page) => page.imageOnly).length
  if (imageOnlyCount > 0) {
    return {
      ok: true,
      reason: 'some_pages_require_ocr',
      message: `${imageOnlyCount} of ${result.pages.length} page(s) could not be read as text and are marked as requiring OCR or manual correction. The rest of the document remains inspectable.`,
    }
  }
  return { ok: true, message: 'Document extracted successfully.' }
}

export function createIntakeRecord(request: DocumentIntakeRequest, documentId: string, contentHash: string, importedAt: string): DocumentIntakeRecord {
  return {
    documentId,
    contentHash,
    importedAt,
    ownerId: request.ownerId,
    originalFilename: request.originalFilename,
    safeDisplayFilename: sanitizeFilename(request.originalFilename),
    sourceType: request.sourceType,
    accessClassification: 'institution_private',
    processingState: 'uploaded',
    sourceRightsDeclaration: request.sourceRightsDeclaration,
  }
}
