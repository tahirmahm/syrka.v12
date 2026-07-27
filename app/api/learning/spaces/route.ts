import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'

export async function POST(req: NextRequest) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const { actor } = guard

  const body = await req.json().catch(() => ({}))
  const { title, curriculumId, documentVersionId } = body as { title?: string; curriculumId?: string; documentVersionId?: string }
  if (!title || !curriculumId || !documentVersionId) {
    return NextResponse.json({ ok: false, message: 'title, curriculumId, and documentVersionId are required.' }, { status: 400 })
  }
  const version = await inMemoryLearningIngestionRepository.getDocumentVersion(actor.institutionId, documentVersionId)
  if (!version) {
    return NextResponse.json({ ok: false, message: 'documentVersionId does not reference a known document version.' }, { status: 404 })
  }
  const space = await inMemoryLearningIngestionRepository.createLearningSpace(actor.institutionId, actor.userId, title, curriculumId, documentVersionId)
  return NextResponse.json({ ok: true, space })
}

export async function GET() {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const spaces = await inMemoryLearningIngestionRepository.listLearningSpaces(guard.actor.institutionId)
  return NextResponse.json({ spaces })
}
