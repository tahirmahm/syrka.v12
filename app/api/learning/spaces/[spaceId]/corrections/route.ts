import { NextRequest, NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import type { TeacherCorrection } from '@/lib/campus-types'

async function resolveSourceVersionId(spaceId: string): Promise<string | undefined> {
  const space = await mockLearningIngestionRepository.getLearningSpace(facultyUser.id, spaceId)
  if (!space?.currentVersionId) return undefined
  const version = await mockLearningIngestionRepository.getLearningSpaceVersion(facultyUser.id, space.currentVersionId)
  return version?.sourceDocumentVersionId
}

export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  const sourceVersionId = await resolveSourceVersionId(params.spaceId)
  if (!sourceVersionId) return NextResponse.json({ corrections: [] })
  const corrections = await mockLearningIngestionRepository.listCorrectionsForVersion(facultyUser.id, sourceVersionId)
  return NextResponse.json({ corrections })
}

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const sourceVersionId = await resolveSourceVersionId(params.spaceId)
  if (!sourceVersionId) return NextResponse.json({ ok: false, message: 'Learning Space has no attached source document version.' }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as Partial<{
    targetType: TeacherCorrection['targetType']
    targetId: string
    pageId: string
    sourceRegionId: string
    originalValue: string
    correctedValue: string
    reason: string
    changeSummary: string
    note: string
  }>

  if (!body.targetType || !body.targetId || !body.pageId || body.originalValue === undefined || !body.correctedValue || !body.reason || !body.changeSummary) {
    return NextResponse.json({ ok: false, message: 'targetType, targetId, pageId, originalValue, correctedValue, reason, and changeSummary are required.' }, { status: 400 })
  }

  const correction = await mockLearningIngestionRepository.addCorrection(facultyUser.id, {
    id: `corr-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6)}`,
    targetType: body.targetType,
    targetId: body.targetId,
    documentVersionId: sourceVersionId,
    pageId: body.pageId,
    sourceRegionId: body.sourceRegionId,
    teacherId: facultyUser.id,
    originalValue: body.originalValue,
    correctedValue: body.correctedValue,
    reason: body.reason,
    changeSummary: body.changeSummary,
    note: body.note,
  })

  return NextResponse.json({ ok: true, correction })
}
