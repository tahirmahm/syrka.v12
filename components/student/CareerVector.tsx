import { CAREER_PATHS, OU_R88 } from '@/lib/degree-config'

const STATUS_COLORS: Record<string, string> = {
  completed: '#45484e',
  ready: '#679cff',
  active: '#679cff',
  blocked: '#ee7d77',
  locked: '#45484e',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CareerVector({ country }: { country: string }) {
  const maxContribution = Math.max(...OU_R88.stages.flatMap(s => s.modules).map(m => m.career_contribution))
  const allModules = OU_R88.stages.flatMap(s => s.modules)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
        Career Vectors
      </span>
      <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: '#e3e5ed', letterSpacing: '-0.02em', marginBottom: 24 }}>
        CAREER PATH ANALYSIS
      </h2>

      {/* 2×2 career path grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 mb-8" style={{ gap: 1 }}>
        {CAREER_PATHS.map((path) => (
          <div
            key={path.role}
            style={{
              background: '#191C1F',
              borderTop: `3px solid ${path.active ? '#679cff' : 'rgba(255,255,255,0.1)'}`,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline font-bold" style={{ fontSize: 16, color: path.active ? '#e3e5ed' : '#73757c' }}>
                {path.role}
              </h3>
              <span
                className="font-label uppercase"
                style={{
                  padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
                  background: path.active ? 'rgba(103,156,255,0.1)' : 'rgba(69,72,78,0.3)',
                  color: path.active ? '#679cff' : '#45484e',
                  border: `1px solid ${path.active ? 'rgba(103,156,255,0.2)' : 'rgba(69,72,78,0.4)'}`,
                }}
              >
                {path.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, color: '#73757c' }}>Alignment</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: path.active ? '#679cff' : '#73757c', fontFamily: 'ui-monospace, monospace' }}>
                {path.alignment}%
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ height: 4, background: path.active ? '#679cff' : '#45484e', width: `${path.alignment}%` }} />
            </div>

            <span style={{ fontSize: 11, color: '#73757c' }}>UK median: {path.salary}</span>
          </div>
        ))}
      </div>

      {/* Module contributions chart */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
        <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
          Module Contributions → ML Engineer
        </span>

        <div>
          {allModules.map((mod) => {
            const barColor = STATUS_COLORS[mod.status]
            const barWidth = Math.round((mod.career_contribution / maxContribution) * 100)
            const opacity = mod.status === 'completed' ? 0.55 : mod.status === 'locked' ? 0.45 : 1

            return (
              <div
                key={mod.code}
                className="flex items-center"
                style={{
                  opacity,
                  padding: '6px 0',
                  background: allModules.indexOf(mod) % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                <span
                  className="shrink-0 font-label"
                  style={{
                    width: 60, fontSize: 11,
                    fontFamily: 'ui-monospace, monospace',
                    color: barColor,
                    letterSpacing: '0.04em',
                  }}
                >
                  {mod.code}
                </span>
                <div className="flex-1 mx-3" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: 4, background: barColor, width: `${barWidth}%` }} />
                </div>
                <span
                  className="shrink-0"
                  style={{ width: 36, fontSize: 11, color: '#a9abb2', fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}
                >
                  {mod.career_contribution}%
                </span>
                <span
                  className="shrink-0 ml-3 font-label uppercase"
                  style={{
                    width: 80, fontSize: 9, textAlign: 'right',
                    color: STATUS_COLORS[mod.status],
                    letterSpacing: '0.06em',
                  }}
                >
                  {mod.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
