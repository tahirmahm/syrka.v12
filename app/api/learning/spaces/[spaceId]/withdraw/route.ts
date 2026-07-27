import { NextRequest, NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const body = await req.json().catch(() => ({}))
  const reason = (body as { reason?: string }).reason ?? ''
  const outcome = await mockLearningIngestionRepository.withdrawLearningSpace(facultyUser.id, params.spaceId, reason)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
