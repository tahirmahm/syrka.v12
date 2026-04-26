import { OU_R88, TARGET_VECTOR, SYSTEM_DIRECTIVE } from '@/lib/degree-config'
import ModuleCard from './ModuleCard'
import RightPanel from './RightPanel'

const STAGE_TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: 'rgba(169,171,178,0.1)', color: '#a9abb2', border: 'rgba(169,171,178,0.2)' },
  active: { bg: 'rgba(103,156,255,0.1)', color: '#679cff', border: 'rgba(103,156,255,0.2)' },
  locked: { bg: 'rgba(69,72,78,0.3)', color: '#45484e', border: 'rgba(69,72,78,0.4)' },
}

export default function DegreeMatrix({ country, selectedModule }: { country: string; selectedModule: string | null }) {
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 48px)' }}>
      {/* Left column — 65% */}
      <div className="flex-1" style={{ maxWidth: '65%' }}>
        {/* System status bar */}
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{
            background: '#000',
            padding: '8px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ee7d77' }}>warning</span>
            <span style={{ fontSize: 11, color: '#ee7d77', fontFamily: 'ui-monospace, monospace' }}>
              2 Dependency Conflicts Detected
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, color: '#939eb4' }}>
            Directive: Initialize {SYSTEM_DIRECTIVE.blocker_module} → Unblock {SYSTEM_DIRECTIVE.unblocks}
          </span>
          <div className="flex-1" />
          <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>
            Target: {TARGET_VECTOR.role} · {TARGET_VECTOR.alignment}% aligned
          </span>
        </div>

        {/* Stages + Modules */}
        {OU_R88.stages.map((stage) => {
          const tagStyle = STAGE_TAG_STYLES[stage.status]
          return (
            <div key={stage.stage}>
              {/* Stage header */}
              <div
                className="flex items-center gap-3"
                style={{
                  background: '#000',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  padding: '8px 24px',
                }}
              >
                <span
                  className="font-label uppercase"
                  style={{
                    padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
                    background: tagStyle.bg, color: tagStyle.color,
                    border: `1px solid ${tagStyle.border}`,
                  }}
                >
                  Stage {stage.stage}
                </span>
                <span className="font-headline font-bold" style={{ fontSize: 13, color: '#e3e5ed' }}>
                  {stage.name}
                </span>
                <span style={{ fontSize: 11, color: '#73757c' }}>{stage.credits} credits</span>
                <span
                  className="font-label uppercase"
                  style={{ fontSize: 10, letterSpacing: '0.06em', color: tagStyle.color }}
                >
                  {stage.status}
                </span>
                <div className="flex-1" />
                <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>
                  {stage.modules.length} modules
                </span>
              </div>

              {/* Module cards */}
              {stage.modules.map((mod) => (
                <ModuleCard
                  key={mod.code}
                  module={mod}
                  country={country}
                  isSelected={selectedModule === mod.code}
                />
              ))}
            </div>
          )
        })}
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
