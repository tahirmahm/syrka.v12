import { NextResponse } from 'next/server'
import { getNcertConceptView } from '@/lib/utilities/ncert-curriculum-projection'
import { learningProviders } from '@/lib/services/learning/providers'
import type { ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'

export const dynamic = 'force-dynamic'

/**
 * LEARN-002 completion — the one Tutor action ("Diagnose my response")
 * given a real DeepSeek-backed path. Every other Tutor action stays the
 * deterministic hint ladder in concept-tutor-engine.ts by design (its own
 * docblock: consistent hint progression and Evidence-integrity guarantees
 * that a live model must not vary run to run). This action is advisory —
 * it never counts toward hint usage or Evidence eligibility — so it can
 * safely carry a live, honestly-labelled DeepSeek result with a
 * deterministic fallback on any provider failure.
 */
export async function POST(request: Request) {
  let body: { spaceId?: string; chapterId?: string; conceptId?: string; responseText?: string; sessionState?: ConceptTutorSessionState }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { spaceId, chapterId, conceptId, responseText, sessionState } = body
  if (!spaceId || !chapterId || !conceptId || !responseText || !sessionState) {
    return NextResponse.json({ error: 'spaceId, chapterId, conceptId, responseText, and sessionState are required.' }, { status: 400 })
  }

  const view = getNcertConceptView(spaceId, chapterId, conceptId)
  if (!view) {
    return NextResponse.json({ error: 'Concept not found.' }, { status: 404 })
  }

  const result = await learningProviders.tutorReasoning.diagnoseResponse({ view, sessionState, responseText })
  return NextResponse.json(result)
}
