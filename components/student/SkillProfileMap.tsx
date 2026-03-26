'use client'

interface SkillProficiency {
  name: string
  avgProficiency: number
}

interface SkillProfileMapProps {
  skills: SkillProficiency[]
  accentColor: string
}

function proficiencyLabel(value: number): string {
  if (value >= 90) return 'Expert'
  if (value >= 70) return 'Practitioner'
  if (value >= 50) return 'Working'
  if (value >= 25) return 'Awareness'
  return 'Novice'
}

export default function SkillProfileMap({ skills, accentColor }: SkillProfileMapProps) {
  const sorted = [...skills].sort((a, b) => b.avgProficiency - a.avgProficiency)
  const maxProficiency = sorted.length > 0 ? Math.max(...sorted.map((s) => s.avgProficiency), 1) : 1

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-slate-800 tracking-tight">
        Skill Profile Map
      </h3>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {sorted.map((skill) => {
            const barWidth = maxProficiency > 0 ? (skill.avgProficiency / maxProficiency) * 100 : 0
            const label = proficiencyLabel(skill.avgProficiency)

            return (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate mr-2">{skill.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {label}
                    </span>
                    <span
                      className="font-medium tabular-nums"
                      style={{ color: accentColor }}
                    >
                      {skill.avgProficiency.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: accentColor,
                      opacity: 0.5 + (barWidth / 100) * 0.5,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No skill proficiency data available
          </p>
        )}
      </div>
    </div>
  )
}
