import { NextRequest, NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const body = await req.json().catch(() => ({}))
  const note = (body as { note?: string }).note ?? ''
  const outcome = await mockLearningIngestionRepository.approveLearningSpace(facultyUser.id, params.spaceId, facultyUser.id, note)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
