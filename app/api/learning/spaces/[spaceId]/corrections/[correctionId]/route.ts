import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function PATCH(req: NextRequest, { params }: { params: { correctionId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => ({}))) as { action?: 'accept' | 'revert' }
  if (body.action !== 'accept' && body.action !== 'revert') {
    return NextResponse.json({ ok: false, message: 'action must be "accept" or "revert".' }, { status: 400 })
  }
  const correction =
    body.action === 'accept'
      ? await inMemoryLearningIngestionRepository.acceptCorrection(guard.actor.institutionId, params.correctionId)
      : await inMemoryLearningIngestionRepository.revertCorrection(guard.actor.institutionId, params.correctionId)

  if (!correction) return NextResponse.json({ ok: false, message: 'Correction not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, correction })
}
