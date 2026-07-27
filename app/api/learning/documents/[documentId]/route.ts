import { NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function GET(_req: Request, { params }: { params: { documentId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const { institutionId } = guard.actor

  const document = await inMemoryLearningIngestionRepository.getDocument(institutionId, params.documentId)
  if (!document || !document.currentVersionId) {
    return NextResponse.json({ ok: false, message: 'Document not found.' }, { status: 404 })
  }
  const documentVersion = await inMemoryLearningIngestionRepository.getDocumentVersion(institutionId, document.currentVersionId)
  const pages = await inMemoryLearningIngestionRepository.listPagesForVersion(institutionId, document.currentVersionId)
  const warnings = await inMemoryLearningIngestionRepository.listWarningsForVersion(institutionId, document.currentVersionId)
  const sourceReferences = await inMemoryLearningIngestionRepository.listSourceReferencesForVersion(institutionId, document.currentVersionId)
  const corrections = await inMemoryLearningIngestionRepository.listCorrectionsForVersion(institutionId, document.currentVersionId)

  return NextResponse.json({ ok: true, document, documentVersion, pages, warnings, sourceReferences, corrections })
}
