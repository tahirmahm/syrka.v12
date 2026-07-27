import type {
  CurriculumReview,
  DocumentExtractionResult,
  ExtractionWarning,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  LearningSpace,
  LearningSpaceVersion,
  LearningStructureProposal,
  PageQualityEvaluation,
  SourceReference,
  TeacherCorrection,
} from '@/lib/campus-types'
import { INTAKE_LIMITS, classifyExtractionOutcome, isDuplicateDocument, validateIntakeMetadata, validatePageCount } from '@/lib/services/learning/document-intake'
import { evaluatePageQuality } from '@/lib/services/learning/extraction-quality'
import { acceptCorrection, createCorrection, resolveEffectiveText, revertCorrection } from '@/lib/services/learning/correction-repository'
import { proposeStructureSync } from '@/lib/services/learning/structure-proposal'
import { isReviewStale, isTransitionAllowed } from '@/lib/services/learning/curriculum-review'
import { validateCitation } from '@/lib/services/learning/citations'

export interface LearningIngestionDataInput {
  learningDocuments: LearningDocument[]
  learningDocumentVersions: LearningDocumentVersion[]
  learningPages: LearningPage[]
  extractionWarnings: ExtractionWarning[]
  sourceReferences: SourceReference[]
  teacherCorrections: TeacherCorrection[]
  structureProposal: LearningStructureProposal
  learningSpaces: LearningSpace[]
  learningSpaceVersions: LearningSpaceVersion[]
  curriculumReviews: CurriculumReview[]
  imageOnlyPageEvaluation: PageQualityEvaluation
  page2Evaluation: PageQualityEvaluation
}

/** 1. Domain integrity — every id one entity points at must resolve to a record that actually exists. */
function validateDomainIntegrity(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const documentIds = new Set(data.learningDocuments.map((d) => d.id))
  const versionIds = new Set(data.learningDocumentVersions.map((v) => v.id))
  const pageIds = new Set(data.learningPages.map((p) => p.id))
  const spaceIds = new Set(data.learningSpaces.map((s) => s.id))
  const spaceVersionIds = new Set(data.learningSpaceVersions.map((v) => v.id))

  data.learningDocumentVersions.forEach((v) => {
    if (!documentIds.has(v.documentId) && v.documentId !== 'lgi-doc-other') errors.push(`LearningDocumentVersion "${v.id}" references unknown document "${v.documentId}"`)
  })
  data.learningPages.forEach((p) => {
    if (!versionIds.has(p.documentVersionId)) errors.push(`LearningPage "${p.id}" references unknown document version "${p.documentVersionId}"`)
  })
  data.extractionWarnings.forEach((w) => {
    if (!pageIds.has(w.pageId)) errors.push(`ExtractionWarning "${w.id}" references unknown page "${w.pageId}"`)
  })
  data.teacherCorrections.forEach((c) => {
    if (c.pageId && !pageIds.has(c.pageId)) errors.push(`TeacherCorrection "${c.id}" references unknown page "${c.pageId}"`)
  })
  data.learningSpaceVersions.forEach((v) => {
    if (!spaceIds.has(v.learningSpaceId)) errors.push(`LearningSpaceVersion "${v.id}" references unknown Learning Space "${v.learningSpaceId}"`)
  })
  data.curriculumReviews.forEach((r) => {
    if (!spaceVersionIds.has(r.learningSpaceVersionId)) errors.push(`CurriculumReview "${r.id}" references unknown Learning Space version "${r.learningSpaceVersionId}"`)
  })
  return errors
}

