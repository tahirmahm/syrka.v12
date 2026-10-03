import { createHash } from 'node:crypto'
import { PDFParse, PasswordException } from 'pdf-parse'
import type { DocumentExtractionProvider, DocumentExtractionResult, ExtractedPageResult, TeacherCorrection } from '@/lib/campus-types'

/** Below this many non-whitespace characters, a page is treated as image-only rather than a thin/short text page. */
const MIN_TEXT_LENGTH_FOR_TEXT_PAGE = 20

function countTextItems(text: string): number {
  const trimmed = text.trim()
  if (trimmed.length === 0) return 0
  return trimmed.split(/\s+/).length
}

/**
 * Wraps the existing pdf-parse dependency (already installed — see
 * docs/adr for the dependency-audit rationale) to produce page-bounded
 * text with no fabricated content: a page that fails to extract is marked
 * imageOnly rather than silently filled in.
 */
export const NativePdfProvider: DocumentExtractionProvider = {
  id: 'native_pdf_v1',
  async extract(buffer, opts): Promise<DocumentExtractionResult> {
    const contentHash = createHash('sha256').update(buffer).digest('hex')
    let parser: PDFParse | undefined
    try {
      parser = new PDFParse({ data: buffer })
      const info = await parser.getInfo()
      const textResult = await parser.getText(opts?.partial ? { partial: opts.partial } : undefined)

      const pages: ExtractedPageResult[] = textResult.pages.map((page) => {
        const rawText = page.text ?? ''
        const imageOnly = rawText.trim().length < MIN_TEXT_LENGTH_FOR_TEXT_PAGE
        return {
          pageNumber: page.num,
          rawText,
          textItemCount: countTextItems(rawText),
          readingOrderConfidence: imageOnly ? 0 : 0.9,
          extractionMethod: 'native_pdf',
          imageOnly,
        }
      })

      const anyExtractableText = pages.some((page) => !page.imageOnly)
      return {
        totalPages: info.total,
        pages,
        contentHash,
        encrypted: false,
        malformed: false,
        partial: false,
        failureReason: anyExtractableText ? undefined : 'no_extractable_text',
      }
    } catch (err) {
      if (err instanceof PasswordException) {
        return { totalPages: 0, pages: [], contentHash, encrypted: true, malformed: false, partial: false, failureReason: 'encrypted_unsupported' }
      }
      return { totalPages: 0, pages: [], contentHash, encrypted: false, malformed: true, partial: false, failureReason: 'document_malformed' }
    } finally {
      await parser?.destroy()
    }
  },
}

/**
 * Applies an accepted TeacherCorrection as the canonical text for a page
 * without ever mutating the original extracted text — the caller keeps
 * both the original ExtractedPageResult and this corrected view.
 */
export function applyManualCorrection(originalText: string, correction: TeacherCorrection): string {
  if (correction.reviewStatus && correction.reviewStatus !== 'accepted') return originalText
  return correction.correctedValue ?? originalText
}

export const ManualCorrectionProvider = {
  id: 'manual_correction_v1' as const,
  applyCorrection: applyManualCorrection,
}
