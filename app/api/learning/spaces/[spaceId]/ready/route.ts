import { NextResponse } from 'next/server'
import { facultyUser } from '@/lib/mock-data/seed'
import { mockLearningIngestionRepository } from '@/lib/repositories/learning-ingestion-repository'

/** Marks a Learning Space ready for approval — refused while any high-severity extraction warning on its source remains unresolved. */
export async function POST(_req: Request, { params }: { params: { spaceId: string } }) {
  const space = await mockLearningIngestionRepository.getLearningSpace(facultyUser.id, params.spaceId)
  if (!space) return NextResponse.json({ ok: false, message: 'Learning Space not found.' }, { status: 404 })

  const sourceVersionId = space.currentVersionId
  if (sourceVersionId) {
    const warnings = await mockLearningIngestionRepository.listWarningsForVersion(facultyUser.id, sourceVersionId)
    const unresolvedHighSeverity = warnings.filter((w) => w.severity === 'high' && !w.resolved)
    if (unresolvedHighSeverity.length > 0) {
      return NextResponse.json(
        { ok: false, message: `${unresolvedHighSeverity.length} unresolved high-severity extraction warning(s) must be corrected first.` },
        { status: 422 }
      )
    }
  }

  const outcome = await mockLearningIngestionRepository.transitionLearningSpace(facultyUser.id, params.spaceId, 'ready_for_approval')
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 })
}
