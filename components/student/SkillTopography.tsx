import { createClient } from '@/lib/supabase'
import { ACQUIRED_SKILLS } from '@/lib/degree-config'

interface CriticalSkill {
  name: string
  gap_score: number | null
  criticality: string | null
  annual_growth_rate: number | null
}

const TOOLCHAIN = [
  { name: 'Python', status: 'Active', statusColor: '#679cff' },
  { name: 'Statistics', status: 'Pending M249', statusColor: '#73757c' },
  { name: 'Scikit-learn', status: 'Locked', statusColor: '#45484e' },
  { name: 'TensorFlow', status: 'Locked', statusColor: '#45484e' },
]

export default async function SkillTopography() {
  let criticalSkills: CriticalSkill[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('skills')
      .select('name, gap_score, criticality, annual_growth_rate')
      .eq('criticality', 'critical')
      .limit(8)
    criticalSkills = (data ?? []) as CriticalSkill[]
  } catch { /* demo mode */ }

  const acquiredNames = new Set(ACQUIRED_SKILLS.map(s => s.name.toLowerCase()))
  const gaps = criticalSkills.filter(s => !acquiredNames.has(s.name.toLowerCase()))

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
        Skill Topography
      </span>
      <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: '#e3e5ed', letterSpacing: '-0.02em', marginBottom: 24 }}>
        SKILL MAP
      </h2>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 mb-8" style={{ gap: 1 }}>
        {/* Acquired Skills */}
        <div style={{ background: '#191C1F', padding: 20 }}>
          <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-4">
            Acquired Skills
          </span>
          <div className="space-y-3">
            {ACQUIRED_SKILLS.map(skill => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: '#a9abb2' }}>{skill.name}</span>
                  <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>{skill.module}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: 3, background: '#679cff', width: `${skill.mastery}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Gaps */}
        <div style={{ background: '#191C1F', padding: 20 }}>
          <span style={{ fontSize: 9, color: '#ee7d77', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-4">
            Critical Gaps → ML Engineer
          </span>
          <div className="space-y-3">
            {gaps.length > 0 ? gaps.map(skill => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: '#a9abb2' }}>{skill.name}</span>
                  {skill.gap_score != null && (
                    <span style={{ fontSize: 10, color: '#ee7d77', fontFamily: 'ui-monospace, monospace' }}>
                      gap: {skill.gap_score}
                    </span>
                  )}
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: 3, background: '#ee7d77', width: `${Math.min(100, (skill.gap_score ?? 50))}%` }} />
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 12, color: '#73757c' }}>No critical skill data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Toolchain Status */}
      <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
        Toolchain Status
      </span>
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 1 }}>
        {TOOLCHAIN.map(tool => (
          <div
            key={tool.name}
            style={{ background: '#1D2023', padding: 12, textAlign: 'center' }}
          >
            <div className="font-headline font-bold" style={{ fontSize: 14, color: '#e3e5ed', marginBottom: 4 }}>
              {tool.name}
            </div>
            <span
              className="font-label uppercase"
              style={{ fontSize: 9, letterSpacing: '0.08em', color: tool.statusColor }}
            >
              {tool.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
