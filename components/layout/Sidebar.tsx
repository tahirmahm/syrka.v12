'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import SyrkaWordmark from '@/components/SyrkaWordmark'
import DocumentUpload from '@/components/ministry/DocumentUpload'
import AddCountryModal from './AddCountryModal'

const ACCENTS: Record<string, string> = {
  saudi: '#C9A84C',
  malta: '#1D9E75',
  uk:    '#3B8BD4',
}

const COUNTRY_NAMES: Record<string, string> = {
  saudi: 'Kingdom of Saudi Arabia',
  malta: 'Republic of Malta',
  uk:    'United Kingdom',
}

const VISION_NAMES: Record<string, string> = {
  saudi: 'Saudi Vision 2030',
  malta: 'Malta Vision 2050',
  uk:    'AI Opportunities Action Plan',
}

interface SidebarProps {
  country: string
  activeTrack?: string
  onClose?: () => void
}

const countries = [
  { slug: 'saudi', name: 'Saudi Arabia', color: '#C9A84C' },
  { slug: 'malta', name: 'Malta',        color: '#1D9E75' },
  { slug: 'uk',    name: 'United Kingdom', color: '#3B8BD4' },
]

export default function Sidebar({ country, activeTrack, onClose }: SidebarProps) {
  const pathname = usePathname()
  const accent = ACCENTS[country] || '#C9A84C'
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddCountry, setShowAddCountry] = useState(false)

  const resolvedTrack = activeTrack || (() => {
    if (pathname?.includes('/university')) return 'university'
    if (pathname?.includes('/employer'))   return 'employer'
    if (pathname?.includes('/student'))    return 'student'
    return 'ministry'
  })()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsAdmin(process.env.NODE_ENV === 'development' || params.get('admin') === 'true')
  }, [])

  return (
    <aside style={{
      width: 200,
      minWidth: 200,
      height: '100%',
      background: 'var(--bg-surface)',
      borderRight: '0.5px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '0.5px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <SyrkaWordmark country={country} size="md" />
        {onClose && (
          <button onClick={onClose} style={{ color: 'var(--text-faint)', padding: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        )}
      </div>

      {/* Active country card */}
      <div style={{
        margin: '12px 8px',
        background: 'var(--bg-elevated)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
        padding: '10px 12px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
          {COUNTRY_NAMES[country] || country}
        </div>
        <div className="label-caps" style={{ marginTop: 2 }}>
          {VISION_NAMES[country] || ''}
        </div>
      </div>

      {/* Track nav */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        <div className="label-caps" style={{ padding: '6px 16px 4px' }}>Dashboards</div>
        {[
          { id: 'ministry',   label: 'Ministry' },
          { id: 'university', label: 'University' },
          { id: 'employer',   label: 'Employer' },
          { id: 'student',    label: 'Student' },
        ].map(({ id, label }) => (
          <a key={id} href={`/${country}/${id}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: resolvedTrack === id ? '9px 14px' : '9px 16px',
            fontSize: 12,
            color: resolvedTrack === id ? accent : 'var(--text-muted)',
            background: resolvedTrack === id ? 'var(--bg-elevated)' : 'transparent',
            borderLeft: `2px solid ${resolvedTrack === id ? accent : 'transparent'}`,
            textDecoration: 'none',
            transition: 'all var(--t-fast)',
            letterSpacing: '0.2px',
            minHeight: 44,
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: resolvedTrack === id ? accent : 'var(--border-subtle)',
              flexShrink: 0,
            }} />
            {label}
          </a>
        ))}
      </nav>

      {/* Upload */}
      <div style={{ padding: '0 8px 12px' }}>
        <DocumentUpload country={country} accentColor={accent} />
      </div>

      {/* Country switcher */}
      <div style={{
        padding: '12px 16px',
        borderTop: '0.5px solid var(--border-subtle)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <div className="label-caps" style={{ marginBottom: 8 }}>Countries</div>
        {countries.map(c => (
          <a key={c.slug} href={`/${c.slug}/ministry`} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0', fontSize: 11,
            color: country === c.slug ? 'var(--text-primary)' : 'var(--text-muted)',
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: country === c.slug ? c.color : 'var(--border-default)',
              flexShrink: 0,
            }} />
            {c.name}
          </a>
        ))}
        {isAdmin && (
          <button
            onClick={() => setShowAddCountry(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 0', fontSize: 10,
              color: 'var(--border-default)', background: 'none',
              border: 'none', cursor: 'pointer', marginTop: 4,
            }}
          >
            + Add country
          </button>
        )}
      </div>

      {showAddCountry && <AddCountryModal onClose={() => setShowAddCountry(false)} />}
    </aside>
  )
}
