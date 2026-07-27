import { NextRequest, NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'
import { INTAKE_LIMITS } from '@/lib/services/learning/document-intake'
import { uploadThrottlePerActor, uploadThrottlePerInstitution } from '@/lib/services/learning/rate-limiter'
import type { DocumentSourceType, SourceRightsDeclaration } from '@/lib/campus-types'

const VALID_SOURCE_TYPES: DocumentSourceType[] = ['textbook', 'reading_pack', 'manual', 'training_document', 'other']
const VALID_RIGHTS: SourceRightsDeclaration[] = [
  'institution_owned',
  'institution_licensed',
  'teacher_authored',
  'public_domain',
  'student_owned',
  'permission_confirmed',
  'development_demonstration_only',
]

/** Server-only document intake — no client component may import PDF-parsing code directly; this route is the only entry point. */
export async function POST(req: NextRequest) {
  // Feature gate + authentication resolve before the body is ever read.
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const { actor } = guard

  // Reject an oversized request before reading the full body where the runtime tells us up front.
  const contentLength = req.headers.get('content-length')
  if (contentLength && Number(contentLength) > INTAKE_LIMITS.maxFileSizeBytes) {
    return NextResponse.json({ ok: false, message: 'Request exceeds the maximum upload size.', reason: 'file_exceeds_limit' }, { status: 413 })
  }

  const actorThrottle = uploadThrottlePerActor.consume(actor.userId)
  if (!actorThrottle.allowed) {
    return NextResponse.json({ ok: false, message: 'Too many uploads. Please slow down and try again shortly.' }, { status: 429 })
  }
  const institutionThrottle = uploadThrottlePerInstitution.consume(actor.institutionId)
  if (!institutionThrottle.allowed) {
    return NextResponse.json({ ok: false, message: 'Your institution has reached its upload rate limit. Please try again shortly.' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const sourceLabel = (formData.get('sourceLabel') as string) || ''
  const sourceType = (formData.get('sourceType') as string) || ''
  const sourceRightsDeclaration = (formData.get('sourceRightsDeclaration') as string) || ''

  if (!file) {
    return NextResponse.json({ ok: false, message: 'No file provided.' }, { status: 400 })
  }
  if (!VALID_SOURCE_TYPES.includes(sourceType as DocumentSourceType)) {
    return NextResponse.json({ ok: false, message: `Invalid sourceType "${sourceType}".` }, { status: 400 })
  }
  if (!VALID_RIGHTS.includes(sourceRightsDeclaration as SourceRightsDeclaration)) {
    return NextResponse.json({ ok: false, message: `Invalid sourceRightsDeclaration "${sourceRightsDeclaration}".` }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())

  const outcome = await inMemoryLearningIngestionRepository.intakeDocument({
    institutionId: actor.institutionId,
    actorId: actor.userId,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    sourceLabel: sourceLabel || file.name,
    sourceType: sourceType as DocumentSourceType,
    sourceRightsDeclaration: sourceRightsDeclaration as SourceRightsDeclaration,
    buffer,
  })

  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}

export async function GET() {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response

  const documents = await inMemoryLearningIngestionRepository.listDocuments(guard.actor.institutionId)
  return NextResponse.json({ documents })
}
