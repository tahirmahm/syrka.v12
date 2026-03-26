'use client'

interface PipelineFlowChartProps {
  institutions: number
  graduates: number
  employmentRate: number
  accentColor: string
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

interface StageProps {
  label: string
  value: string
  sublabel: string
  accentColor: string
  isLast?: boolean
}

function Stage({ label, value, sublabel, accentColor, isLast }: StageProps) {
  return (
    <>
      <div className="flex-1 min-w-0">
        <div
          className="rounded-lg border px-4 py-5 text-center transition-colors"
          style={{
            borderColor: `${accentColor}30`,
            backgroundColor: `${accentColor}08`,
          }}
        >
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            {label}
          </p>
          <p
            className="text-2xl font-bold font-mono"
            style={{ color: accentColor }}
          >
            {value}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
        </div>
      </div>

      {!isLast && (
        <div className="flex items-center px-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <div
              className="w-6 sm:w-10 h-px"
              style={{ backgroundColor: `${accentColor}40` }}
            />
            <svg
              width="8"
              height="12"
              viewBox="0 0 8 12"
              fill="none"
              style={{ color: `${accentColor}80` }}
            >
              <path
                d="M1 1L6 6L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  )
}

export default function PipelineFlowChart({
  institutions,
  graduates,
  employmentRate,
  accentColor,
}: PipelineFlowChartProps) {
  const employed = Math.round((graduates * employmentRate) / 100)

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 sm:gap-2">
        <Stage
          label="Education"
          value={formatNumber(institutions)}
          sublabel="Institutions"
          accentColor={accentColor}
        />
        <Stage
          label="Skills"
          value={formatNumber(graduates)}
          sublabel="Annual Graduates"
          accentColor={accentColor}
        />
        <Stage
          label="Employment"
          value={`${employmentRate}%`}
          sublabel={`${formatNumber(employed)} placed`}
          accentColor={accentColor}
          isLast
        />
      </div>

      {/* Flow bar */}
      <div className="mt-4 relative">
        <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${employmentRate}%`,
              background: `linear-gradient(90deg, ${accentColor}60, ${accentColor})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
          <span>Pipeline input</span>
          <span>
            <span className="font-mono" style={{ color: accentColor }}>
              {employmentRate}%
            </span>{' '}
            throughput
          </span>
        </div>
      </div>
    </div>
  )
}
