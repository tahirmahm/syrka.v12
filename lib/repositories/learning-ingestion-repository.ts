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
import { isLearningAuthoringEnabled, isProductionRuntime } from '@/lib/services/learning/authoring-gate'
import { ProcessingTimeoutError, uploadConcurrencyPerInstitution, withProcessingTimeout } from '@/lib/services/learning/rate-limiter'
import { assertRepositoryConfigurationSafe } from '@/lib/services/learning/repository-safety'

/**
 * IN-MEMORY, SINGLE-PROCESS, DEVELOPMENT-ONLY. Records live in a
 * process-local Map on globalThis — they do not survive a redeploy, are
 * not shared across Vercel instances, and disappear on restart. This is
 * deliberately not a production repository; see the Learning Persistence
 * and Tenancy Architecture Checkpoint for the durable replacement
 * (Supabase Storage + Postgres + RLS) and its repository-interface
 * boundary. The invariant below refuses to let this repository serve
 * production traffic if Learning authoring is ever enabled there.
 */
const repositorySafetyErrors = assertRepositoryConfigurationSafe(isProductionRuntime(), isLearningAuthoringEnabled())
if (repositorySafetyErrors.length > 0) {
  throw new Error(repositorySafetyErrors.join('\n'))
}

/** Every store is partitioned by institution — looking a record up under the wrong institutionId simply cannot find it, which is the tenant-isolation mechanism itself, not a check layered on top of it. */
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

