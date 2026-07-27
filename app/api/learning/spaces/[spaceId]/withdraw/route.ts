import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const reason = (body as { reason?: string }).reason ?? ''
  const outcome = await inMemoryLearningIngestionRepository.withdrawLearningSpace(guard.actor.institutionId, params.spaceId, reason)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
