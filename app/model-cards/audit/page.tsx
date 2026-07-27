'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface AuditEntry {
  id: string
  endpoint: string
  model_used: string
  latency_ms: number
  tokens_used: number
  country: string | null
  track: string
  created_at: string
  request_payload: Record<string, unknown>
  response_payload: Record<string, unknown>
}

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEndpoint, setFilterEndpoint] = useState('')

  useEffect(() => {
    loadAudit()
  }, [filterEndpoint])

  async function loadAudit() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('ai_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filterEndpoint) {
      query = query.eq('endpoint', filterEndpoint)
    }

    const { data } = await query
    setEntries((data as AuditEntry[]) || [])
    setLoading(false)
  }

  const endpoints = Array.from(new Set(entries.map((e) => e.endpoint))).sort()
  const avgLatency = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + (e.latency_ms || 0), 0) / entries.length)
    : 0
  const totalTokens = entries.reduce((s, e) => s + (e.tokens_used || 0), 0)

  return (
    <div className="min-h-screen bg-background text-on-background">
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-5 ghost-border">
        <a href="/" className="text-xl font-headline font-bold text-primary" style={{ letterSpacing: '0.35em', textDecoration: 'none' }}>SYRKA</a>
        <div className="flex gap-6 items-center">
          <a href="/model-cards" className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary" style={{ textDecoration: 'none' }}>Model Cards</a>
          <span className="font-label text-[11px] uppercase tracking-widest text-primary">Audit Trail</span>
        </div>
      </nav>

      <main className="pt-32 px-8 md:px-16 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-8 h-px bg-primary block" />
          <span className="font-label text-[10px] tracking-ultra uppercase text-on-surface-variant">
            Governance
          </span>
        </div>
        <h1 className="text-display-sm font-headline font-bold mb-4">AI Audit Trail</h1>
        <p className="font-body text-on-surface-variant text-lg mb-8 max-w-2xl">
          Every AI decision Syrka makes is logged here with latency, token usage, and payload metadata.
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-low ghost-border p-4">
            <div className="font-headline text-2xl font-bold text-primary">{entries.length}</div>
            <div className="font-label text-[9px] uppercase tracking-widest text-outline">Entries Loaded</div>
          </div>
          <div className="bg-surface-container-low ghost-border p-4">
            <div className="font-headline text-2xl font-bold text-primary">{avgLatency}ms</div>
            <div className="font-label text-[9px] uppercase tracking-widest text-outline">Avg Latency</div>
          </div>
          <div className="bg-surface-container-low ghost-border p-4">
            <div className="font-headline text-2xl font-bold text-primary">{totalTokens.toLocaleString()}</div>
            <div className="font-label text-[9px] uppercase tracking-widest text-outline">Total Tokens</div>
          </div>
          <div className="bg-surface-container-low ghost-border p-4">
            <div className="font-headline text-2xl font-bold text-primary">{endpoints.length}</div>
            <div className="font-label text-[9px] uppercase tracking-widest text-outline">Endpoints</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterEndpoint}
            onChange={(e) => setFilterEndpoint(e.target.value)}
            className="bg-surface-container ghost-border px-4 py-2 font-body text-sm text-on-surface"
          >
            <option value="">All endpoints</option>
            {endpoints.map((ep) => (
              <option key={ep} value={ep}>{ep}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="skeleton h-64 w-full" />
        ) : entries.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant">No audit entries yet. AI endpoints will log here when called.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Time</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Endpoint</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Model</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Latency</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Tokens</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Track</th>
                  <th className="font-label text-[9px] uppercase tracking-widest text-outline py-3 px-2">Response</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-surface-container hover:bg-surface-container-low transition-colors">
                    <td className="font-body text-[11px] text-on-surface-variant py-2 px-2 tabular-nums">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="font-mono text-[11px] text-primary py-2 px-2">{entry.endpoint}</td>
                    <td className="font-body text-[11px] text-on-surface-variant py-2 px-2">{entry.model_used}</td>
                    <td className="font-body text-[11px] text-on-surface-variant py-2 px-2 tabular-nums">{entry.latency_ms}ms</td>
                    <td className="font-body text-[11px] text-on-surface-variant py-2 px-2 tabular-nums">{entry.tokens_used || '—'}</td>
                    <td className="py-2 px-2">
                      <span className="font-label text-[9px] uppercase tracking-widest px-1.5 py-0.5"
                        style={{
                          background: entry.track === 'student' ? 'rgba(33,150,243,0.15)' : 'rgba(156,39,176,0.15)',
                          color: entry.track === 'student' ? '#2196F3' : '#9C27B0',
                        }}>
                        {entry.track}
                      </span>
                    </td>
                    <td className="font-mono text-[10px] text-outline py-2 px-2 max-w-xs truncate">
                      {JSON.stringify(entry.response_payload)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
