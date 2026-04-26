'use client'

import Link from 'next/link'
import type { Module } from '@/lib/degree-config'

const STATUS_COLORS: Record<string, { accent: string; label: string; tagBg: string; tagBorder: string }> = {
  completed: { accent: '#45484e', label: '#45484e', tagBg: 'rgba(169,171,178,0.1)', tagBorder: 'rgba(169,171,178,0.2)' },
  ready: { accent: '#679cff', label: '#679cff', tagBg: 'rgba(103,156,255,0.1)', tagBorder: 'rgba(103,156,255,0.2)' },
  active: { accent: '#679cff', label: '#679cff', tagBg: 'rgba(103,156,255,0.1)', tagBorder: 'rgba(103,156,255,0.2)' },
  blocked: { accent: '#ee7d77', label: '#ee7d77', tagBg: 'rgba(238,125,119,0.1)', tagBorder: 'rgba(238,125,119,0.2)' },
  locked: { accent: '#45484e', label: '#45484e', tagBg: 'rgba(69,72,78,0.3)', tagBorder: 'rgba(69,72,78,0.4)' },
}

interface ModuleCardProps {
  module: Module
  country: string
  isSelected?: boolean
}

export default function ModuleCard({ module, country, isSelected }: ModuleCardProps) {
  const colors = STATUS_COLORS[module.status]
  const opacity = module.status === 'completed' ? 0.55 : module.status === 'locked' ? 0.45 : 1
  const cardBg = module.status === 'blocked' ? '#0a0807' : undefined

  return (
    <Link
      href={`/${country}/student?tab=intelligence&module=${module.code}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="relative transition-colors"
        style={{
          opacity,
          background: isSelected ? 'rgba(103,156,255,0.06)' : cardBg,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: colors.accent }}
        />

        {/* System directive banner */}
        {module.system_directive && (
          <div
            className="flex items-center gap-2"
            style={{
              background: 'rgba(103,156,255,0.06)',
              borderBottom: '1px solid rgba(103,156,255,0.1)',
              padding: '6px 32px',
            }}
          >
            <div
              className="shrink-0"
              style={{
                width: 6, height: 6, background: '#679cff',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: '0.08em', color: '#679cff' }}
            >
              System Directive: Initialize This Module First
            </span>
          </div>
        )}

        {/* Blocked banner */}
        {module.status === 'blocked' && module.blocker && (
          <div
            className="flex items-center gap-2"
            style={{
              background: 'rgba(238,125,119,0.06)',
              borderBottom: '1px solid rgba(238,125,119,0.1)',
              padding: '6px 32px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ee7d77' }}>block</span>
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: '0.08em', color: '#ee7d77' }}
            >
              Blocked — {module.blocker} prerequisite not satisfied
            </span>
          </div>
        )}

        {/* Main content */}
        <div className="flex">
          {/* Left content */}
          <div className="flex-1 py-3" style={{ paddingLeft: 32, paddingRight: 16 }}>
            {/* Code + status tag row */}
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-label uppercase"
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: colors.label,
                }}
              >
                {module.code}
              </span>
              <span
                className="font-label uppercase inline-flex items-center"
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontFamily: 'ui-monospace, monospace',
                  background: colors.tagBg,
                  color: colors.label,
                  border: `1px solid ${colors.tagBorder}`,
                }}
              >
                {module.status}
              </span>
              {module.system_directive && (
                <span className="font-label" style={{ fontSize: 10, color: '#679cff', letterSpacing: '0.05em' }}>
                  PRIORITY
                </span>
              )}
            </div>

            {/* Module name */}
            <h3
              className="font-headline font-bold"
              style={{ fontSize: 17, letterSpacing: '-0.02em', color: '#e3e5ed' }}
            >
              {module.name}
            </h3>

            {/* Prerequisites + credits */}
            <p className="mt-1" style={{ fontSize: 12, color: '#939eb4' }}>
              {module.credits} credits
              {module.prerequisites.length > 0 && (
                <> · Requires {module.prerequisites.join(', ')}</>
              )}
            </p>

            {/* Failure probability bar */}
            {module.status === 'blocked' && module.failure_probability != null && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#ee7d77', letterSpacing: '0.08em' }} className="uppercase font-label">
                    Failure Probability
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ee7d77', fontFamily: 'ui-monospace, monospace' }}>
                    {module.failure_probability}%
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', width: '100%' }}>
                  <div style={{ height: 3, background: '#ee7d77', width: `${module.failure_probability}%` }} />
                </div>
              </div>
            )}

            {/* Metrics row */}
            {(module.risk || module.roi || module.mit_equiv) && (
              <div className="flex items-center gap-4 mt-2">
                {module.risk && (
                  <div>
                    <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em' }} className="font-label uppercase">Risk </span>
                    <span style={{ fontSize: 11, color: module.risk === 'high' ? '#ee7d77' : '#a9abb2', fontFamily: 'ui-monospace, monospace' }}>
                      {module.risk}
                    </span>
                  </div>
                )}
                {module.roi && (
                  <div>
                    <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em' }} className="font-label uppercase">ROI </span>
                    <span style={{ fontSize: 11, color: module.roi === 'extreme' ? '#679cff' : '#a9abb2', fontFamily: 'ui-monospace, monospace' }}>
                      {module.roi}
                    </span>
                  </div>
                )}
                {module.mit_equiv && (
                  <div>
                    <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em' }} className="font-label uppercase">MIT </span>
                    <span style={{ fontSize: 11, color: '#a9abb2', fontFamily: 'ui-monospace, monospace' }}>
                      {module.mit_equiv}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel — career contribution */}
          <div
            className="shrink-0 flex flex-col items-center justify-center"
            style={{
              width: 100,
              background: '#191C1F',
              borderLeft: '1px solid rgba(255,255,255,0.04)',
              padding: '12px 8px',
            }}
          >
            <span
              className="font-headline font-bold"
              style={{ fontSize: 28, color: '#679cff', letterSpacing: '-0.02em' }}
            >
              {module.career_contribution}%
            </span>
            <span style={{ fontSize: 10, color: '#939eb4', textAlign: 'center', lineHeight: 1.2, marginTop: 2 }}>
              toward ML Engineer
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
