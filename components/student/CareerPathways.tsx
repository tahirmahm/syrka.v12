'use client'

interface SectorPathway {
  name: string
  open_roles: number
  alignment: number
}

interface CareerPathwaysProps {
  sectors: SectorPathway[]
  accentColor: string
}

function alignmentTier(alignment: number): { label: string; color: string } {
  if (alignment >= 80) return { label: 'Strong Fit', color: '#16A34A' }
  if (alignment >= 60) return { label: 'Good Fit', color: '#2563EB' }
  if (alignment >= 40) return { label: 'Moderate', color: '#F59E0B' }
  return { label: 'Emerging', color: '#94A3B8' }
}

export default function CareerPathways({ sectors, accentColor }: CareerPathwaysProps) {
  const sorted = [...sectors].sort((a, b) => b.alignment - a.alignment)

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-slate-800 tracking-tight">
        Career Pathways
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((sector) => {
          const tier = alignmentTier(sector.alignment)

          return (
            <div
              key={sector.name}
              className="bg-[#0D1117] rounded-lg border border-slate-200 p-5 space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Sector name */}
              <div className="flex items-start justify-between">
                <h4 className="font-display text-sm font-medium text-slate-800">
                  {sector.name}
                </h4>
                <span
                  className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    color: tier.color,
                    backgroundColor: `${tier.color}10`,
                  }}
                >
                  {tier.label}
                </span>
              </div>

              {/* Alignment ring */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg width={56} height={56} className="-rotate-90">
                    <circle
                      cx={28}
                      cy={28}
                      r={22}
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth={5}
                    />
                    <circle
                      cx={28}
                      cy={28}
                      r={22}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - sector.alignment / 100)}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums"
                    style={{ color: accentColor }}
                  >
                    {sector.alignment}%
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Vision alignment</p>
                  <p className="text-lg font-semibold text-slate-700 tabular-nums mt-0.5">
                    {sector.open_roles.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">roles available</span>
                  </p>
                </div>
              </div>

              {/* Bottom bar indicator */}
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sector.alignment}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="bg-[#0D1117] rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
          No career pathway data available
        </div>
      )}
    </div>
  )
}
