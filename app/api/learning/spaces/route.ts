import { NextRequest, NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { title, curriculumId, documentVersionId } = body as { title?: string; curriculumId?: string; documentVersionId?: string }
  if (!title || !curriculumId || !documentVersionId) {
    return NextResponse.json({ ok: false, message: 'title, curriculumId, and documentVersionId are required.' }, { status: 400 })
  }
  const version = await mockLearningIngestionRepository.getDocumentVersion(facultyUser.id, documentVersionId)
  if (!version) {
    return NextResponse.json({ ok: false, message: 'documentVersionId does not reference a known document version.' }, { status: 404 })
  }
  const space = await mockLearningIngestionRepository.createLearningSpace(facultyUser.id, title, curriculumId, documentVersionId)
  return NextResponse.json({ ok: true, space })
}

export async function GET() {
  const spaces = await mockLearningIngestionRepository.listLearningSpaces(facultyUser.id)
  return NextResponse.json({ spaces })
}
