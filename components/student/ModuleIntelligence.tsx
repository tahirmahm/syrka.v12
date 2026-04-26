import { getModule, getStageForModule, TARGET_VECTOR, SYSTEM_DIRECTIVE, ACQUIRED_SKILLS } from '@/lib/degree-config'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const STATUS_TAG: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: 'rgba(169,171,178,0.1)', color: '#a9abb2', border: 'rgba(169,171,178,0.2)' },
  ready: { bg: 'rgba(103,156,255,0.1)', color: '#679cff', border: 'rgba(103,156,255,0.2)' },
  active: { bg: 'rgba(103,156,255,0.1)', color: '#679cff', border: 'rgba(103,156,255,0.2)' },
  blocked: { bg: 'rgba(238,125,119,0.1)', color: '#ee7d77', border: 'rgba(238,125,119,0.2)' },
  locked: { bg: 'rgba(69,72,78,0.3)', color: '#45484e', border: 'rgba(69,72,78,0.4)' },
}

function Tag({ status }: { status: string }) {
  const s = STATUS_TAG[status] ?? STATUS_TAG.locked
  return (
    <span
      className="font-label uppercase inline-flex items-center"
      style={{
        padding: '2px 8px', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  )
}

export default async function ModuleIntelligence({
  moduleCode,
  country,
}: {
  moduleCode: string
  country: string
}) {
  const mod = getModule(moduleCode)

  if (!mod) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: '#939eb4', fontSize: 14 }}>
          Select a module from the{' '}
          <Link href={`/${country}/student?tab=matrix`} style={{ color: '#679cff', textDecoration: 'underline' }}>
            Degree Matrix
          </Link>{' '}
          to view intelligence.
        </p>
      </div>
    )
  }

  const stage = getStageForModule(moduleCode)
  const alignment = Math.min(100, Math.round(mod.career_contribution * 7.67))

  let percentileRank = 'Top 35%'
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('students')
      .select('vision_alignment_score')
      .order('vision_alignment_score', { ascending: false })
    if (data && data.length > 0) {
      const scores = data.map(r => r.vision_alignment_score as number).filter(Boolean)
      const demoScore = 75
      const above = scores.filter(s => s > demoScore).length
      const pct = Math.round((above / scores.length) * 100)
      percentileRank = `Top ${pct}%`
    }
  } catch { /* demo mode fallback */ }


  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Tag status={mod.status} />
          {mod.risk && (
            <span style={{ fontSize: 10, color: mod.risk === 'high' ? '#ee7d77' : '#73757c', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase">
              {mod.risk} risk
            </span>
          )}
          {mod.roi && (
            <span style={{ fontSize: 10, color: mod.roi === 'extreme' ? '#679cff' : '#73757c', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase">
              {mod.roi} roi
            </span>
          )}
        </div>
        <h1
          className="font-headline"
          style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#e3e5ed', lineHeight: 1 }}
        >
          {mod.code} {mod.name}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span style={{ fontSize: 13, color: '#73757c' }}>{mod.credits} credits</span>
          {mod.mit_equiv && (
            <span style={{ fontSize: 13, color: '#73757c' }}>MIT equiv: {mod.mit_equiv}</span>
          )}
          {stage && (
            <span style={{ fontSize: 13, color: '#73757c' }}>Stage {stage.stage}: {stage.name}</span>
          )}
        </div>
      </div>

      {/* System directive banner for M249 */}
      {mod.system_directive && (
        <div
          className="mb-6"
          style={{
            background: 'rgba(103,156,255,0.06)',
            border: '1px solid rgba(103,156,255,0.15)',
            padding: '16px 20px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div style={{ width: 6, height: 6, background: '#679cff', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#679cff', letterSpacing: '0.08em' }} className="font-label uppercase">
              System Directive Active
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#939eb4', lineHeight: 1.5 }}>{mod.directive_reason}</p>
        </div>
      )}

      {/* 2×2 Metrics grid */}
      <div className="grid grid-cols-2 mb-6" style={{ gap: 1 }}>
        {/* Strategic Alignment */}
        <div style={{ background: '#191C1F', padding: 20 }}>
          <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
            Strategic Alignment
          </span>
          <div className="font-headline font-bold" style={{ fontSize: 32, color: '#679cff', letterSpacing: '-0.02em' }}>
            {alignment}%
          </div>
          <p style={{ fontSize: 11, color: '#939eb4', marginTop: 4 }}>
            Contribution toward {TARGET_VECTOR.role} career vector
          </p>
          <div className="mt-3 flex items-center justify-between mb-1">
            <span style={{ fontSize: 9, color: '#73757c' }} className="font-label uppercase">Alignment</span>
            <span style={{ fontSize: 11, color: '#679cff', fontFamily: 'ui-monospace, monospace' }}>{alignment}%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: 3, background: '#679cff', width: `${alignment}%` }} />
          </div>
        </div>

        {/* Track Navigation */}
        <div style={{ background: '#191C1F', padding: 20 }}>
          <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
            Track Navigation
          </span>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 12, color: '#a9abb2' }}>Current Track</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#73757c' }}>arrow_forward</span>
            <span style={{ fontSize: 12, color: '#e3e5ed', fontWeight: 600 }}>{TARGET_VECTOR.role}</span>
          </div>
          <p style={{ fontSize: 11, color: '#73757c', marginBottom: 12 }}>
            This module contributes {mod.career_contribution}% toward your target career vector.
          </p>
          <Link
            href={`/${country}/student?tab=career`}
            className="btn-ghost inline-flex items-center gap-2"
            style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 10 }}
          >
            Initiate Track Switch
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>swap_horiz</span>
          </Link>
        </div>
      </div>

      {/* Prerequisite Deficit block */}
      {mod.status === 'blocked' && mod.blocker && mod.failure_probability != null && (
        <div
          className="mb-6"
          style={{
            background: 'rgba(238,125,119,0.07)',
            border: '1px solid rgba(238,125,119,0.2)',
            padding: 20,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ee7d77' }}>warning</span>
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#ee7d77', letterSpacing: '0.08em' }} className="font-label uppercase">
              Prerequisite Deficit
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#939eb4', lineHeight: 1.5, marginBottom: 12 }}>
            {mod.blocker} has not been completed. Statistical models project a{' '}
            <span style={{ color: '#ee7d77', fontWeight: 700 }}>{mod.failure_probability}%</span>{' '}
            failure probability in algorithmic units without prerequisite mastery.
          </p>
          <div className="mb-3">
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: 8, background: '#ee7d77', width: `${mod.failure_probability}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${country}/student?tab=intelligence&module=${mod.blocker}`}
              className="btn-primary inline-flex items-center gap-2"
              style={{ textDecoration: 'none', padding: '10px 20px', fontSize: 11 }}
            >
              Complete Prerequisite
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </Link>
            <button
              className="inline-flex items-center gap-2 font-label uppercase"
              style={{
                padding: '10px 20px', fontSize: 11, letterSpacing: '0.08em',
                background: 'transparent', border: '1px solid rgba(238,125,119,0.3)',
                color: '#ee7d77', cursor: 'pointer',
              }}
            >
              Override Decision
            </button>
          </div>
        </div>
      )}

      {/* Skill Topography grid */}
      <div className="mb-6">
        <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
          Skill Topography
        </span>
        <div className="grid grid-cols-2" style={{ gap: 1 }}>
          {/* Dependency Failure or Active Focus */}
          {mod.status === 'blocked' && mod.blocker ? (
            <div style={{ background: '#191C1F', padding: 16 }}>
              <span style={{ fontSize: 9, color: '#ee7d77', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
                Dependency Failure
              </span>
              <div className="font-headline font-bold" style={{ fontSize: 15, color: '#ee7d77' }}>
                {mod.blocker}
              </div>
              <p style={{ fontSize: 11, color: '#73757c', marginTop: 4 }}>Prerequisite not satisfied</p>
            </div>
          ) : (
            <div style={{ background: '#191C1F', padding: 16 }}>
              <span style={{ fontSize: 9, color: '#679cff', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
                Active Focus
              </span>
              <div className="font-headline font-bold" style={{ fontSize: 15, color: '#e3e5ed' }}>
                Current Mastery
              </div>
              <div className="mt-2" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: 3, background: '#679cff', width: '45%' }} />
              </div>
              <span style={{ fontSize: 10, color: '#73757c', marginTop: 4 }} className="block">45% — in progress</span>
            </div>
          )}

          {/* MIT Alignment */}
          <div style={{ background: '#191C1F', padding: 16 }}>
            <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
              MIT Alignment
            </span>
            {mod.mit_equiv ? (
              <>
                <div className="font-headline font-bold" style={{ fontSize: 28, color: '#4CAF50' }}>
                  {Math.round(alignment * 0.85)}%
                </div>
                <div className="mt-2" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: 3, background: '#4CAF50', width: `${Math.round(alignment * 0.85)}%` }} />
                </div>
                <span style={{ fontSize: 10, color: '#73757c', marginTop: 4 }} className="block">MIT {mod.mit_equiv}</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#45484e' }}>No MIT equivalent</span>
            )}
          </div>

          {/* Skills Built */}
          <div style={{ background: '#191C1F', padding: 16 }} className="col-span-2">
            <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
              Skills Built
            </span>
            <div className="space-y-2">
              {ACQUIRED_SKILLS.slice(0, 4).map(skill => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 11, color: '#a9abb2' }}>{skill.name}</span>
                    <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>{skill.mastery}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 3, background: '#679cff', width: `${skill.mastery}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex items-center gap-3 mb-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link
          href={`/${country}/student?tab=directives`}
          className="btn-primary inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rocket_launch</span>
          Optimize My Path
        </Link>
        <button className="btn-ghost inline-flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
          Explain Module
        </button>
        <button className="btn-ghost inline-flex items-center gap-2">
          Study Plan
        </button>
      </div>

      {/* Intelligence Directives box */}
      <div
        style={{
          background: '#121316',
          borderLeft: '3px solid #679cff',
          padding: 20,
        }}
      >
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#679cff', letterSpacing: '0.08em' }} className="font-label uppercase block mb-3">
          Intelligence Directives
        </span>

        <div className="grid grid-cols-2 mb-4" style={{ gap: 1 }}>
          <div style={{ background: '#191C1F', padding: 12 }}>
            <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em' }} className="font-label uppercase block mb-1">
              Performance Ranking
            </span>
            <div className="font-headline font-bold" style={{ fontSize: 20, color: '#679cff' }}>
              {percentileRank}
            </div>
            <span style={{ fontSize: 10, color: '#73757c' }}>of cohort for this module type</span>
          </div>
          <div style={{ background: '#191C1F', padding: 12 }}>
            <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.08em' }} className="font-label uppercase block mb-1">
              Risk Analysis
            </span>
            <div className="font-headline font-bold" style={{ fontSize: 20, color: mod.risk === 'high' ? '#ee7d77' : '#e3e5ed' }}>
              {mod.risk ? mod.risk.charAt(0).toUpperCase() + mod.risk.slice(1) : 'Standard'}
            </div>
            <span style={{ fontSize: 10, color: '#73757c' }}>based on prerequisite chain</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#939eb4', lineHeight: 1.5, marginBottom: 16 }}>
          {mod.system_directive
            ? `Recommended: Complete ${mod.code} immediately to unblock ${SYSTEM_DIRECTIVE.unblocks}. This is the highest-priority action for career vector optimization.`
            : mod.status === 'blocked'
              ? `Priority: Complete ${mod.blocker} to unblock this module. Current failure probability of ${mod.failure_probability}% makes direct attempt inadvisable.`
              : `This module contributes ${mod.career_contribution}% toward your ${TARGET_VECTOR.role} career vector. ${mod.roi === 'extreme' ? 'Extreme ROI — prioritize.' : ''}`
          }
        </p>

        <button
          className="w-full font-label uppercase inline-flex items-center justify-center gap-2"
          style={{
            background: '#679cff', color: '#000', padding: '12px 24px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            border: 'none', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#000' }}>bolt</span>
          Execute Hybrid Plan
        </button>
      </div>
    </div>
  )
}
