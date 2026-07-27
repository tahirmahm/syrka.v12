import { NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  const space = await mockLearningIngestionRepository.getLearningSpace(facultyUser.id, params.spaceId)
  if (!space) return NextResponse.json({ ok: false, message: 'Learning Space not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, space })
}
