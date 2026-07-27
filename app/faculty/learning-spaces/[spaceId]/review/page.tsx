import { notFound } from 'next/navigation'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { LearningSpaceWorkspace } from '@/components/learning/LearningSpaceWorkspace'

export async function generateMetadata({ params }: { params: { spaceId: string } }) {
  const space = await mockLearningIngestionRepository.getLearningSpace(facultyUser.id, params.spaceId)
  return { title: space ? `${space.title} — Syrka Campus` : 'Learning Space — Syrka Campus' }
}

export default async function LearningSpaceReviewPage({ params }: { params: { spaceId: string } }) {
  const space = await mockLearningIngestionRepository.getLearningSpace(facultyUser.id, params.spaceId)
  if (!space) notFound()

  const spaceVersion = space.currentVersionId ? await mockLearningIngestionRepository.getLearningSpaceVersion(facultyUser.id, space.currentVersionId) : undefined
  const sourceVersionId = spaceVersion?.sourceDocumentVersionId
  const documentVersion = sourceVersionId ? await mockLearningIngestionRepository.getDocumentVersion(facultyUser.id, sourceVersionId) : undefined
  const document = documentVersion ? await mockLearningIngestionRepository.getDocument(facultyUser.id, documentVersion.documentId) : undefined
  const pages = sourceVersionId ? await mockLearningIngestionRepository.listPagesForVersion(facultyUser.id, sourceVersionId) : []
  const warnings = sourceVersionId ? await mockLearningIngestionRepository.listWarningsForVersion(facultyUser.id, sourceVersionId) : []
  const sourceReferences = sourceVersionId ? await mockLearningIngestionRepository.listSourceReferencesForVersion(facultyUser.id, sourceVersionId) : []
  const corrections = sourceVersionId ? await mockLearningIngestionRepository.listCorrectionsForVersion(facultyUser.id, sourceVersionId) : []
  const proposal = spaceVersion?.structureProposalId ? await mockLearningIngestionRepository.getStructureProposal(facultyUser.id, spaceVersion.structureProposalId) : undefined

  return (
    <LearningSpaceWorkspace
      space={space}
      spaceVersion={spaceVersion}
      document={document}
      documentVersion={documentVersion}
      pages={pages}
      warnings={warnings}
      sourceReferences={sourceReferences}
      corrections={corrections}
      proposal={proposal}
    />
  )
}