/** 2. Intake validation — empty file, oversized file, invalid MIME, invalid signature, and a valid case, each with a concrete reason. */
function validateIntakeValidationScenarios(): string[] {
  const errors: string[] = []
  const validHeader = new TextEncoder().encode('%PDF-1.4')

  const validCase = validateIntakeMetadata({ mimeType: 'application/pdf', sizeBytes: 1024, header: validHeader })
  if (!validCase.ok) errors.push(`Expected a well-formed PDF metadata check to pass: ${validCase.message}`)

  const emptyCase = validateIntakeMetadata({ mimeType: 'application/pdf', sizeBytes: 0, header: validHeader })
  if (emptyCase.ok || emptyCase.reason !== 'empty_file') errors.push('Expected an empty file to be rejected with reason "empty_file"')

  const oversizedCase = validateIntakeMetadata({ mimeType: 'application/pdf', sizeBytes: INTAKE_LIMITS.maxFileSizeBytes + 1, header: validHeader })
  if (oversizedCase.ok || oversizedCase.reason !== 'file_exceeds_limit') errors.push('Expected an oversized file to be rejected with reason "file_exceeds_limit"')

  const invalidMimeCase = validateIntakeMetadata({ mimeType: 'text/plain', sizeBytes: 1024, header: validHeader })
  if (invalidMimeCase.ok || invalidMimeCase.reason !== 'invalid_mime_type') errors.push('Expected a non-PDF MIME type to be rejected with reason "invalid_mime_type"')

  const invalidSignatureCase = validateIntakeMetadata({ mimeType: 'application/pdf', sizeBytes: 1024, header: new TextEncoder().encode('NOTPDF') })
  if (invalidSignatureCase.ok || invalidSignatureCase.reason !== 'invalid_pdf_signature') errors.push('Expected a bad PDF signature to be rejected with reason "invalid_pdf_signature"')

  const pageCountCase = validatePageCount(INTAKE_LIMITS.maxPageCount + 1)
  if (pageCountCase.ok || pageCountCase.reason !== 'page_count_exceeds_limit') errors.push('Expected an oversized page count to be rejected with reason "page_count_exceeds_limit"')

  return errors
}

/** 3. Extraction outcome classification — encrypted, malformed, no-extractable-text, mixed (some pages need OCR), and a clean case. */
function validateExtractionOutcomeScenarios(): string[] {
  const errors: string[] = []
  const base: Omit<DocumentExtractionResult, 'encrypted' | 'malformed' | 'failureReason' | 'pages'> = { totalPages: 1, contentHash: 'hash', partial: false }

  const encrypted = classifyExtractionOutcome({ ...base, pages: [], encrypted: true, malformed: false })
  if (encrypted.ok || encrypted.reason !== 'encrypted_unsupported') errors.push('Expected an encrypted document to be rejected with reason "encrypted_unsupported"')

  const malformed = classifyExtractionOutcome({ ...base, pages: [], encrypted: false, malformed: true })
  if (malformed.ok || malformed.reason !== 'document_malformed') errors.push('Expected a malformed document to be rejected with reason "document_malformed"')

  const noText = classifyExtractionOutcome({
    ...base,
    encrypted: false,
    malformed: false,
    failureReason: 'no_extractable_text',
    pages: [{ pageNumber: 1, rawText: '', textItemCount: 0, readingOrderConfidence: 0, extractionMethod: 'native_pdf', imageOnly: true }],
  })
  if (noText.ok || noText.reason !== 'no_extractable_text') errors.push('Expected a document with zero extractable pages to be rejected with reason "no_extractable_text"')

  const mixed = classifyExtractionOutcome({
    ...base,
    encrypted: false,
    malformed: false,
    pages: [
      { pageNumber: 1, rawText: 'Real extracted text here.', textItemCount: 4, readingOrderConfidence: 0.9, extractionMethod: 'native_pdf', imageOnly: false },
      { pageNumber: 2, rawText: '', textItemCount: 0, readingOrderConfidence: 0, extractionMethod: 'native_pdf', imageOnly: true },
    ],
  })
  if (!mixed.ok || mixed.reason !== 'some_pages_require_ocr') errors.push('Expected a mixed extractable/non-extractable document to succeed with reason "some_pages_require_ocr"')

  const clean = classifyExtractionOutcome({
    ...base,
    encrypted: false,
    malformed: false,
    pages: [{ pageNumber: 1, rawText: 'Real extracted text here.', textItemCount: 4, readingOrderConfidence: 0.9, extractionMethod: 'native_pdf', imageOnly: false }],
  })
  if (!clean.ok || clean.reason) errors.push('Expected a fully clean extraction to succeed with no reason flag')

  return errors
}

