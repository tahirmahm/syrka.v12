import { NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function POST(_req: Request, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const outcome = await inMemoryLearningIngestionRepository.generateStructureProposal(guard.actor.institutionId, params.spaceId)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
