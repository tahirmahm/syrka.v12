import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'
import type { LearningActor } from '@/lib/services/learning/actor'
import type { TeacherCorrection } from '@/lib/campus-types'

async function resolveSourceVersionId(institutionId: string, spaceId: string): Promise<string | undefined> {
  const space = await inMemoryLearningIngestionRepository.getLearningSpace(institutionId, spaceId)
  if (!space?.currentVersionId) return undefined
  const version = await inMemoryLearningIngestionRepository.getLearningSpaceVersion(institutionId, space.currentVersionId)
  return version?.sourceDocumentVersionId
}

export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const sourceVersionId = await resolveSourceVersionId(guard.actor.institutionId, params.spaceId)
  if (!sourceVersionId) return NextResponse.json({ corrections: [] })
  const corrections = await inMemoryLearningIngestionRepository.listCorrectionsForVersion(guard.actor.institutionId, sourceVersionId)
  return NextResponse.json({ corrections })
}

export async function POST(req: NextRequest, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const actor: LearningActor = guard.actor

  const sourceVersionId = await resolveSourceVersionId(actor.institutionId, params.spaceId)
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

  const correction = await inMemoryLearningIngestionRepository.addCorrection(actor.institutionId, {
    id: `corr-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6)}`,
    targetType: body.targetType,
    targetId: body.targetId,
    documentVersionId: sourceVersionId,
    pageId: body.pageId,
    sourceRegionId: body.sourceRegionId,
    teacherId: actor.userId,
    originalValue: body.originalValue,
    correctedValue: body.correctedValue,
    reason: body.reason,
    changeSummary: body.changeSummary,
    note: body.note,
  })

  return NextResponse.json({ ok: true, correction })
}