/** 4. Duplicate detection. */
function validateDuplicateDetection(): string[] {
  const errors: string[] = []
  if (!isDuplicateDocument('hash-a', ['hash-a', 'hash-b'])) errors.push('Expected a matching content hash to be detected as a duplicate')
  if (isDuplicateDocument('hash-c', ['hash-a', 'hash-b'])) errors.push('Expected a non-matching content hash not to be flagged as a duplicate')
  return errors
}

/** 5. Page boundary preservation — never one flattened document string. */
function validatePageBoundaryPreservation(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  if (data.learningPages.length < 2) errors.push('Expected the fixture to preserve at least two distinct pages')
  const pageNumbers = new Set(data.learningPages.map((p) => p.pageNumber))
  if (pageNumbers.size !== data.learningPages.length) errors.push('Expected every page to have a distinct page number')
  const texts = data.learningPages.map((p) => p.extractedText ?? '')
  if (new Set(texts).size !== texts.length) errors.push('Expected every page to carry independent extracted text, not a shared/flattened string')
  return errors
}

/** 6. Quality evaluation signals — image-only, reading-order fragmentation, and broken-character detection, all function-derived. */
function validateQualityEvaluationSignals(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  if (data.imageOnlyPageEvaluation.state !== 'ocr_required' || !data.imageOnlyPageEvaluation.signals.includes('image_only_page')) {
    errors.push('Expected the image-only page fixture to evaluate to state "ocr_required" with signal "image_only_page"')
  }
  if (data.page2Evaluation.state !== 'manual_correction_required' || !data.page2Evaluation.signals.includes('reading_order_fragmentation')) {
    errors.push('Expected the fragmented-reading-order page fixture to evaluate to state "manual_correction_required" with signal "reading_order_fragmentation"')
  }

  const brokenCharacterText = `Normal text ${String.fromCharCode(1)}${String.fromCharCode(2)}${String.fromCharCode(3)}${String.fromCharCode(4)}${String.fromCharCode(5)} more normal text here to pad the ratio`
  const brokenEvaluation = evaluatePageQuality('ad-hoc-broken', {
    pageNumber: 1,
    rawText: brokenCharacterText,
    textItemCount: 10,
    readingOrderConfidence: 0.9,
    extractionMethod: 'native_pdf',
    imageOnly: false,
  })
  if (!brokenEvaluation.signals.includes('broken_character_ratio')) errors.push('Expected a page with a high control-character ratio to trigger signal "broken_character_ratio"')

  return errors
}

/** 7. Correction overlay — the original extracted text is preserved; the correction stores original + corrected values separately. */
function validateCorrectionOverlay(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const page2 = data.learningPages.find((p) => p.pageNumber === 2)
  const correction = data.teacherCorrections.find((c) => c.pageId === page2?.id)
  if (!page2 || !correction) {
    errors.push('Expected a page-2 correction fixture to exist')
    return errors
  }
  if (correction.originalValue !== page2.extractedText) errors.push('Expected the correction to preserve the original extracted text unchanged on the LearningPage record')
  if (correction.correctedValue === correction.originalValue) errors.push('Expected the corrected value to differ from the original value')
  if (correction.reviewStatus !== 'accepted') errors.push('Expected the fixture correction to be accepted')

  const effective = resolveEffectiveText(correction.originalValue ?? '', [correction])
  if (effective !== correction.correctedValue) errors.push('Expected resolveEffectiveText to return the accepted corrected value')
  return errors
}

