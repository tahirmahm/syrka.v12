'use client'

import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
} from 'recharts'

interface TrajectoryDataPoint {
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

interface GapTrajectoryChartProps {
  data: TrajectoryDataPoint[]
  accentColor: string
  targetYear: number
}

function formatYAxisLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

function formatTooltipValue(value: number | null): string {
  if (value === null || value === undefined) return '--'
  return value.toLocaleString()
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number | null
    color: string
    dataKey: string
  }>
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl border border-white/10 text-sm"
      style={{ backgroundColor: '#0A1628' }}
    >
      <p className="text-white/60 font-mono text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70 text-xs">{entry.name}:</span>
          <span className="text-white font-medium text-xs ml-auto pl-3">
            {formatTooltipValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
    type: string
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null

  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className="w-3 h-0.5 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function GapTrajectoryChart({
  data,
  accentColor,
  targetYear,
}: GapTrajectoryChartProps) {
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  const hasIntervention = sortedData.some(
    (d) => d.with_intervention !== null && d.with_intervention !== undefined
  )

  const historicalData = sortedData
    .filter((d) => d.data_type === 'historical')
    .map((d) => ({
      year: d.year,
      historicalDot: d.current_trajectory,
    }))

  const chartData = sortedData.map((d) => {
    const historical = historicalData.find((h) => h.year === d.year)
    return {
      ...d,
      historicalDot: historical?.historicalDot ?? undefined,
    }
  })

  return (
    <div className="w-full" style={{ height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradVision" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradIntervention" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.01} />
            </linearGradient>
          </defs>

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
            domain={['dataMin', targetYear]}
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

          <Area
            type="monotone"
            dataKey="current_trajectory"
            name="Current Trajectory"
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#gradCurrent)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#EF4444' }}
            connectNulls
          />

          <Area
            type="monotone"
            dataKey="vision_target"
            name="Vision Target"
            stroke={accentColor}
            strokeWidth={2}
            fill="url(#gradVision)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: accentColor }}
            connectNulls
          />

          {hasIntervention && (
            <Area
              type="monotone"
              dataKey="with_intervention"
              name="With Intervention"
              stroke="#16A34A"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="url(#gradIntervention)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#16A34A' }}
              connectNulls
            />
          )}

          <Scatter
            dataKey="historicalDot"
            name="Historical Data"
            fill="#94A3B8"
            r={3}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
