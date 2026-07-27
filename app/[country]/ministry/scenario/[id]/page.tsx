'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import type { Scenario } from '@/lib/types'

const ACCENTS: Record<string, string> = {
  malta: '#1D9E75',
  saudi: '#C9A84C',
  uk: '#3B8BD4',
}

export default function ScenarioDetailPage() {
  const params = useParams()
  const country = params.country as string
  const scenarioId = params.id as string
  const accentColor = ACCENTS[country] || '#C9A84C'

  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadScenario() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from('scenarios')
        .select('*, sectors(name)')
        .eq('id', scenarioId)
        .single()

      if (data) setScenario(data)
      setLoading(false)
    }
    loadScenario()
  }, [scenarioId])

  return (
    <Shell country={country} activeTrack="ministry">
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-subtle)',
        padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px)',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Scenario Detail
        </h1>
        <p className="label-caps" style={{ marginTop: 3 }}>Ministry Track</p>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
        WebkitOverflowScrolling: 'touch',
      }}>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 200 }} />
          </div>
        ) : !scenario ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 'var(--r-lg)',
            padding: 32,
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)' }}>Scenario not found</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {scenario.name}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Saved scenario analysis — {new Date(scenario.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}>
              {[
                { label: 'INTERVENTION TYPE', value: scenario.intervention_type?.replace(/_/g, ' ') || '—' },
                { label: 'GAP CLOSURE', value: `${scenario.gap_closure_percentage}%` },
                { label: 'ESTIMATED COST', value: `$${scenario.cost_estimate_usd?.toLocaleString()}` },
                { label: '5-YEAR ROI', value: `${scenario.roi_5year}x` },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-surface)',
                  border: '0.5px solid var(--border-subtle)',
                  borderRadius: 'var(--r-md)',
                  padding: 'clamp(12px, 2vw, 16px)',
                }}>
                  <div className="label-caps" style={{ marginBottom: 6 }}>{stat.label}</div>
                  <div className="num" style={{
                    fontSize: 'clamp(18px, 4vw, 22px)',
                    color: accentColor,
                    textTransform: 'capitalize',
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {scenario.ai_analysis && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                padding: 'clamp(16px, 3vw, 20px)',
                marginBottom: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  AI Analysis
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {scenario.ai_analysis}
                </p>
              </div>
            )}

            {scenario.projected_outcomes && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                padding: 'clamp(16px, 3vw, 20px)',
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Projected Outcomes
                </h3>
                <pre style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-elevated)',
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  overflow: 'auto',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {JSON.stringify(scenario.projected_outcomes, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
