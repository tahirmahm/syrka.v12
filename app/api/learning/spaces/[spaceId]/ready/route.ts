import { NextResponse } from 'next/server'
import { inMemoryLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'
import { guardLearningRequest } from '@/lib/services/learning/route-guard'
import type { ExtractionWarning } from '@/lib/campus-types'

/** Marks a Learning Space ready for approval — refused while any high-severity extraction warning on its source remains unresolved. */
export async function POST(_req: Request, { params }: { params: { spaceId: string } }) {
  const guard = await guardLearningRequest()
  if (!guard.ok) return guard.response
  const { institutionId } = guard.actor

  const space = await inMemoryLearningIngestionRepository.getLearningSpace(institutionId, params.spaceId)
  if (!space) return NextResponse.json({ ok: false, message: 'Learning Space not found.' }, { status: 404 })

  const sourceVersionId = space.currentVersionId
  if (sourceVersionId) {
    const warnings = await inMemoryLearningIngestionRepository.listWarningsForVersion(institutionId, sourceVersionId)
    const unresolvedHighSeverity = warnings.filter((w: ExtractionWarning) => w.severity === 'high' && !w.resolved)
    if (unresolvedHighSeverity.length > 0) {
      return NextResponse.json(
        { ok: false, message: `${unresolvedHighSeverity.length} unresolved high-severity extraction warning(s) must be corrected first.` },
        { status: 422 }
      )
    }
  }

  const outcome = await inMemoryLearningIngestionRepository.transitionLearningSpace(institutionId, params.spaceId, 'ready_for_approval')
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
