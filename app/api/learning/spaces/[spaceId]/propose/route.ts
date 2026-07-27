import { NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function POST(_req: Request, { params }: { params: { spaceId: string } }) {
  const outcome = await mockLearningIngestionRepository.generateStructureProposal(facultyUser.id, params.spaceId)
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
