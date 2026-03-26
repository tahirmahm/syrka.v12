'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ScenarioDataPoint {
  year: number
  before: number
  after: number
}

interface ScenarioComparisonChartProps {
  data: ScenarioDataPoint[]
  accentColor: string
}

function formatYAxisLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const before = payload.find((p) => p.dataKey === 'before')
  const after = payload.find((p) => p.dataKey === 'after')
  const reduction =
    before && after && before.value > 0
      ? Math.round(((before.value - after.value) / before.value) * 100)
      : null

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl border border-white/10 text-sm"
      style={{ backgroundColor: '#0A1628' }}
    >
      <p className="text-white/60 font-mono text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70 text-xs">{entry.name}:</span>
          <span className="text-white font-medium text-xs ml-auto pl-3">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
      {reduction !== null && (
        <div className="mt-1.5 pt-1.5 border-t border-white/10">
          <span className="text-xs text-emerald-400">
            {reduction}% gap reduction
          </span>
        </div>
      )}
    </div>
  )
}

interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null

  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScenarioComparisonChart({
  data,
  accentColor,
}: ScenarioComparisonChartProps) {
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-slate-800/40"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
          />
          <YAxis
            tickFormatter={formatYAxisLabel}
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          <Bar
            dataKey="before"
            name="Before Intervention"
            fill="#EF4444"
            radius={[3, 3, 0, 0]}
            opacity={0.8}
          >
            {sortedData.map((_, index) => (
              <Cell key={`before-${index}`} fill="#EF4444" fillOpacity={0.7} />
            ))}
          </Bar>

          <Bar
            dataKey="after"
            name="After Intervention"
            fill={accentColor}
            radius={[3, 3, 0, 0]}
          >
            {sortedData.map((_, index) => (
              <Cell key={`after-${index}`} fill={accentColor} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
