'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface AuditEntry {
  id: string
  endpoint: string
  model_used: string
  latency_ms: number
  tokens_used: number
  track: string
  created_at: string
  response_payload: Record<string, unknown>
}

interface Experiment {
  id: string
  name: string
  hypothesis: string
  metric: string
  status: string
  current_value: number
  target_value: number
  promote_threshold: number
  rollback_threshold: number
  created_at: string
}

interface EvolutionEntry {
  id: string
  course_id: string
  freshness_score: number | null
  faculty_approved: boolean | null
  generated_at: string
  courses: { name: string } | null
}

interface FairnessReport {
  fairness_score: number
  fairness_alerts: string[]
  total_requests: number
  country_breakdown: { country: string; requests: number; avgLatency: number }[]
}

export default function IntelligenceFeedPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [evolutions, setEvolutions] = useState<EvolutionEntry[]>([])
  const [fairness, setFairness] = useState<FairnessReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()

    const [auditRes, expRes, evoRes, fairRes] = await Promise.all([
      supabase.from('ai_audit_log').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('experiments').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('curriculum_evolution_log').select('id, course_id, freshness_score, faculty_approved, generated_at, courses(name)').order('generated_at', { ascending: false }).limit(10),
      fetch('/api/admin/fairness-check').then((r) => r.json()).catch(() => null),
    ])

    setAuditEntries((auditRes.data as AuditEntry[]) || [])
    setExperiments((expRes.data as Experiment[]) || [])
    setEvolutions(((evoRes.data || []) as unknown as EvolutionEntry[]))
    setFairness(fairRes)
    setLoading(false)
  }

  const statusColor = (s: string) => {
    if (s === 'promoted') return { bg: 'rgba(76,175,80,0.15)', color: '#4CAF50' }
    if (s === 'rolled_back') return { bg: 'rgba(244,67,54,0.15)', color: '#F44336' }
    if (s === 'active') return { bg: 'rgba(33,150,243,0.15)', color: '#2196F3' }
    return { bg: 'rgba(158,158,158,0.15)', color: '#9E9E9E' }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-5 ghost-border">
        <a href="/" className="text-xl font-headline font-bold text-primary" style={{ letterSpacing: '0.35em', textDecoration: 'none' }}>SYRKA</a>
        <span className="font-label text-[11px] uppercase tracking-widest text-primary">Intelligence Feed</span>
      </nav>

      <main className="pt-32 px-8 md:px-16 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-8 h-px bg-primary block" />
          <span className="font-label text-[10px] tracking-ultra uppercase text-on-surface-variant">
            System Intelligence
          </span>
        </div>
        <h1 className="text-display-sm font-headline font-bold mb-4">Intelligence Feed</h1>
        <p className="font-body text-on-surface-variant text-lg mb-12 max-w-2xl">
          Live view of AI governance, experiments, curriculum provenance, and fairness monitoring.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-64 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

            {/* Column 1: Governance / Audit */}
            <div className="bg-surface-container-low ghost-border p-5">
              <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Governance</div>
              <h2 className="font-headline text-sm font-bold text-primary mb-4">AI Audit Log</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditEntries.length === 0 ? (
                  <p className="font-body text-xs text-on-surface-variant">No audit entries yet.</p>
                ) : auditEntries.map((e) => (
                  <div key={e.id} className="bg-surface-container p-2 ghost-border">
                    <code className="font-mono text-[10px] text-primary block truncate">{e.endpoint}</code>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body text-[9px] text-outline">{e.latency_ms}ms</span>
                      <span className="font-body text-[9px] text-outline">{e.tokens_used || 0} tok</span>
                      <span className="font-label text-[8px] uppercase px-1" style={{ background: 'rgba(33,150,243,0.15)', color: '#2196F3' }}>{e.track}</span>
                    </div>
                    <span className="font-body text-[9px] text-outline">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Experiments */}
            <div className="bg-surface-container-low ghost-border p-5">
              <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Policy Lab</div>
              <h2 className="font-headline text-sm font-bold text-primary mb-4">Experiments</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {experiments.length === 0 ? (
                  <p className="font-body text-xs text-on-surface-variant">No experiments yet.</p>
                ) : experiments.map((exp) => {
                  const sc = statusColor(exp.status)
                  return (
                    <div key={exp.id} className="bg-surface-container p-2 ghost-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-headline text-[11px] font-bold text-on-surface truncate mr-2">{exp.name}</span>
                        <span className="font-label text-[8px] uppercase tracking-widest px-1.5 py-0.5 shrink-0" style={{ background: sc.bg, color: sc.color }}>{exp.status}</span>
                      </div>
                      <p className="font-body text-[10px] text-on-surface-variant mb-1">{exp.hypothesis}</p>
                      <div className="h-1 bg-surface-container-high overflow-hidden mb-1">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, exp.current_value)}%` }} />
                      </div>
                      <div className="flex justify-between">
                        <span className="font-body text-[9px] text-outline">{exp.current_value}%</span>
                        <span className="font-body text-[9px] text-outline">target: {exp.target_value}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Column 3: Curriculum Provenance */}
            <div className="bg-surface-container-low ghost-border p-5">
              <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Provenance</div>
              <h2 className="font-headline text-sm font-bold text-primary mb-4">Curriculum Evidence</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {evolutions.length === 0 ? (
                  <p className="font-body text-xs text-on-surface-variant">No evolution entries yet.</p>
                ) : evolutions.map((evo) => {
                  const c = evo.courses as unknown as { name: string } | null
                  const freshness = evo.freshness_score != null ? Math.round(evo.freshness_score * 100) : null
                  return (
                    <div key={evo.id} className="bg-surface-container p-2 ghost-border">
                      <span className="font-headline text-[11px] font-bold text-on-surface block truncate">{c?.name || `Course ${evo.course_id}`}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {freshness !== null && (
                          <>
                            <div className="flex-1 h-1 bg-surface-container-high overflow-hidden">
                              <div className="h-full" style={{ width: `${freshness}%`, background: freshness >= 70 ? '#4CAF50' : freshness >= 40 ? '#FFC107' : '#F44336' }} />
                            </div>
                            <span className="font-body text-[9px] text-outline">{freshness}%</span>
                          </>
                        )}
                        <span className="font-label text-[8px] uppercase px-1" style={{
                          background: evo.faculty_approved ? 'rgba(76,175,80,0.15)' : 'rgba(255,193,7,0.15)',
                          color: evo.faculty_approved ? '#4CAF50' : '#FFC107',
                        }}>
                          {evo.faculty_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <span className="font-body text-[9px] text-outline">{new Date(evo.generated_at).toLocaleDateString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Column 4: Fairness Monitor */}
            <div className="bg-surface-container-low ghost-border p-5">
              <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Equity</div>
              <h2 className="font-headline text-sm font-bold text-primary mb-4">Fairness Monitor</h2>
              {fairness ? (
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(71,71,71,0.3)" strokeWidth="4" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={fairness.fairness_score >= 75 ? '#4CAF50' : fairness.fairness_score >= 50 ? '#FFC107' : '#F44336'}
                          strokeWidth="4" strokeDasharray={`${fairness.fairness_score * 2.64} 264`} />
                      </svg>
                      <span className="absolute font-headline text-lg font-bold text-primary">{fairness.fairness_score}</span>
                    </div>
                  </div>
                  <p className="font-body text-[10px] text-outline text-center mb-3">{fairness.total_requests} requests (7d)</p>
                  {fairness.country_breakdown?.map((cb) => (
                    <div key={cb.country} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(71,71,71,0.1)' }}>
                      <span className="font-body text-[11px] text-on-surface-variant">{cb.country}</span>
                      <div className="flex gap-2">
                        <span className="font-body text-[9px] text-outline">{cb.requests} req</span>
                        <span className="font-body text-[9px] text-outline">{cb.avgLatency}ms</span>
                      </div>
                    </div>
                  ))}
                  {fairness.fairness_alerts?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {fairness.fairness_alerts.map((alert, i) => (
                        <p key={i} className="font-body text-[10px] px-2 py-1" style={{ background: 'rgba(244,67,54,0.1)', color: '#F44336' }}>{alert}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-body text-xs text-on-surface-variant">Fairness data unavailable.</p>
              )}
            </div>

            {/* Column 5: Quick Links */}
            <div className="bg-surface-container-low ghost-border p-5">
              <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Navigation</div>
              <h2 className="font-headline text-sm font-bold text-primary mb-4">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { href: '/model-cards', label: 'Model Cards', desc: 'AI transparency documentation' },
                  { href: '/model-cards/audit', label: 'Audit Trail', desc: 'Full AI decision log' },
                  { href: '/saudi/faculty', label: 'Faculty Dashboard', desc: 'Curriculum & experiments' },
                  { href: '/saudi/ministry', label: 'Ministry Portal', desc: 'Vision gap intelligence' },
                  { href: '/saudi/student', label: 'Student Portal', desc: 'Career & skills engine' },
                ].map((link) => (
                  <a key={link.href} href={link.href} className="block bg-surface-container p-3 ghost-border hover:bg-surface-container-high transition-colors" style={{ textDecoration: 'none' }}>
                    <span className="font-headline text-[11px] font-bold text-primary block">{link.label}</span>
                    <span className="font-body text-[10px] text-on-surface-variant">{link.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
