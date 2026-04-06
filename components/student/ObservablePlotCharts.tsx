'use client'

import { useRef, useEffect, useCallback } from 'react'
import * as Plot from '@observablehq/plot'

interface Career {
  title: string
  sector: string
  vision_priority: 'high' | 'medium'
  gap_years: number
  median_salary_usd: number
  open_roles: number
}

/* ------------------------------------------------------------------ */
/*  Chart 1 — Vision Alignment Dot Plot                               */
/* ------------------------------------------------------------------ */

export function VisionAlignmentDotPlot({
  careers,
  accentColor,
}: {
  careers: Career[]
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || careers.length === 0) return

    const plot = Plot.plot({
      marginLeft: 200,
      height: Math.max(280, careers.length * 40),
      x: { label: 'Years of study to close skill gap →', grid: true, domain: [0, Math.max(...careers.map(c => c.gap_years)) + 1] },
      y: { label: null },
      marks: [
        Plot.dot(careers, {
          x: 'gap_years',
          y: 'title',
          r: 8,
          fill: (d: Career) => d.vision_priority === 'high' ? accentColor : '#8899aa',
          title: (d: Career) => `${d.title}\nGap: ${d.gap_years} years\nPriority: ${d.vision_priority}`,
        }),
        Plot.ruleX([0]),
      ],
      caption: 'Gold = high priority sector. Gray = medium priority.',
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)
    return () => { plot.remove() }
  }, [careers, accentColor])

  return <div ref={containerRef} />
}

/* ------------------------------------------------------------------ */
/*  Chart 2 — Salary vs Skill Gap Scatter                             */
/* ------------------------------------------------------------------ */

export function SalaryVsSkillGapScatter({
  careers,
  accentColor,
}: {
  careers: Career[]
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || careers.length === 0) return

    const plot = Plot.plot({
      height: 320,
      x: { label: 'Years to close skill gap →' },
      y: { label: 'Median salary (USD/year) ↑', grid: true, tickFormat: (d: number) => `$${(d / 1000).toFixed(0)}K` },
      r: { range: [5, 22] },
      marks: [
        Plot.dot(careers, {
          x: 'gap_years',
          y: 'median_salary_usd',
          r: 'open_roles',
          fill: accentColor,
          fillOpacity: 0.6,
          title: (d: Career) =>
            `${d.title}\n$${d.median_salary_usd.toLocaleString()}/yr\nGap: ${d.gap_years}yr\nOpen roles: ${d.open_roles}`,
        }),
        Plot.text(careers, {
          x: 'gap_years',
          y: 'median_salary_usd',
          text: 'title',
          fontSize: 10,
          dy: -16,
          fill: '#64748b',
        }),
      ],
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)
    return () => { plot.remove() }
  }, [careers, accentColor])

  return <div ref={containerRef} />
}

/* ------------------------------------------------------------------ */
/*  Chart 3 — 10 Year Skill Trajectory                                */
/* ------------------------------------------------------------------ */

export function SkillTrajectoryLine({
  accentColor,
}: {
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const currentYear = new Date().getFullYear()
    const data = [
      { year: currentYear, score: 42, path: 'Current Path' },
      { year: currentYear + 1, score: 46, path: 'Current Path' },
      { year: currentYear + 3, score: 54, path: 'Current Path' },
      { year: currentYear + 5, score: 60, path: 'Current Path' },
      { year: currentYear + 10, score: 68, path: 'Current Path' },
      { year: currentYear, score: 42, path: 'Vision-Aligned Path' },
      { year: currentYear + 1, score: 52, path: 'Vision-Aligned Path' },
      { year: currentYear + 3, score: 68, path: 'Vision-Aligned Path' },
      { year: currentYear + 5, score: 78, path: 'Vision-Aligned Path' },
      { year: currentYear + 10, score: 92, path: 'Vision-Aligned Path' },
    ]

    const plot = Plot.plot({
      height: 280,
      x: { label: 'Year', type: 'linear', tickFormat: 'd' },
      y: { label: 'Skill Score', domain: [0, 100], grid: true },
      color: {
        domain: ['Current Path', 'Vision-Aligned Path'],
        range: ['#94a3b8', accentColor],
      },
      marks: [
        Plot.line(data, { x: 'year', y: 'score', stroke: 'path', strokeWidth: 2.5 }),
        Plot.dot(data, { x: 'year', y: 'score', fill: 'path', r: 4 }),
        Plot.text(
          data.filter(d => d.year === currentYear + 5),
          {
            x: 'year',
            y: 'score',
            text: (d: { path: string; score: number }) => `${d.path}: ${d.score}`,
            dx: 8,
            textAnchor: 'start',
            fontSize: 9,
            fill: '#64748b',
          }
        ),
      ],
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)
    return () => { plot.remove() }
  }, [accentColor])

  return <div ref={containerRef} />
}

/* ------------------------------------------------------------------ */
/*  Student Profile Form                                               */
/* ------------------------------------------------------------------ */

export function StudentProfileForm({
  country,
  accentColor,
  onSubmit,
}: {
  country: string
  accentColor: string
  onSubmit: (study: string, sector: string) => void
}) {
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const study = (form.elements.namedItem('study') as HTMLInputElement).value
    const sector = (form.elements.namedItem('sector') as HTMLSelectElement).value
    if (study && sector) onSubmit(study, sector)
  }, [onSubmit])

  const sectors = country === 'saudi'
    ? ['Technology', 'Finance', 'Energy', 'Tourism', 'Health']
    : ['Digital', 'Gaming', 'Finance', 'Green', 'Maritime']

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E2E5EB] p-6">
      <h3 className="font-display text-lg text-[#0A1628] mb-4">Your Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-[#8B95A8] uppercase tracking-wider block mb-1.5">What are you currently studying?</label>
          <input
            name="study"
            type="text"
            placeholder="e.g. Computer Science"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
          />
        </div>
        <div>
          <label className="text-xs text-[#8B95A8] uppercase tracking-wider block mb-1.5">Which sector interests you most?</label>
          <select
            name="sector"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-300"
          >
            <option value="">Select sector...</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Personalise Charts
          </button>
        </div>
      </div>
    </form>
  )
}