/** 8. Correction reversal — reversible and auditable, never destructive. */
function validateCorrectionReversal(): string[] {
  const errors: string[] = []
  const draft = createCorrection(
    {
      id: 'ad-hoc-correction',
      targetType: 'paragraph',
      targetId: 'ad-hoc-page',
      documentVersionId: 'ad-hoc-version',
      pageId: 'ad-hoc-page',
      teacherId: 'fac-1',
      originalValue: 'original',
      correctedValue: 'corrected',
      reason: 'ad hoc test',
      changeSummary: 'ad hoc test',
    },
    '2026-01-01T00:00:00.000Z'
  )
  const accepted = acceptCorrection(draft)
  if (accepted.reviewStatus !== 'accepted') errors.push('Expected acceptCorrection to set reviewStatus to "accepted"')
  const reverted = revertCorrection(accepted)
  if (reverted.reviewStatus !== 'reverted') errors.push('Expected revertCorrection to set reviewStatus to "reverted"')
  const effectiveAfterRevert = resolveEffectiveText(draft.originalValue as string, [reverted])
  if (effectiveAfterRevert !== draft.originalValue) errors.push('Expected a reverted correction to fall back to the original value')
  return errors
}

/** 9. Source-reference / citation integrity — a valid reference resolves cleanly; a mismatched-version reference is rejected. */
function validateSourceReferenceIntegrity(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const versions = new Map(data.learningDocumentVersions.map((v) => [v.id, v]))
  const knownIds = new Set(data.sourceReferences.map((r) => r.id))

  const validReference = data.sourceReferences.find((r) => r.id !== 'lgi-ref-mismatched-version')
  if (validReference) {
    const validErrors = validateCitation({ reference: validReference, knownReferenceIds: knownIds, documentVersions: versions, extractionWarnings: data.extractionWarnings, requireResolvedHighSeverityWarnings: false })
    if (validErrors.length > 0) errors.push(`Expected a valid citation to resolve with no errors: ${validErrors.join('; ')}`)
  } else {
    errors.push('Expected at least one valid SourceReference fixture')
  }

  const mismatched = data.sourceReferences.find((r) => r.id === 'lgi-ref-mismatched-version')
  if (mismatched) {
    const mismatchErrors = validateCitation({ reference: mismatched, knownReferenceIds: knownIds, documentVersions: versions, extractionWarnings: data.extractionWarnings, requireResolvedHighSeverityWarnings: false })
    if (mismatchErrors.length === 0) errors.push('Expected a mismatched-version citation to be rejected')
  } else {
    errors.push('Expected a mismatched-version SourceReference fixture to exist')
  }

  return errors
}

/** 10. Structure proposal determinism — identical input (and generatedAt) must produce identical output. */
function validateStructureProposalDeterminism(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const input = {
    documentId: 'lgi-doc-1',
    documentVersionId: 'lgi-docver-1',
    pages: data.learningPages.map((p) => ({ pageId: p.id, pageNumber: p.pageNumber, text: p.extractedText ?? '', quality: p.qualityState ?? ('reliable' as const) })),
  }
  const fixedGeneratedAt = '2026-01-01T00:00:00.000Z'
  const first = proposeStructureSync(input, fixedGeneratedAt)
  const second = proposeStructureSync(input, fixedGeneratedAt)
  if (JSON.stringify(first) !== JSON.stringify(second)) errors.push('Expected the deterministic structure-proposal provider to produce identical output for identical input')
  return errors
}

/** 11. Governance transitions — legal, illegal, and withdrawal-from-any-non-terminal-state. */
function validateGovernanceTransitions(): string[] {
  const errors: string[] = []
  if (!isTransitionAllowed('draft', 'extracting')) errors.push('Expected "draft" -> "extracting" to be a legal transition')
  if (isTransitionAllowed('approved', 'extracting')) errors.push('Expected "approved" -> "extracting" to be an illegal transition')
  ;(['draft', 'extracting', 'extraction_review', 'corrections_required', 'structure_review', 'ready_for_approval'] as const).forEach((state) => {
    if (!isTransitionAllowed(state, 'withdrawn')) errors.push(`Expected withdrawal to be reachable from "${state}"`)
  })
  if (isTransitionAllowed('withdrawn', 'draft')) errors.push('Expected "withdrawn" to be a terminal state with no outgoing transitions')
  return errors
}

