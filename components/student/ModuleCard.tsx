'use client'

import Link from 'next/link'
import type { Module } from '@/lib/degree-config'

const STATUS_COLORS: Record<string, { accent: string; label: string; tagBg: string; tagBorder: string }> = {
  completed: { accent: '#45484e', label: '#a9abb2', tagBg: 'rgba(169,171,178,0.1)', tagBorder: 'rgba(169,171,178,0.2)' },
  ready: { accent: 'rgba(103,156,255,0.6)', label: '#679cff', tagBg: 'rgba(103,156,255,0.08)', tagBorder: 'rgba(103,156,255,0.15)' },
  active: { accent: '#679cff', label: '#679cff', tagBg: 'rgba(103,156,255,0.1)', tagBorder: 'rgba(103,156,255,0.2)' },
  blocked: { accent: '#ee7d77', label: '#ee7d77', tagBg: 'rgba(238,125,119,0.1)', tagBorder: 'rgba(238,125,119,0.2)' },
  locked: { accent: '#45484e', label: '#45484e', tagBg: 'rgba(69,72,78,0.3)', tagBorder: 'rgba(69,72,78,0.4)' },
  skipped: { accent: 'transparent', label: '#45484e', tagBg: 'rgba(69,72,78,0.2)', tagBorder: 'rgba(69,72,78,0.3)' },
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#a9abb2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color }}>
        {value}
      </div>
    </div>
  )
}

interface ModuleCardProps {
  module: Module
  country: string
  index: number
  isSelected?: boolean
}

export default function ModuleCard({ module, country, index, isSelected }: ModuleCardProps) {
  const colors = STATUS_COLORS[module.status] ?? STATUS_COLORS.locked
  const opacity = module.status === 'completed' ? 0.55 : module.status === 'locked' ? 0.4 : module.status === 'skipped' ? 0.3 : 1
  const cardBg = module.status === 'blocked' ? '#0a0807' : isSelected ? 'rgba(103,156,255,0.04)' : '#0d0e10'

  return (
    <Link
      href={`/${country}/student?tab=intelligence&module=${module.code}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="relative"
        style={{
          opacity,
          background: cardBg,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: colors.accent }}
        />

        {/* Blocked prerequisite notice */}
        {module.status === 'blocked' && module.blocker && (
          <div
            className="flex items-center gap-2"
            style={{
              padding: '5px 20px 5px 20px',
              marginLeft: 3,
              background: 'rgba(238,125,119,0.04)',
              borderBottom: '1px solid rgba(238,125,119,0.08)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#ee7d77' }}>block</span>
            <span style={{ fontSize: 10, color: '#ee7d77', letterSpacing: '0.06em', fontFamily: 'ui-monospace, monospace' }}>
              Prerequisite: {module.blocker} Required
            </span>
          </div>
        )}

        {/* Skipped notice */}
        {module.status === 'skipped' && (
          <div
            className="flex items-center gap-2"
            style={{
              padding: '5px 20px 5px 20px',
              marginLeft: 3,
              background: 'rgba(69,72,78,0.06)',
              borderBottom: '1px solid rgba(69,72,78,0.15)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#45484e' }}>do_not_disturb_on</span>
            <span style={{ fontSize: 10, color: '#45484e', letterSpacing: '0.06em', fontFamily: 'ui-monospace, monospace' }}>
              Student elected MST124 — this module not required
            </span>
          </div>
        )}

        {/* Main card content */}
        <div className="flex" style={{ marginLeft: 3 }}>
          {/* Left — module info */}
          <div className="flex-1" style={{ padding: '12px 16px 12px 20px' }}>
            {/* Module number + status badge */}
            <div className="flex items-center gap-3 mb-1">
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: '#73757c',
                textTransform: 'uppercase',
              }}>
                MODULE {String(index + 1).padStart(2, '0')}
              </span>
              <span style={{
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
                background: colors.tagBg,
                color: colors.label,
                border: `1px solid ${colors.tagBorder}`,
              }}>
                {module.status}
              </span>
            </div>

            {/* Module name */}
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: '#e3e5ed',
              margin: '4px 0',
            }}>
              {module.code} - {module.name}
            </h3>

            {/* Description line */}
            <p style={{
              fontSize: 12,
              color: '#73757c',
              margin: '2px 0 0',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {module.description}
            </p>

            {/* Stats row — Priority / Risk / ROI / MIT */}
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              {module.priority != null && (
                <Stat label="Priority" value={`0${module.priority}`} color="#e3e5ed" />
              )}
              {module.risk && (
                <Stat label="Risk" value={module.risk.toUpperCase()} color={module.risk === 'high' ? '#ee7d77' : '#a9abb2'} />
              )}
              {module.roi && (
                <Stat label="ROI" value={module.roi.toUpperCase()} color="#679cff" />
              )}
              {module.mit && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#a9abb2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    MIT
                  </div>
                  <a
                    href={module.mit.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: '#679cff', textDecoration: 'none' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {module.mit.number}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right — career contribution panel */}
          <div
            className="shrink-0 flex flex-col items-center justify-center"
            style={{
              width: 120,
              background: '#121316',
              borderLeft: '1px solid rgba(255,255,255,0.04)',
              padding: '12px 10px',
            }}
          >
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#679cff',
              letterSpacing: '-0.02em',
            }}>
              +{module.career_contribution}%
            </span>
            <span style={{ fontSize: 9, color: '#73757c', textAlign: 'center', marginTop: 2, lineHeight: 1.2 }}>
              toward ML Engineer
            </span>
            {module.mit && (
              <span style={{ fontSize: 9, color: '#45484e', textAlign: 'center', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
                {module.mit.number}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
