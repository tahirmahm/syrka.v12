import { NextResponse } from 'next/server'
import { getNcertConceptView } from '@/lib/utilities/ncert-curriculum-projection'
import { learningProviders } from '@/lib/services/learning/providers'
import { getGeographyTerrainResourceSpec } from '@/lib/services/learning/geography-terrain-3d-config'
import { proposeSemanticVisual } from '@/lib/services/learning/providers/semantic-visual-provider'
import type { ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'

export const dynamic = 'force-dynamic'

const DEFAULT_SESSION_STATE: ConceptTutorSessionState = {
  lastResponseText: '',
  hintsUsedCount: 0,
  attemptsCount: 0,
  transferAttempted: false,
  transferSucceeded: false,
  explainBackGiven: false,
  missingKeyTerms: [],
}

/**
 * LEARN-002 §8 — the "Visualise this" server route. Client components
 * never call a DeepSeek-backed provider directly (see providers/index.ts);
 * this is the one boundary crossing. Looks up the concept from our own
 * curriculum projection (never trusts a client-supplied explanation
 * string), asks the representation router which renderer fits, and
 * returns exactly one of Syrka's real renderer categories — never a
 * Mermaid or generic node-edge graph path, which does not exist in this
 * system (see lib/campus-types/learning-renderer.ts). Any renderer this
 * route does not have a concrete branch for (excalidraw is a recognised
 * but not-yet-integrated category) falls back to syrka_visual, never to
 * a graph.
 */
export async function POST(request: Request) {
  let body: { spaceId?: string; chapterId?: string; conceptId?: string; device?: 'desktop' | 'mobile' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { spaceId, chapterId, conceptId, device } = body
  if (!spaceId || !chapterId || !conceptId) {
    return NextResponse.json({ error: 'spaceId, chapterId, and conceptId are required.' }, { status: 400 })
  }

  const view = getNcertConceptView(spaceId, chapterId, conceptId)
  if (!view) {
    return NextResponse.json({ error: 'Concept not found.' }, { status: 404 })
  }

  const representation = await learningProviders.representationSelection.selectRepresentation({
    view,
    sessionState: DEFAULT_SESSION_STATE,
    device: device ?? 'desktop',
    scaffoldLevel: 'full_support',
  })

  if (representation.decision.renderer === 'desmos') {
    return NextResponse.json({ renderer: 'desmos', decision: representation.decision, generationSource: representation.generationSource })
  }

  if (representation.decision.renderer === 'three_scene') {
    return NextResponse.json({
      renderer: 'three_scene',
      decision: representation.decision,
      generationSource: representation.generationSource,
      threeSpec: getGeographyTerrainResourceSpec(),
    })
  }

  if (representation.decision.renderer === 'custom_interactive') {
    // The client resolves which specific bespoke component to render from
    // conceptId (see BESPOKE_INTERACTIVE_COMPONENT in ConceptWorkbench.tsx).
    return NextResponse.json({ renderer: 'custom_interactive', decision: representation.decision, generationSource: representation.generationSource })
  }

  // syrka_visual, structured_text, excalidraw (not yet integrated), or any
  // unrecognised value all resolve to the real semantic-visual pipeline —
  // never a generic graph.
  const semanticResult = await proposeSemanticVisual(view)
  // Safe operational visibility only — resultCategory/auth-boolean/trace id,
  // never the key, prompt content, or provider response body.
  console.info('[learning:visualize] syrka_visual', JSON.stringify(semanticResult.trace))
  return NextResponse.json({
    renderer: 'syrka_visual',
    decision: representation.decision,
    generationSource: semanticResult.generationSource,
    narrative: semanticResult.narrative,
    semanticTrace: semanticResult.trace,
  })
}
