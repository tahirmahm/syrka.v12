import { OU_R88, TARGET_VECTOR, SYSTEM_DIRECTIVE } from '@/lib/degree-config'
import ModuleCard from './ModuleCard'
import RightPanel from './RightPanel'

export default function DegreeMatrix({ country, selectedModule }: { country: string; selectedModule: string | null }) {
  let globalIndex = 0

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 48px)' }}>
      {/* Left column — 65% */}
      <div className="flex-1" style={{ maxWidth: '65%' }}>
        {/* Matrix status bar */}
        <div
          className="flex items-center gap-2"
          style={{
            background: '#000',
            padding: '6px 16px',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#679cff',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 6, height: 6, background: '#679cff', animation: 'pulse 2s infinite' }} />
          <span>Matrix Status: Active</span>
          <div className="flex-1" />
          <span style={{ color: '#73757c' }}>
            Target: {TARGET_VECTOR.role} · {TARGET_VECTOR.alignment}%
          </span>
        </div>

        {/* Hero heading */}
        <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1
            className="font-headline"
            style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#e3e5ed',
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Degree Execution<br />Matrix
          </h1>
          <p style={{ fontSize: 12, color: '#939eb4', lineHeight: 1.5, maxWidth: 500 }}>
            Analyzing active academic modules. Dependency conflicts detected. Prioritization override recommended for optimal career vector alignment.
          </p>
        </div>

        {/* Conflict status bar */}
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{
            background: '#000',
            padding: '6px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#ee7d77' }}>warning</span>
          <span style={{ fontSize: 10, color: '#ee7d77', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}>
            2 Dependency Conflicts
          </span>
          <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 10, color: '#939eb4' }}>
            Directive: {SYSTEM_DIRECTIVE.blocker_module} → Unblock {SYSTEM_DIRECTIVE.unblocks}
          </span>
        </div>

        {/* Module list */}
        <div>
          {OU_R88.stages.map((stage) => (
            <div key={stage.stage}>
              {/* Section label */}
              <div style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#73757c',
                padding: '12px 16px 6px',
              }}>
                Stage {stage.stage} — {stage.name} · {stage.credits} credits
              </div>

              {stage.modules.map((mod) => {
                const idx = globalIndex++
                return (
                  <ModuleCard
                    key={mod.code}
                    module={mod}
                    country={country}
                    index={idx}
                    isSelected={selectedModule === mod.code}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right column — 35% */}
      <div
        className="hidden md:block shrink-0"
        style={{ width: '35%', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      >
        <RightPanel country={country} />
      </div>
    </div>
  )
}