function getStore(institutionId: string): LearningIngestionStore {
  let store = stores.get(institutionId)
  if (!store) {
    store = createEmptyStore()
    stores.set(institutionId, store)
  }
  return store
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export interface IntakeDocumentInput {
  institutionId: string
  actorId: string
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

/**
 * Every method's first parameter is institutionId — the tenant
 * partition. Callers must pass a LearningActor's institutionId (see
 * lib/services/learning/actor.ts), never a client-supplied value.
 */
export interface LearningIngestionRepository {
  intakeDocument(input: IntakeDocumentInput): Promise<IntakeDocumentOutcome>
  listDocuments(institutionId: string): Promise<LearningDocument[]>
  getDocument(institutionId: string, documentId: string): Promise<LearningDocument | undefined>
  getDocumentVersion(institutionId: string, versionId: string): Promise<LearningDocumentVersion | undefined>
  listPagesForVersion(institutionId: string, versionId: string): Promise<LearningPage[]>
  listWarningsForVersion(institutionId: string, versionId: string): Promise<ExtractionWarning[]>
  listSourceReferencesForVersion(institutionId: string, versionId: string): Promise<SourceReference[]>
  listCorrectionsForVersion(institutionId: string, versionId: string): Promise<TeacherCorrection[]>

  createLearningSpace(institutionId: string, actorId: string, title: string, curriculumId: string, documentVersionId: string): Promise<LearningSpace>
  listLearningSpaces(institutionId: string): Promise<LearningSpace[]>
  getLearningSpace(institutionId: string, spaceId: string): Promise<LearningSpace | undefined>
  getLearningSpaceVersion(institutionId: string, versionId: string): Promise<LearningSpaceVersion | undefined>
  transitionLearningSpace(institutionId: string, spaceId: string, next: CurriculumLifecycleState): Promise<TransitionOutcome>

  generateStructureProposal(institutionId: string, spaceId: string): Promise<StructureProposalOutcome>
  getStructureProposal(institutionId: string, proposalId: string): Promise<LearningStructureProposal | undefined>

  addCorrection(institutionId: string, input: CreateCorrectionInput): Promise<TeacherCorrection>
  acceptCorrection(institutionId: string, correctionId: string): Promise<TeacherCorrection | undefined>
  revertCorrection(institutionId: string, correctionId: string): Promise<TeacherCorrection | undefined>

  approveLearningSpace(institutionId: string, spaceId: string, reviewerId: string, note: string): Promise<{ ok: true; space: LearningSpace; version: LearningSpaceVersion; review: CurriculumReview } | { ok: false; message: string }>
  withdrawLearningSpace(institutionId: string, spaceId: string, reason: string): Promise<TransitionOutcome>
}

export const inMemoryLearningIngestionRepository: LearningIngestionRepository = {
  async intakeDocument(input) {
    const store = getStore(input.institutionId)
    const header = input.buffer.slice(0, 5)
    const metadataCheck = validateIntakeMetadata({ mimeType: input.mimeType, sizeBytes: input.sizeBytes, header })
    if (!metadataCheck.ok) return { ok: false, message: metadataCheck.message, reason: metadataCheck.reason }

    const contentHash = computeContentHash(input.buffer)
    const existingHashes = Array.from(store.documents.values()).map((d) => d.contentHash).filter((h): h is string => Boolean(h))
    if (isDuplicateDocument(contentHash, existingHashes)) {
      return { ok: false, message: 'This document has already been uploaded (identical content hash).', reason: 'duplicate_document' }
    }

    if (!uploadConcurrencyPerInstitution.tryAcquire(input.institutionId)) {
      return { ok: false, message: 'Too many documents are being processed for your institution right now. Please try again shortly.' }
    }

    let result
    try {
      result = await withProcessingTimeout(NativePdfProvider.extract(input.buffer), INTAKE_LIMITS.processingTimeoutMs)
    } catch (err) {
      if (err instanceof ProcessingTimeoutError) {
        return { ok: false, message: 'Extraction took too long and was cancelled. Try a smaller document.', reason: 'processing_timeout' }
      }
      throw err
    } finally {
      uploadConcurrencyPerInstitution.release(input.institutionId)
    }

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
      ownerId: input.actorId,
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

  async listDocuments(institutionId) {
    return Array.from(getStore(institutionId).documents.values())
  },
  async getDocument(institutionId, documentId) {
    return getStore(institutionId).documents.get(documentId)
  },
  async getDocumentVersion(institutionId, versionId) {
    return getStore(institutionId).documentVersions.get(versionId)
  },
  async listPagesForVersion(institutionId, versionId) {
    return Array.from(getStore(institutionId).pages.values())
      .filter((p) => p.documentVersionId === versionId)
      .sort((a, b) => a.pageNumber - b.pageNumber)
  },
  async listWarningsForVersion(institutionId, versionId) {
    const pageIds = new Set((await this.listPagesForVersion(institutionId, versionId)).map((p) => p.id))
    return Array.from(getStore(institutionId).extractionWarnings.values()).filter((w) => pageIds.has(w.pageId))
  },
  async listSourceReferencesForVersion(institutionId, versionId) {
    return Array.from(getStore(institutionId).sourceReferences.values()).filter((r) => r.documentVersionId === versionId)
  },
  async listCorrectionsForVersion(institutionId, versionId) {
    return Array.from(getStore(institutionId).teacherCorrections.values()).filter((c) => c.documentVersionId === versionId)
  },

  async createLearningSpace(institutionId, actorId, title, curriculumId, documentVersionId) {
    const store = getStore(institutionId)
    const id = nextId('lsp')
    const ownerRecordId = nextId('lsp-owner')
    const space: LearningSpace = { id, title, curriculumId, ownerId: ownerRecordId, currentVersionId: undefined, lifecycleState: 'draft' }
    const owner: CurriculumOwner = { id: ownerRecordId, learningSpaceId: id, primaryOwnerId: actorId, contributorIds: [] }
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
  async listLearningSpaces(institutionId) {
    return Array.from(getStore(institutionId).learningSpaces.values())
  },
  async getLearningSpace(institutionId, spaceId) {
    return getStore(institutionId).learningSpaces.get(spaceId)
  },
  async getLearningSpaceVersion(institutionId, versionId) {
    return getStore(institutionId).learningSpaceVersions.get(versionId)
  },
  async transitionLearningSpace(institutionId, spaceId, next) {
    const store = getStore(institutionId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    if (!isTransitionAllowed(space.lifecycleState, next)) {
      return { ok: false, message: `Cannot move from "${space.lifecycleState}" to "${next}".` }
    }
    const updated: LearningSpace = { ...space, lifecycleState: next }
    store.learningSpaces.set(spaceId, updated)
    return { ok: true, message: `Moved to "${next}".`, space: updated }
  },

  async generateStructureProposal(institutionId, spaceId) {
    const store = getStore(institutionId)
    const space = store.learningSpaces.get(spaceId)
    if (!space) return { ok: false, message: 'Learning Space not found.' }
    const currentVersion = space.currentVersionId ? store.learningSpaceVersions.get(space.currentVersionId) : undefined
    const sourceVersionId = currentVersion?.sourceDocumentVersionId
    if (!sourceVersionId) return { ok: false, message: 'No source document version is attached to this Learning Space yet.' }

    const pages = await this.listPagesForVersion(institutionId, sourceVersionId)
    const parsed: ParsedLearningDocument = {
      documentId: store.documentVersions.get(sourceVersionId)?.documentId ?? '',
      documentVersionId: sourceVersionId,
      pages: pages.map((p) => ({ pageId: p.id, pageNumber: p.pageNumber, text: p.extractedText ?? '', quality: p.qualityState ?? 'reliable' })),
    }

    const extractingResult = await this.transitionLearningSpace(institutionId, spaceId, 'extracting')
    if (!extractingResult.ok) {
      // Already past 'extracting' (e.g. re-generating from extraction_review) — proceed without re-transitioning.
    }

    const proposal = await DeterministicStructureProposalProvider.proposeStructure(parsed)
    store.structureProposals.set(proposal.id, proposal)

    const warnings = await this.listWarningsForVersion(institutionId, sourceVersionId)
    const hasUnresolvedHighSeverity = warnings.some((w) => w.severity === 'high' && !w.resolved)
    const nextState: CurriculumLifecycleState = hasUnresolvedHighSeverity ? 'corrections_required' : 'structure_review'

    const fromState = store.learningSpaces.get(spaceId)?.lifecycleState ?? 'draft'
    const intermediateOk = isTransitionAllowed(fromState, 'extraction_review') ? (await this.transitionLearningSpace(institutionId, spaceId, 'extraction_review')).ok : true
    void intermediateOk
    const finalTransition = await this.transitionLearningSpace(institutionId, spaceId, nextState)

    const updatedVersion: LearningSpaceVersion = { ...(store.learningSpaceVersions.get(space.currentVersionId as string) as LearningSpaceVersion), structureProposalId: proposal.id }
    store.learningSpaceVersions.set(updatedVersion.id, updatedVersion)

    return { ok: true, message: finalTransition.message, space: finalTransition.space ?? store.learningSpaces.get(spaceId), proposal }
  },
  async getStructureProposal(institutionId, proposalId) {
    return getStore(institutionId).structureProposals.get(proposalId)
  },

  async addCorrection(institutionId, input) {
    const store = getStore(institutionId)
    const correction = createCorrection(input, new Date().toISOString())
    store.teacherCorrections.set(correction.id, correction)
    return correction
  },
  async acceptCorrection(institutionId, correctionId) {
    const store = getStore(institutionId)
    const correction = store.teacherCorrections.get(correctionId)
    if (!correction) return undefined
    const accepted = acceptCorrectionRecord(correction)
    store.teacherCorrections.set(correctionId, accepted)
    const warnings = Array.from(store.extractionWarnings.values())
    const resolved = resolveWarningsAffectedByCorrection(accepted, warnings)
    resolved.forEach((w) => store.extractionWarnings.set(w.id, w))
    return accepted
  },
  async revertCorrection(institutionId, correctionId) {
    const store = getStore(institutionId)
    const correction = store.teacherCorrections.get(correctionId)
    if (!correction) return undefined
    const reverted = revertCorrectionRecord(correction)
    store.teacherCorrections.set(correctionId, reverted)
    return reverted
  },

  async approveLearningSpace(institutionId, spaceId, reviewerId, note) {
    const store = getStore(institutionId)
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
  async withdrawLearningSpace(institutionId, spaceId, reason) {
    const store = getStore(institutionId)
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
