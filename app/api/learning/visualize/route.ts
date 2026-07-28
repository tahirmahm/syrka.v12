import { NextResponse } from 'next/server'
import { getNcertConceptView } from '@/lib/utilities/ncert-curriculum-projection'
import { learningProviders } from '@/lib/services/learning/providers'
import { buildMermaidFlowchartDefinition } from '@/lib/services/learning/mermaid-definition-builder'
import { getGeographyTerrainResourceSpec } from '@/lib/services/learning/geography-terrain-3d-config'
import { buildVisualNarrative } from '@/lib/services/learning/semantic-model-builder'
import type { LearningVisualIntent } from '@/lib/campus-types/learning-visual-spec'
import type { ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'

export const dynamic = 'force-dynamic'

const TENANT_ID = 'tenant-syrka-demo'
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
 * string), asks the representation router which renderer fits, and for
 * "mermaid" also proposes + validates a LearningVisualSpec before
 * returning it — an invalid spec never reaches the client.
 */
export async function POST(request: Request) {
  let body: { spaceId?: string; chapterId?: string; conceptId?: string; intent?: LearningVisualIntent; device?: 'desktop' | 'mobile' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { spaceId, chapterId, conceptId, intent, device } = body
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

  if (representation.decision.renderer === 'syrka_visual') {
    return NextResponse.json({
      renderer: 'syrka_visual',
      decision: representation.decision,
      generationSource: 'deterministic_fallback',
      narrative: buildVisualNarrative(view),
    })
  }

  // Mermaid is retained only as an internal/technical alternative — never reached by the deterministic
  // router as an ordinary Student default (see representation-router.ts), kept for Faculty/debug use.
  const proposal = await learningProviders.visualPlanning.proposeVisualSpec({
    view,
    sessionState: DEFAULT_SESSION_STATE,
    intent: intent ?? 'concept_map',
    tenantId: TENANT_ID,
  })

  const definition = buildMermaidFlowchartDefinition(proposal.spec)

  return NextResponse.json({
    renderer: 'mermaid',
    decision: representation.decision,
    generationSource: proposal.generationSource,
    spec: proposal.spec,
    mermaidDefinition: definition,
    trace: proposal.trace,
  })
}
