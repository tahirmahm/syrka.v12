'use client'

import { useEffect, useState } from 'react'

interface DigestData {
  week_id: string
  content: string
  paper_count: number
  top_velocity_module: string | null
}

export default function WeeklyDigest() {
  const [digest, setDigest] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/research/digest')
      .then(r => r.json())
      .then(data => setDigest(data.digest ?? null))
      .catch(() => setDigest(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#121316', borderLeft: '3px solid #679cff', padding: '16px 24px' }}>
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#679cff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          This Week in AI
        </span>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#679cff', width: '30%', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    )
  }

  if (!digest) {
    return (
      <div style={{ background: '#121316', borderLeft: '3px solid #45484e', padding: '16px 24px' }}>
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#45484e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          This Week in AI
        </span>
        <p style={{ fontSize: 12, color: '#45484e', marginTop: 8 }}>
          No digest available yet. Generated weekly on Mondays.
        </p>
      </div>
    )
  }

  const paragraphs = digest.content.split('\n').filter(l => l.trim())

  return (
    <div style={{ background: '#121316', borderLeft: '3px solid #679cff', padding: '20px 24px' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#679cff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          This Week in AI
        </span>
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#45484e' }}>
          {digest.week_id} · {digest.paper_count} papers analysed
        </span>
      </div>
      <div className="space-y-2">
        {paragraphs.map((p, i) => {
          const isHeading = p.startsWith('#') || p.startsWith('**')
          const text = p.replace(/^#+\s*/, '').replace(/\*\*/g, '')
          return isHeading ? (
            <div key={i} style={{ fontSize: 12, fontWeight: 700, color: '#e3e5ed', marginTop: i > 0 ? 8 : 0 }}>
              {text}
            </div>
          ) : (
            <p key={i} style={{ fontSize: 12, color: '#939eb4', lineHeight: 1.6, margin: 0 }}>
              {text}
            </p>
          )
        })}
      </div>
      {digest.top_velocity_module && (
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>
            HOTTEST FIELD:
          </span>
          <span style={{ fontSize: 11, color: '#679cff', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
            {digest.top_velocity_module}
          </span>
        </div>
      )}
    </div>
  )
}
