import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/mock-data/seed'
import { generateOdysseyPlan } from '@/lib/services/odyssey/generation-service'

export const dynamic = 'force-dynamic'

const WORKLOAD_PREFERENCES = new Set(['light', 'standard', 'intensive'])

/**
 * Server-only Odyssey generation route. The DeepSeek API key never leaves
 * this process — the client only ever sees the validated OdysseyGenerationResult.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'provider_error', validation: { valid: false, issues: [] }, message: 'Request body was not valid JSON.' }, { status: 400 })
  }

  const destinationTitle = typeof body.destinationTitle === 'string' ? body.destinationTitle.trim() : ''
  if (!destinationTitle) {
    return NextResponse.json({ status: 'provider_error', validation: { valid: false, issues: [] }, message: 'A destination is required to generate an Odyssey plan.' }, { status: 400 })
  }

  try {
    const { result, source, requestDurationMs, fallbackReasonCategory } = await generateOdysseyPlan(currentUser, {
      destinationTitle,
      destinationDescription: typeof body.destinationDescription === 'string' ? body.destinationDescription : undefined,
      workloadPreference: typeof body.workloadPreference === 'string' && WORKLOAD_PREFERENCES.has(body.workloadPreference)
        ? (body.workloadPreference as 'light' | 'standard' | 'intensive')
        : undefined,
      timeHorizon: typeof body.timeHorizon === 'string' ? body.timeHorizon : undefined,
      preferredActionTypes: Array.isArray(body.preferredActionTypes)
        ? body.preferredActionTypes.filter((t): t is string => typeof t === 'string')
        : undefined,
      simulate: body.simulate,
    })
    // meta carries only safe, non-sensitive provenance — never a prompt, key, or raw provider payload.
    return NextResponse.json({
      ...result,
      meta: { generationSource: source, requestDurationMs, fallbackReasonCategory },
    })
  } catch {
    // Never surface the underlying error/stack trace to the client.
    return NextResponse.json(
      { status: 'provider_error', validation: { valid: false, issues: [] }, message: 'Odyssey generation failed unexpectedly.' },
      { status: 500 }
    )
  }
}
