import type {
  CurriculumLifecycleState,
  CurriculumOwner,
  CurriculumReview,
  DocumentSourceType,
  ExtractionWarning,
  IntakeFailureReason,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  LearningSpace,
  LearningSpaceVersion,
  LearningStructureProposal,
  ParsedLearningDocument,
  SourceRegion,
  SourceReference,
  SourceRightsDeclaration,
  TeacherCorrection,
} from '@/lib/campus-types'
import { NativePdfProvider } from '@/lib/services/learning/pdf-provider'
import { INTAKE_LIMITS, classifyExtractionOutcome, computeContentHash, isDuplicateDocument, sanitizeFilename, validateIntakeMetadata, validatePageCount } from '@/lib/services/learning/document-intake'
import { createExtractionWarningsForPage, evaluateDocumentPageQuality } from '@/lib/services/learning/extraction-quality'
import { acceptCorrection as acceptCorrectionRecord, createCorrection, resolveWarningsAffectedByCorrection, revertCorrection as revertCorrectionRecord, type CreateCorrectionInput } from '@/lib/services/learning/correction-repository'
import { DeterministicStructureProposalProvider, sourceReferenceIdForPage } from '@/lib/services/learning/structure-proposal'
import { isTransitionAllowed } from '@/lib/services/learning/curriculum-review'

interface LearningIngestionStore {
  documents: Map<string, LearningDocument>
  documentVersions: Map<string, LearningDocumentVersion>
  pages: Map<string, LearningPage>
  sourceRegions: Map<string, SourceRegion>
  sourceReferences: Map<string, SourceReference>
  extractionWarnings: Map<string, ExtractionWarning>
  teacherCorrections: Map<string, TeacherCorrection>
  structureProposals: Map<string, LearningStructureProposal>
  learningSpaces: Map<string, LearningSpace>
  learningSpaceVersions: Map<string, LearningSpaceVersion>
  curriculumOwners: Map<string, CurriculumOwner>
  curriculumReviews: Map<string, CurriculumReview>
}

const globalStore = globalThis as unknown as { __learningIngestionStores?: Map<string, LearningIngestionStore> }
const stores = globalStore.__learningIngestionStores ?? new Map<string, LearningIngestionStore>()
globalStore.__learningIngestionStores = stores

function createEmptyStore(): LearningIngestionStore {
  return {
    documents: new Map(),
    documentVersions: new Map(),
    pages: new Map(),
    sourceRegions: new Map(),
    sourceReferences: new Map(),
    extractionWarnings: new Map(),
    teacherCorrections: new Map(),
    structureProposals: new Map(),
    learningSpaces: new Map(),
    learningSpaceVersions: new Map(),
    curriculumOwners: new Map(),
    curriculumReviews: new Map(),
  }
}

