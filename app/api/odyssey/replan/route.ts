import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/mock-data/seed'
import { replanOdyssey } from '@/lib/services/odyssey/generation-service'

export const dynamic = 'force-dynamic'

/**
 * Server-only Odyssey replanning route. Accepts a plain-language adjustment
 * instruction; never accepts or returns raw provider prompts/output.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'provider_error', validation: { valid: false, issues: [] }, message: 'Request body was not valid JSON.' }, { status: 400 })
  }

  const adjustmentInstruction = typeof body.adjustmentInstruction === 'string' ? body.adjustmentInstruction.trim() : ''
  if (!adjustmentInstruction) {
    return NextResponse.json({ status: 'provider_error', validation: { valid: false, issues: [] }, message: 'An adjustment instruction is required to replan.' }, { status: 400 })
  }

  try {
    const { result, source, requestDurationMs, fallbackReasonCategory } = await replanOdyssey(currentUser, adjustmentInstruction, body.simulate)
    return NextResponse.json({ ...result, meta: { generationSource: source, requestDurationMs, fallbackReasonCategory } })
  } catch {
    return NextResponse.json(
      { status: 'provider_error', validation: { valid: false, issues: [] }, message: 'Odyssey replanning failed unexpectedly.' },
      { status: 500 }
    )
  }
}
