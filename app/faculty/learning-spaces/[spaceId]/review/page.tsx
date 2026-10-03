import { notFound } from 'next/navigation'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { isLearningAuthoringEnabled } from '@/lib/services/learning/authoring-gate'
import { resolveLearningActor } from '@/lib/services/learning/actor'
import { LearningSpaceWorkspace } from '@/components/learning/LearningSpaceWorkspace'

export async function generateMetadata({ params }: { params: { spaceId: string } }) {
  if (!isLearningAuthoringEnabled()) notFound()
  const resolution = await resolveLearningActor()
  if (!resolution.ok) notFound()
  const space = await inMemoryLearningIngestionRepository.getLearningSpace(resolution.actor.institutionId, params.spaceId)
  return { title: space ? `${space.title} — Syrka Campus` : 'Learning Space — Syrka Campus' }
}

export default async function LearningSpaceReviewPage({ params }: { params: { spaceId: string } }) {
  if (!isLearningAuthoringEnabled()) notFound()
  const resolution = await resolveLearningActor()
  if (!resolution.ok) notFound()
  const { institutionId } = resolution.actor

  const space = await inMemoryLearningIngestionRepository.getLearningSpace(institutionId, params.spaceId)
  if (!space) notFound()

  const spaceVersion = space.currentVersionId ? await inMemoryLearningIngestionRepository.getLearningSpaceVersion(institutionId, space.currentVersionId) : undefined
  const sourceVersionId = spaceVersion?.sourceDocumentVersionId
  const documentVersion = sourceVersionId ? await inMemoryLearningIngestionRepository.getDocumentVersion(institutionId, sourceVersionId) : undefined
  const document = documentVersion ? await inMemoryLearningIngestionRepository.getDocument(institutionId, documentVersion.documentId) : undefined
  const pages = sourceVersionId ? await inMemoryLearningIngestionRepository.listPagesForVersion(institutionId, sourceVersionId) : []
  const warnings = sourceVersionId ? await inMemoryLearningIngestionRepository.listWarningsForVersion(institutionId, sourceVersionId) : []
  const sourceReferences = sourceVersionId ? await inMemoryLearningIngestionRepository.listSourceReferencesForVersion(institutionId, sourceVersionId) : []
  const corrections = sourceVersionId ? await inMemoryLearningIngestionRepository.listCorrectionsForVersion(institutionId, sourceVersionId) : []
  const proposal = spaceVersion?.structureProposalId ? await inMemoryLearningIngestionRepository.getStructureProposal(institutionId, spaceVersion.structureProposalId) : undefined

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