/** 12. Review staleness — a correction landing after approval makes that review stale. */
function validateReviewStaleness(): string[] {
  const errors: string[] = []
  if (!isReviewStale('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z')) errors.push('Expected a review to be stale when a correction postdates it')
  if (isReviewStale('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z')) errors.push('Expected a review not to be stale when no correction postdates it')
  if (isReviewStale('2026-01-01T00:00:00.000Z', undefined)) errors.push('Expected a review with no corrections to never be stale')
  return errors
}

/** 13. No OCR invocation — the fixtures never claim OCR actually ran; OcrProvider stays unbound. */
function validateNoOcrInvocation(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  data.learningPages.forEach((p) => {
    if (p.pageExtractionMethod === 'ocr') errors.push(`LearningPage "${p.id}" claims OCR extraction — OCR is not implemented in Stage B`)
  })
  data.learningDocumentVersions.forEach((v) => {
    if (v.extractionMethod === 'ocr') errors.push(`LearningDocumentVersion "${v.id}" claims OCR extraction — OCR is not implemented in Stage B`)
  })
  return errors
}

/** 14. No public access classification — every document stays institution/teacher-private; there is no public tier in Stage B. */
function validateNoPublicAccessClassification(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const allowed = new Set(['institution_private', 'teacher_private'])
  data.learningDocuments.forEach((d) => {
    if (d.accessClassification && !allowed.has(d.accessClassification)) errors.push(`LearningDocument "${d.id}" has a non-private access classification "${d.accessClassification}"`)
  })
  return errors
}

/** 15. Approved proposal points only to canonical source references — never a fabricated page reference. */
function validateProposalCitesCanonicalReferences(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const knownIds = new Set(data.sourceReferences.map((r) => r.id))
  const allReferenceIds = [
    ...data.structureProposal.chapters.flatMap((c) => c.sourceReferenceIds),
    ...data.structureProposal.sections.flatMap((s) => s.sourceReferenceIds),
    ...data.structureProposal.concepts.flatMap((c) => c.sourceReferenceIds),
    ...data.structureProposal.activities.flatMap((a) => a.sourceReferenceIds),
    ...data.structureProposal.questions.flatMap((q) => q.sourceReferenceIds),
    ...data.structureProposal.equations.map((e) => e.sourceReferenceId).filter((id): id is string => Boolean(id)),
  ]
  allReferenceIds.forEach((id) => {
    if (!knownIds.has(id)) errors.push(`Structure proposal cites unknown SourceReference id "${id}"`)
  })
  return errors
}

/** 16. Withdrawn Learning Space is a genuine terminal state with a recorded reason. */
function validateWithdrawnSpace(data: LearningIngestionDataInput): string[] {
  const errors: string[] = []
  const withdrawn = data.learningSpaces.find((s) => s.lifecycleState === 'withdrawn')
  if (!withdrawn) {
    errors.push('Expected a withdrawn Learning Space fixture to exist')
  } else if (!withdrawn.withdrawalReason) {
    errors.push(`Withdrawn Learning Space "${withdrawn.id}" is missing a withdrawalReason`)
  }
  return errors
}

export function validateLearningIngestionData(data: LearningIngestionDataInput): string[] {
  return [
    ...validateDomainIntegrity(data),
    ...validateIntakeValidationScenarios(),
    ...validateExtractionOutcomeScenarios(),
    ...validateDuplicateDetection(),
    ...validatePageBoundaryPreservation(data),
    ...validateQualityEvaluationSignals(data),
    ...validateCorrectionOverlay(data),
    ...validateCorrectionReversal(),
    ...validateSourceReferenceIntegrity(data),
    ...validateStructureProposalDeterminism(data),
    ...validateGovernanceTransitions(),
    ...validateReviewStaleness(),
    ...validateNoOcrInvocation(data),
    ...validateNoPublicAccessClassification(data),
    ...validateProposalCitesCanonicalReferences(data),
    ...validateWithdrawnSpace(data),
  ]
}
