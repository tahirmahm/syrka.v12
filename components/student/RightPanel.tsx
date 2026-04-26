import { SYSTEM_DIRECTIVE, TARGET_VECTOR, OU_R88 } from '@/lib/degree-config'

export default function RightPanel({ country }: { country: string }) {
  return (
    <div
      className="sticky overflow-y-auto"
      style={{ top: 48, height: 'calc(100vh - 48px)' }}
    >
      {/* System Directive */}
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 6, height: 6, background: '#679cff',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            className="font-label uppercase"
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.08em', color: '#679cff' }}
          >
            System Directive
          </span>
        </div>

        <h2
          className="font-headline"
          style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#e3e5ed' }}
        >
          {SYSTEM_DIRECTIVE.title}
        </h2>

        {/* Reasoning block */}
        <div
          className="mt-3"
          style={{
            background: '#000',
            borderLeft: '2px solid #ee7d77',
            padding: '12px 14px',
          }}
        >
          <span
            className="font-label uppercase block mb-2"
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.08em', color: '#ee7d77' }}
          >
            Reasoning Protocol
          </span>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: '#939eb4' }}>
            {SYSTEM_DIRECTIVE.reasoning}
          </p>
        </div>

        {/* Execute CTA */}
        <a
          href={`/${country}/student?tab=intelligence&module=${SYSTEM_DIRECTIVE.blocker_module}`}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          Execute Directive
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
        </a>
      </div>

      {/* Target Vector */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span
          className="font-label uppercase block mb-3"
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', color: '#73757c' }}
        >
          Target Vector
        </span>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="shrink-0 flex items-center justify-center"
            style={{ width: 40, height: 40, background: '#272A2D' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#679cff' }}>psychology</span>
          </div>
          <div>
            <div className="font-headline font-bold" style={{ fontSize: 15, color: '#e3e5ed' }}>
              {TARGET_VECTOR.role}
            </div>
            <div style={{ fontSize: 11, color: '#73757c' }}>Primary career vector</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase">
            Alignment
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#679cff', fontFamily: 'ui-monospace, monospace' }}>
            {TARGET_VECTOR.alignment}%
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', width: '100%' }}>
          <div style={{ height: 4, background: '#679cff', width: `${TARGET_VECTOR.alignment}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 10, color: '#73757c' }}>ETA {TARGET_VECTOR.eta}</span>
          <span style={{ fontSize: 10, color: '#73757c' }}>{TARGET_VECTOR.modules_remaining} modules remaining</span>
        </div>
      </div>

      {/* Vector Timeline */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span
          className="font-label uppercase block mb-3"
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', color: '#73757c' }}
        >
          Vector Timeline
        </span>

        <div className="relative" style={{ paddingLeft: 36 }}>
          {/* Vertical connector */}
          <div
            className="absolute"
            style={{ left: 11, top: 12, bottom: 12, width: 1, background: 'rgba(255,255,255,0.08)' }}
          />

          {OU_R88.stages.map((stage) => {
            const isDone = stage.status === 'completed'
            const isActive = stage.status === 'active'
            const dotBg = isDone ? '#45484e' : isActive ? 'rgba(103,156,255,0.2)' : 'rgba(255,255,255,0.04)'
            const dotBorder = isActive ? '1px solid #679cff' : isDone ? 'none' : 'none'

            return (
              <div key={stage.stage} className="relative flex items-center gap-3 mb-4 last:mb-0">
                <div
                  className="absolute shrink-0"
                  style={{
                    left: -36 + 0, top: 0,
                    width: 24, height: 24,
                    background: dotBg,
                    border: dotBorder,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDone && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#a9abb2' }}>check</span>
                  )}
                  {isActive && (
                    <div style={{ width: 6, height: 6, background: '#679cff' }} />
                  )}
                </div>
                <div>
                  <div className="font-headline font-bold" style={{ fontSize: 12, color: isDone ? '#73757c' : isActive ? '#e3e5ed' : '#45484e' }}>
                    Stage {stage.stage}: {stage.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#73757c' }}>
                    {isDone ? 'Completed' : isActive ? `${stage.modules.filter(m => m.status !== 'locked').length} modules active` : 'Locked'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Focus */}
      <div style={{ padding: '16px 20px' }}>
        <span
          className="font-label uppercase block mb-3"
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', color: '#73757c' }}
        >
          Active Focus
        </span>

        <div className="space-y-px">
          <div
            className="flex items-center justify-between"
            style={{ background: '#1D2023', padding: '10px 12px' }}
          >
            <span style={{ fontSize: 12, color: '#e3e5ed', fontFamily: 'ui-monospace, monospace' }}>M249</span>
            <span
              className="font-label uppercase"
              style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
                background: 'rgba(103,156,255,0.15)', color: '#679cff',
                border: '1px solid rgba(103,156,255,0.3)',
              }}
            >
              Target
            </span>
          </div>
          <div
            className="flex items-center justify-between"
            style={{ background: '#1D2023', padding: '10px 12px' }}
          >
            <span style={{ fontSize: 12, color: '#ee7d77', fontFamily: 'ui-monospace, monospace' }}>TM258</span>
            <span
              className="font-label uppercase"
              style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
                background: 'rgba(238,125,119,0.15)', color: '#ee7d77',
                border: '1px solid rgba(238,125,119,0.3)',
              }}
            >
              Blocker
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
