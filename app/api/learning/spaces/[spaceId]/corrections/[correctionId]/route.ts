import { NextRequest, NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function PATCH(req: NextRequest, { params }: { params: { correctionId: string } }) {
  const body = (await req.json().catch(() => ({}))) as { action?: 'accept' | 'revert' }
  if (body.action !== 'accept' && body.action !== 'revert') {
    return NextResponse.json({ ok: false, message: 'action must be "accept" or "revert".' }, { status: 400 })
  }
  const correction =
    body.action === 'accept'
      ? await mockLearningIngestionRepository.acceptCorrection(facultyUser.id, params.correctionId)
      : await mockLearningIngestionRepository.revertCorrection(facultyUser.id, params.correctionId)

  if (!correction) return NextResponse.json({ ok: false, message: 'Correction not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, correction })
}
