import { NextResponse } from 'next/server'
import { callLearningDeepSeek, LEARNING_PROVIDER_CONFIG } from '@/lib/services/learning/providers/deepseek-call'

export const dynamic = 'force-dynamic'

/**
 * Preview-only DeepSeek connectivity diagnostic. Never returns the API
 * key, request/response headers, or any prompt content — only whether a
 * key is configured, whether a live call was attempted, whether it
 * authenticated (a completion object was returned at all), the model
 * requested, a coarse result category, and a trace id. 404s outside
 * Preview so this never becomes a production-reachable probe.
 */
export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const requestId = `diag-${crypto.randomUUID()}`
  const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
  const requestedModel = LEARNING_PROVIDER_CONFIG.pro.model

  if (!keyConfigured) {
    return NextResponse.json({
      keyConfigured,
      liveRequestAttempted: false,
      authenticationSucceeded: null,
      requestedModel,
      resultCategory: 'deterministic_not_configured',
      traceId: requestId,
    })
  }

  try {
    await callLearningDeepSeek(
      { ...LEARNING_PROVIDER_CONFIG.pro, maxOutputTokens: 20, timeoutMs: 8000 },
      'Respond only with strict JSON: {"ok": true}.',
      'Diagnostic ping — respond with the exact JSON shape requested.'
    )
    return NextResponse.json({
      keyConfigured,
      liveRequestAttempted: true,
      authenticationSucceeded: true,
      requestedModel,
      resultCategory: 'deepseek_live',
      traceId: requestId,
    })
  } catch {
    return NextResponse.json({
      keyConfigured,
      liveRequestAttempted: true,
      authenticationSucceeded: false,
      requestedModel,
      resultCategory: 'deterministic_unavailable',
      traceId: requestId,
    })
  }
}
