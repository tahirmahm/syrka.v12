import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const { actor } = guard

  const body = await req.json().catch(() => ({}))
  const note = (body as { note?: string }).note ?? ''
  const outcome = await inMemoryLearningIngestionRepository.approveLearningSpace(actor.institutionId, params.spaceId, actor.userId, note)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
