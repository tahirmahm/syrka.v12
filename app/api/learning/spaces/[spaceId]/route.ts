import { NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const space = await inMemoryLearningIngestionRepository.getLearningSpace(guard.actor.institutionId, params.spaceId)
  if (!space) return NextResponse.json({ ok: false, message: 'Learning Space not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, space })
}
