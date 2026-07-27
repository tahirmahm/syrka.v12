import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface AuditRow {
  endpoint: string
  latency_ms: number
  tokens_used: number
  country: string | null
  track: string
  response_payload: Record<string, unknown>
}

export async function GET() {
  const startTime = Date.now()

  try {
    const supabase = createClient()

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: entries } = await supabase
      .from('ai_audit_log')
      .select('endpoint, latency_ms, tokens_used, country, track, response_payload')
      .gte('created_at', since)

    const rows = (entries as AuditRow[]) || []

    const byCountry: Record<string, { count: number; totalLatency: number; totalTokens: number }> = {}
    const byEndpoint: Record<string, { count: number; totalLatency: number }> = {}

    for (const row of rows) {
      const c = row.country || 'unknown'
      if (!byCountry[c]) byCountry[c] = { count: 0, totalLatency: 0, totalTokens: 0 }
      byCountry[c].count++
      byCountry[c].totalLatency += row.latency_ms || 0
      byCountry[c].totalTokens += row.tokens_used || 0

      const ep = row.endpoint
      if (!byEndpoint[ep]) byEndpoint[ep] = { count: 0, totalLatency: 0 }
      byEndpoint[ep].count++
      byEndpoint[ep].totalLatency += row.latency_ms || 0
    }

    const countryStats = Object.entries(byCountry).map(([country, s]) => ({
      country,
      requests: s.count,
      avgLatency: Math.round(s.totalLatency / s.count),
      totalTokens: s.totalTokens,
    }))

    const endpointStats = Object.entries(byEndpoint).map(([endpoint, s]) => ({
      endpoint,
      requests: s.count,
      avgLatency: Math.round(s.totalLatency / s.count),
    }))

    // Fairness flags
    const alerts: string[] = []
    const avgLatencies = countryStats.map((s) => s.avgLatency)
    if (avgLatencies.length >= 2) {
      const maxLat = Math.max(...avgLatencies)
      const minLat = Math.min(...avgLatencies)
      if (maxLat > minLat * 2) {
        const slow = countryStats.find((s) => s.avgLatency === maxLat)
        const fast = countryStats.find((s) => s.avgLatency === minLat)
        alerts.push(
          `Latency disparity: ${slow?.country} (${maxLat}ms) is ${Math.round(maxLat / minLat)}x slower than ${fast?.country} (${minLat}ms)`
        )
      }
    }

    const requestCounts = countryStats.map((s) => s.requests)
    if (requestCounts.length >= 2) {
      const maxReq = Math.max(...requestCounts)
      const minReq = Math.min(...requestCounts)
      if (maxReq > minReq * 5) {
        alerts.push(
          `Usage disparity: highest-usage country has ${maxReq} requests vs ${minReq} — check if all countries have equal access`
        )
      }
    }

    const report = {
      period: `${since} to now`,
      total_requests: rows.length,
      country_breakdown: countryStats,
      endpoint_breakdown: endpointStats,
      fairness_alerts: alerts,
      fairness_score: alerts.length === 0 ? 100 : Math.max(0, 100 - alerts.length * 25),
      checked_at: new Date().toISOString(),
    }

    logAudit({
      endpoint: '/api/admin/fairness-check',
      request_payload: { period: '7d' },
      response_payload: { fairness_score: report.fairness_score, alerts: alerts.length },
      model_used: 'local-calculation', latency_ms: Date.now() - startTime,
      track: 'admin',
    })

    return NextResponse.json(report)
  } catch (err) {
    console.error('fairness-check error:', err)
    return NextResponse.json({ error: 'Fairness check failed' }, { status: 500 })
  }
}
