import { NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function GET(_req: Request, { params }: { params: { documentId: string } }) {
  const document = await mockLearningIngestionRepository.getDocument(facultyUser.id, params.documentId)
  if (!document || !document.currentVersionId) {
    return NextResponse.json({ ok: false, message: 'Document not found.' }, { status: 404 })
  }
  const documentVersion = await mockLearningIngestionRepository.getDocumentVersion(facultyUser.id, document.currentVersionId)
  const pages = await mockLearningIngestionRepository.listPagesForVersion(facultyUser.id, document.currentVersionId)
  const warnings = await mockLearningIngestionRepository.listWarningsForVersion(facultyUser.id, document.currentVersionId)
  const sourceReferences = await mockLearningIngestionRepository.listSourceReferencesForVersion(facultyUser.id, document.currentVersionId)
  const corrections = await mockLearningIngestionRepository.listCorrectionsForVersion(facultyUser.id, document.currentVersionId)

  return NextResponse.json({ ok: true, document, documentVersion, pages, warnings, sourceReferences, corrections })
}
