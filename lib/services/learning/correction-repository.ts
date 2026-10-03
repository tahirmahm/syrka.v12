import type { ExtractionWarning, TeacherCorrection } from '@/lib/campus-types'

export interface CreateCorrectionInput {
  id: string
  targetType: TeacherCorrection['targetType']
  targetId: string
  documentVersionId: string
  pageId: string
  sourceRegionId?: string
  teacherId: string
  originalValue: string
  correctedValue: string
  reason: string
  changeSummary: string
  note?: string
}

/** A correction overlays the source; it never mutates or deletes the original extracted text (Stage B §9). */
export function createCorrection(input: CreateCorrectionInput, correctedAt: string): TeacherCorrection {
  return {
    id: input.id,
    targetType: input.targetType,
    targetId: input.targetId,
    teacherId: input.teacherId,
    correctedAt,
    note: input.note ?? '',
    changeSummary: input.changeSummary,
    documentVersionId: input.documentVersionId,
    pageId: input.pageId,
    sourceRegionId: input.sourceRegionId,
    originalValue: input.originalValue,
    correctedValue: input.correctedValue,
    reason: input.reason,
    reviewStatus: 'pending',
  }
}

/** Reversible: acceptance/reversal only flips reviewStatus on a new/updated record — the full history stays auditable, nothing is deleted. */
export function acceptCorrection(correction: TeacherCorrection): TeacherCorrection {
  return { ...correction, reviewStatus: 'accepted' }
}

export function revertCorrection(correction: TeacherCorrection): TeacherCorrection {
  return { ...correction, reviewStatus: 'reverted' }
}

/** The effective display value for a page given its corrections — the most recent accepted correction wins; the original extracted text is never altered. */
export function resolveEffectiveText(originalText: string, corrections: TeacherCorrection[]): string {
  const accepted = corrections.filter((c) => c.reviewStatus === 'accepted' && c.correctedValue !== undefined).sort((a, b) => a.correctedAt.localeCompare(b.correctedAt))
  if (accepted.length === 0) return originalText
  return accepted[accepted.length - 1].correctedValue as string
}

/** Marks warnings on the corrected page as resolved once — and only once — a correction targeting that page is accepted. */
export function resolveWarningsAffectedByCorrection(correction: TeacherCorrection, warnings: ExtractionWarning[]): ExtractionWarning[] {
  return warnings.map((warning) => (warning.pageId === correction.pageId && correction.reviewStatus === 'accepted' ? { ...warning, resolved: true } : warning))
}
