'use client'

import { useRef, useEffect } from 'react'
import * as Plot from '@observablehq/plot'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SkillGapDot {
  career_cluster: string
  skill_gap_score: number
  is_student: boolean
  label?: string
}

interface SalaryVsGapPoint {
  years_to_close: number
  median_salary: number
  open_roles: number
  career: string
}

interface TrajectoryPoint {
  year: number
  score: number
  path: string
}

/* ------------------------------------------------------------------ */
/*  Skill Profile Distribution (Dot Plot)                              */
/* ------------------------------------------------------------------ */

export function SkillProfileDistribution({
  data,
  accentColor,
}: {
  data: SkillGapDot[]
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const plot = Plot.plot({
      marginLeft: 140,
      height: 300,
      x: { label: 'Skill Gap Score', domain: [0, 100] },
      y: { label: null },
      marks: [
        Plot.dot(
          data.filter((d) => !d.is_student),
          {
            x: 'skill_gap_score',
            y: 'career_cluster',
            fill: '#cbd5e1',
            r: 4,
            opacity: 0.5,
          }
        ),
        Plot.dot(
          data.filter((d) => d.is_student),
          {
            x: 'skill_gap_score',
            y: 'career_cluster',
            fill: accentColor,
            r: 7,
            stroke: 'white',
            strokeWidth: 2,
          }
        ),
        Plot.ruleX([0]),
      ],
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [data, accentColor])

  return <div ref={containerRef} />
}

/* ------------------------------------------------------------------ */
/*  Salary vs Skill Gap (Scatter)                                      */
/* ------------------------------------------------------------------ */

export function SalaryVsSkillGap({
  data,
  accentColor,
}: {
  data: SalaryVsGapPoint[]
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const plot = Plot.plot({
      height: 300,
      x: { label: 'Years to Close Skill Gap' },
      y: { label: 'Median Salary (Local Currency)', grid: true },
      r: { range: [4, 20] },
      marks: [
        Plot.dot(data, {
          x: 'years_to_close',
          y: 'median_salary',
          r: 'open_roles',
          fill: accentColor,
          opacity: 0.6,
          title: (d: SalaryVsGapPoint) =>
            `${d.career}\nSalary: ${d.median_salary.toLocaleString()}\nGap: ${d.years_to_close}yr\nRoles: ${d.open_roles}`,
        }),
        Plot.text(data, {
          x: 'years_to_close',
          y: 'median_salary',
          text: 'career',
          fontSize: 10,
          dy: -14,
          fill: '#64748b',
        }),
      ],
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [data, accentColor])

  return <div ref={containerRef} />
}

/* ------------------------------------------------------------------ */
/*  Skill Development Trajectory (Line Chart)                          */
/* ------------------------------------------------------------------ */

export function SkillTrajectory({
  data,
  accentColor,
}: {
  data: TrajectoryPoint[]
  accentColor: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const plot = Plot.plot({
      height: 280,
      x: { label: 'Year', type: 'linear', tickFormat: 'd' },
      y: { label: 'Skill Score', domain: [0, 100], grid: true },
      color: {
        domain: ['Current Path', 'Vision-Aligned Path'],
        range: ['#94a3b8', accentColor],
      },
      marks: [
        Plot.line(data, {
          x: 'year',
          y: 'score',
          stroke: 'path',
          strokeWidth: 2.5,
        }),
        Plot.dot(data, {
          x: 'year',
          y: 'score',
          fill: 'path',
          r: 4,
        }),
      ],
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [data, accentColor])

  return <div ref={containerRef} />
}
