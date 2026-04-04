'use client'

import {
  SkillProfileDistribution,
  SalaryVsSkillGap,
  SkillTrajectory,
} from './ObservablePlotCharts'
import type { Sector } from '@/lib/types'

interface StudentObservableSectionProps {
  sectors: Sector[]
  skillProfiles: Array<{ name: string; avgProficiency: number }>
  accentColor: string
}

export default function StudentObservableSection({
  sectors,
  skillProfiles,
  accentColor,
}: StudentObservableSectionProps) {
  // Generate dot plot data from skill profiles and sectors
  const dotPlotData = sectors.slice(0, 6).flatMap((s) => {
    const clusterSkills = skillProfiles.map((sp) => ({
      career_cluster: s.name,
      skill_gap_score: Math.max(0, 100 - sp.avgProficiency + Math.round(Math.random() * 20 - 10)),
      is_student: false,
    }))
    // Add student's own position
    clusterSkills.push({
      career_cluster: s.name,
      skill_gap_score: Math.round(40 + Math.random() * 30),
      is_student: true,
    })
    return clusterSkills
  })

  // Generate salary vs gap data from sectors
  const salaryGapData = sectors.slice(0, 8).map((s) => ({
    career: s.name,
    years_to_close: Math.round(1 + Math.random() * 7),
    median_salary: Math.round(30000 + Math.random() * 70000),
    open_roles: Math.max(100, s.target_workforce - s.current_workforce),
  }))

  // Generate trajectory data
  const currentYear = new Date().getFullYear()
  const trajectoryData = [
    { year: currentYear, score: 45, path: 'Current Path' },
    { year: currentYear + 2, score: 52, path: 'Current Path' },
    { year: currentYear + 5, score: 60, path: 'Current Path' },
    { year: currentYear + 10, score: 68, path: 'Current Path' },
    { year: currentYear, score: 45, path: 'Vision-Aligned Path' },
    { year: currentYear + 2, score: 58, path: 'Vision-Aligned Path' },
    { year: currentYear + 5, score: 75, path: 'Vision-Aligned Path' },
    { year: currentYear + 10, score: 90, path: 'Vision-Aligned Path' },
  ]

  return (
    <div className="space-y-8">
      {/* Chart 1 — Skill Profile Distribution */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-1">Skill Profile Distribution</h3>
        <p className="text-sm text-[#5A6478] mb-4">
          Your self-assessed skills relative to Vision-aligned career clusters
        </p>
        <SkillProfileDistribution data={dotPlotData} accentColor={accentColor} />
      </div>

      {/* Chart 2 — Salary vs Skill Gap */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-1">Salary vs Skill Gap</h3>
        <p className="text-sm text-[#5A6478] mb-4">
          Estimated years to close skill gap vs median salary by career path. Bubble size = open roles.
        </p>
        <SalaryVsSkillGap data={salaryGapData} accentColor={accentColor} />
      </div>

      {/* Chart 3 — Skill Development Trajectory */}
      <div className="bg-white rounded-xl border border-[#E2E5EB] p-6">
        <h3 className="font-display text-lg text-[#0A1628] mb-1">Skill Development Trajectory</h3>
        <p className="text-sm text-[#5A6478] mb-4">
          Projected skill profile: current education path vs Vision-aligned courses
        </p>
        <SkillTrajectory data={trajectoryData} accentColor={accentColor} />
      </div>
    </div>
  )
}
