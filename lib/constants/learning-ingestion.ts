import type { BadgeTone } from '@/components/ui/Badge'
import type { CurriculumLifecycleState, DocumentSourceType, ExtractionWarningSeverity, PageExtractionQualityState, SourceRightsDeclaration } from '@/lib/campus-types'

export const LIFECYCLE_STATE_LABELS: Record<CurriculumLifecycleState, string> = {
  draft: 'Draft',
  extracting: 'Extracting',
  extraction_review: 'Extraction review',
  corrections_required: 'Corrections required',
  structure_review: 'Structure review',
  ready_for_approval: 'Ready for approval',
  approved: 'Approved',
  in_review: 'In review',
  published: 'Published',
  withdrawn: 'Withdrawn',
  superseded: 'Superseded',
  failed: 'Failed',
}

/** Text label always accompanies tone — never colour alone (DESIGN-001 §13). */
export const LIFECYCLE_STATE_TONES: Record<CurriculumLifecycleState, BadgeTone> = {
  draft: 'neutral',
  extracting: 'blue',
  extraction_review: 'amber',
  corrections_required: 'red',
  structure_review: 'amber',
  ready_for_approval: 'blue',
  approved: 'green',
  in_review: 'amber',
  published: 'green',
  withdrawn: 'neutral',
  superseded: 'neutral',
  failed: 'red',
}

export const SOURCE_TYPE_LABELS: Record<DocumentSourceType, string> = {
  textbook: 'Textbook',
  reading_pack: 'Reading pack',
  manual: 'Manual',
  training_document: 'Training document',
  other: 'Other',
}

export const SOURCE_RIGHTS_LABELS: Record<SourceRightsDeclaration, string> = {
  institution_owned: 'Institution-owned',
  institution_licensed: 'Institution-licensed',
  teacher_authored: 'Teacher-authored',
  public_domain: 'Public domain',
  student_owned: 'Student-owned',
  permission_confirmed: 'Permission confirmed',
  development_demonstration_only: 'Development/demonstration only',
}

export const QUALITY_STATE_LABELS: Record<PageExtractionQualityState, string> = {
  reliable: 'Reliable',
  review_recommended: 'Review recommended',
  manual_correction_required: 'Manual correction required',
  ocr_required: 'OCR required',
  failed: 'Failed',
}

export const QUALITY_STATE_TONES: Record<PageExtractionQualityState, BadgeTone> = {
  reliable: 'green',
  review_recommended: 'amber',
  manual_correction_required: 'red',
  ocr_required: 'red',
  failed: 'red',
}

export const WARNING_SEVERITY_TONES: Record<ExtractionWarningSeverity, BadgeTone> = {
  low: 'neutral',
  medium: 'amber',
  high: 'red',
}