function getStore(ownerId: string): LearningIngestionStore {
  let store = stores.get(ownerId)
  if (!store) {
    store = createEmptyStore()
    stores.set(ownerId, store)
  }
  return store
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export interface IntakeDocumentInput {
  ownerId: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  sourceLabel: string
  sourceType: DocumentSourceType
  sourceRightsDeclaration: SourceRightsDeclaration
  buffer: Uint8Array
}

export interface IntakeDocumentOutcome {
  ok: boolean
  message: string
  reason?: IntakeFailureReason
  document?: LearningDocument
  documentVersion?: LearningDocumentVersion
  pages?: LearningPage[]
  warnings?: ExtractionWarning[]
}

export interface StructureProposalOutcome {
  ok: boolean
  message: string
  space?: LearningSpace
  proposal?: LearningStructureProposal
}

export interface TransitionOutcome {
  ok: boolean
  message: string
  space?: LearningSpace
}

export interface LearningIngestionRepository {
  intakeDocument(input: IntakeDocumentInput): Promise<IntakeDocumentOutcome>
  listDocuments(ownerId: string): Promise<LearningDocument[]>
  getDocument(ownerId: string, documentId: string): Promise<LearningDocument | undefined>
  getDocumentVersion(ownerId: string, versionId: string): Promise<LearningDocumentVersion | undefined>
  listPagesForVersion(ownerId: string, versionId: string): Promise<LearningPage[]>
  listWarningsForVersion(ownerId: string, versionId: string): Promise<ExtractionWarning[]>
  listSourceReferencesForVersion(ownerId: string, versionId: string): Promise<SourceReference[]>
  listCorrectionsForVersion(ownerId: string, versionId: string): Promise<TeacherCorrection[]>

  createLearningSpace(ownerId: string, title: string, curriculumId: string, documentVersionId: string): Promise<LearningSpace>
  listLearningSpaces(ownerId: string): Promise<LearningSpace[]>
  getLearningSpace(ownerId: string, spaceId: string): Promise<LearningSpace | undefined>
  getLearningSpaceVersion(ownerId: string, versionId: string): Promise<LearningSpaceVersion | undefined>
  transitionLearningSpace(ownerId: string, spaceId: string, next: CurriculumLifecycleState): Promise<TransitionOutcome>

  generateStructureProposal(ownerId: string, spaceId: string): Promise<StructureProposalOutcome>
  getStructureProposal(ownerId: string, proposalId: string): Promise<LearningStructureProposal | undefined>

  addCorrection(ownerId: string, input: CreateCorrectionInput): Promise<TeacherCorrection>
  acceptCorrection(ownerId: string, correctionId: string): Promise<TeacherCorrection | undefined>
  revertCorrection(ownerId: string, correctionId: string): Promise<TeacherCorrection | undefined>

  approveLearningSpace(ownerId: string, spaceId: string, reviewerId: string, note: string): Promise<{ ok: true; space: LearningSpace; version: LearningSpaceVersion; review: CurriculumReview } | { ok: false; message: string }>
  withdrawLearningSpace(ownerId: string, spaceId: string, reason: string): Promise<TransitionOutcome>
}

export const mockLearningIngestionRepository: LearningIngestionRepository = {
  async intakeDocument(input) {
    const store = getStore(input.ownerId)
    const header = input.buffer.slice(0, 5)
    const metadataCheck = validateIntakeMetadata({ mimeType: input.mimeType, sizeBytes: input.sizeBytes, header })
    if (!metadataCheck.ok) return { ok: false, message: metadataCheck.message, reason: metadataCheck.reason }

    const contentHash = computeContentHash(input.buffer)
    const existingHashes = Array.from(store.documents.values()).map((d) => d.contentHash).filter((h): h is string => Boolean(h))
    if (isDuplicateDocument(contentHash, existingHashes)) {
      return { ok: false, message: 'This document has already been uploaded (identical content hash).', reason: 'duplicate_document' }
    }

    const result = await NativePdfProvider.extract(input.buffer)
    const pageCountCheck = result.totalPages > 0 ? validatePageCount(result.totalPages, INTAKE_LIMITS) : { ok: true, message: 'n/a' }
    if (!pageCountCheck.ok) return { ok: false, message: pageCountCheck.message, reason: pageCountCheck.reason }

    const outcome = classifyExtractionOutcome(result)
    if (!outcome.ok) return { ok: false, message: outcome.message, reason: outcome.reason }

    const documentId = nextId('lsrc-doc')
    const versionId = nextId('lsrc-docver')
    const now = new Date().toISOString()

    const pageIds = result.pages.map(() => nextId('lsrc-page'))
    const qualityEvaluations = evaluateDocumentPageQuality(pageIds, result.pages)

    const pages: LearningPage[] = result.pages.map((extracted, index) => ({
      id: pageIds[index],
      documentVersionId: versionId,
      pageNumber: extracted.pageNumber,
      extractedText: extracted.rawText,
      extractionConfidence: qualityEvaluations[index].extractionConfidence,
      pageExtractionMethod: extracted.extractionMethod,
      textItemCount: extracted.textItemCount,
      readingOrderConfidence: extracted.readingOrderConfidence,
      qualityState: qualityEvaluations[index].state,
      manualCorrectionRequired: qualityEvaluations[index].state === 'manual_correction_required',
      ocrRequired: qualityEvaluations[index].state === 'ocr_required',
    }))

    const warnings: ExtractionWarning[] = qualityEvaluations.flatMap((evaluation, index) => createExtractionWarningsForPage(`${pageIds[index]}-warn`, evaluation))

    const sourceReferences: SourceReference[] = pages.map((page) => ({
      id: sourceReferenceIdForPage(page.id),
      documentId,
      documentVersionId: versionId,
      pageId: page.id,
      excerpt: page.extractedText?.slice(0, 240),
      extractionConfidence: page.extractionConfidence,
    }))

    const document: LearningDocument = {
      id: documentId,
      title: input.originalFilename,
      sourceLabel: input.sourceLabel,
      ownerId: input.ownerId,
      currentVersionId: versionId,
      publicationStatus: 'draft',
      contentHash,
      importedAt: now,
      originalFilename: input.originalFilename,
      safeDisplayFilename: sanitizeFilename(input.originalFilename),
      sourceType: input.sourceType,
      accessClassification: 'institution_private',
      processingState: result.partial || outcome.reason === 'some_pages_require_ocr' ? 'partially_extracted' : 'extracted',
      sourceRightsDeclaration: input.sourceRightsDeclaration,
    }

    const documentVersion: LearningDocumentVersion = {
      id: versionId,
      documentId,
      version: 1,
      createdAt: now,
      extractionMethod: 'native_pdf',
      contentHash,
      extractionProvider: NativePdfProvider.id,
      extractionTimestamp: now,
      extractionConfidence: pages.length > 0 ? pages.reduce((sum, p) => sum + (p.extractionConfidence ?? 0), 0) / pages.length : 0,
      correctionStatus: 'none',
    }

    store.documents.set(documentId, document)
    store.documentVersions.set(versionId, documentVersion)
    pages.forEach((p) => store.pages.set(p.id, p))
    warnings.forEach((w) => store.extractionWarnings.set(w.id, w))
    sourceReferences.forEach((r) => store.sourceReferences.set(r.id, r))

    return { ok: true, message: outcome.message, document, documentVersion, pages, warnings }
  },

  async listDocuments(ownerId) {
    return Array.from(getStore(ownerId).documents.values())
  },
  async getDocument(ownerId, documentId) {
    return getStore(ownerId).documents.get(documentId)
  },
  async getDocumentVersion(ownerId, versionId) {
    return getStore(ownerId).documentVersions.get(versionId)
  },
  async listPagesForVersion(ownerId, versionId) {
    return Array.from(getStore(ownerId).pages.values())
      .filter((p) => p.documentVersionId === versionId)
      .sort((a, b) => a.pageNumber - b.pageNumber)
  },
  async listWarningsForVersion(ownerId, versionId) {
    const pageIds = new Set((await this.listPagesForVersion(ownerId, versionId)).map((p) => p.id))
    return Array.from(getStore(ownerId).extractionWarnings.values()).filter((w) => pageIds.has(w.pageId))
  },
  async listSourceReferencesForVersion(ownerId, versionId) {
    return Array.from(getStore(ownerId).sourceReferences.values()).filter((r) => r.documentVersionId === versionId)
  },
  async listCorrectionsForVersion(ownerId, versionId) {
    return Array.from(getStore(ownerId).teacherCorrections.values()).filter((c) => c.documentVersionId === versionId)
  },

  async createLearningSpace(ownerId, title, curriculumId, documentVersionId) {
    const store = getStore(ownerId)
    const id = nextId('lsp')
    const ownerRecordId = nextId('lsp-owner')
    const space: LearningSpace = { id, title, curriculumId, ownerId: ownerRecordId, currentVersionId: undefined, lifecycleState: 'draft' }
    const owner: CurriculumOwner = { id: ownerRecordId, learningSpaceId: id, primaryOwnerId: ownerId, contributorIds: [] }
    store.learningSpaces.set(id, space)
    store.curriculumOwners.set(ownerRecordId, owner)
    // Stash the source document version on the space's eventual version record once one is created.
    const versionId = nextId('lspv')
    const version: LearningSpaceVersion = { id: versionId, learningSpaceId: id, version: 1, createdAt: new Date().toISOString(), sourceDocumentVersionId: documentVersionId }
    store.learningSpaceVersions.set(versionId, version)
    const withVersion: LearningSpace = { ...space, currentVersionId: versionId }
    store.learningSpaces.set(id, withVersion)
    return withVersion
  },
  async listLearningSpaces(ownerId) {
    return Array.from(getStore(ownerId).learningSpaces.values())
  },
  async getLearningSpace(ownerId, spaceId) {
    return getStore(ownerId).learningSpaces.get(spaceId)
  },
  async getLearningSpaceVersion(ownerId, versionId) {
    return getStore(ownerId).learningSpaceVersions.get(versionId)
  },
  async transitionLearningSpace(ownerId, spaceId, next) {
    const store = getStore(ownerId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    if (!isTransitionAllowed(space.lifecycleState, next)) {
      return { ok: false, message: `Cannot move from "${space.lifecycleState}" to "${next}".` }
    }
    const updated: LearningSpace = { ...space, lifecycleState: next }
    store.learningSpaces.set(spaceId, updated)
    return { ok: true, message: `Moved to "${next}".`, space: updated }
  },

  async generateStructureProposal(ownerId, spaceId) {
    const store = getStore(ownerId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    const currentVersion = space.currentVersionId ? store.learningSpaceVersions.get(space.currentVersionId) : undefined
    const sourceVersionId = currentVersion?.sourceDocumentVersionId
    if (!sourceVersionId) return { ok: false, message: 'No source document version is attached to this Learning Space yet.' }

    const pages = await this.listPagesForVersion(ownerId, sourceVersionId)
    const parsed: ParsedLearningDocument = {
      documentId: store.documentVersions.get(sourceVersionId)?.documentId ?? '',
      documentVersionId: sourceVersionId,
      pages: pages.map((p) => ({ pageId: p.id, pageNumber: p.pageNumber, text: p.extractedText ?? '', quality: p.qualityState ?? 'reliable' })),
    }

    const extractingResult = await this.transitionLearningSpace(ownerId, spaceId, 'extracting')
    if (!extractingResult.ok) {
      // Already past 'extracting' (e.g. re-generating from extraction_review) — proceed without re-transitioning.
    }

    const proposal = await DeterministicStructureProposalProvider.proposeStructure(parsed)
    store.structureProposals.set(proposal.id, proposal)

    const warnings = await this.listWarningsForVersion(ownerId, sourceVersionId)
    const hasUnresolvedHighSeverity = warnings.some((w) => w.severity === 'high' && !w.resolved)
    const nextState: CurriculumLifecycleState = hasUnresolvedHighSeverity ? 'corrections_required' : 'structure_review'

    const fromState = store.learningSpaces.get(spaceId)?.lifecycleState ?? 'draft'
    const intermediateOk = isTransitionAllowed(fromState, 'extraction_review') ? (await this.transitionLearningSpace(ownerId, spaceId, 'extraction_review')).ok : true
    void intermediateOk
    const finalTransition = await this.transitionLearningSpace(ownerId, spaceId, nextState)

    const updatedVersion: LearningSpaceVersion = { ...(store.learningSpaceVersions.get(space.currentVersionId as string) as LearningSpaceVersion), structureProposalId: proposal.id }
    store.learningSpaceVersions.set(updatedVersion.id, updatedVersion)

    return { ok: true, message: finalTransition.message, space: finalTransition.space ?? store.learningSpaces.get(spaceId), proposal }
  },
  async getStructureProposal(ownerId, proposalId) {
    return getStore(ownerId).structureProposals.get(proposalId)
  },

  async addCorrection(ownerId, input) {
    const store = getStore(ownerId)
    const correction = createCorrection(input, new Date().toISOString())
    store.teacherCorrections.set(correction.id, correction)
    return correction
  },
  async acceptCorrection(ownerId, correctionId) {
    const store = getStore(ownerId)
    const correction = store.teacherCorrections.get(correctionId)
    if (!correction) return undefined
    const accepted = acceptCorrectionRecord(correction)
    store.teacherCorrections.set(correctionId, accepted)
    const warnings = Array.from(store.extractionWarnings.values())
    const resolved = resolveWarningsAffectedByCorrection(accepted, warnings)
    resolved.forEach((w) => store.extractionWarnings.set(w.id, w))
    return accepted
  },
  async revertCorrection(ownerId, correctionId) {
    const store = getStore(ownerId)
    const correction = store.teacherCorrections.get(correctionId)
    if (!correction) return undefined
    const reverted = revertCorrectionRecord(correction)
    store.teacherCorrections.set(correctionId, reverted)
    return reverted
  },

  async approveLearningSpace(ownerId, spaceId, reviewerId, note) {
    const store = getStore(ownerId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    if (!isTransitionAllowed(space.lifecycleState, 'approved')) {
      return { ok: false, message: `Cannot approve from state "${space.lifecycleState}" — must reach "ready_for_approval" first.` }
    }
    const now = new Date().toISOString()
    const versionId = space.currentVersionId as string
    const reviewId = nextId('lg-review')
    const review: CurriculumReview = { id: reviewId, learningSpaceVersionId: versionId, reviewerId, decision: 'approved', note, reviewedAt: now }
    store.curriculumReviews.set(reviewId, review)

    const priorVersion = store.learningSpaceVersions.get(versionId)
    const approvedVersion: LearningSpaceVersion = { ...(priorVersion as LearningSpaceVersion), approvedAt: now }
    store.learningSpaceVersions.set(versionId, approvedVersion)

    const updatedSpace: LearningSpace = { ...space, lifecycleState: 'approved' }
    store.learningSpaces.set(spaceId, updatedSpace)

    return { ok: true, space: updatedSpace, version: approvedVersion, review }
  },
  async withdrawLearningSpace(ownerId, spaceId, reason) {
    const store = getStore(ownerId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    if (!isTransitionAllowed(space.lifecycleState, 'withdrawn')) {
      return { ok: false, message: `Cannot withdraw from state "${space.lifecycleState}".` }
    }
    const updated: LearningSpace = { ...space, lifecycleState: 'withdrawn', withdrawalReason: reason }
    store.learningSpaces.set(spaceId, updated)
    return { ok: true, message: 'Withdrawn.', space: updated }
  },
}
