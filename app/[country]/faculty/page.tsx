'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { createClient } from '@/lib/supabase'

interface SkillCount {
  skill: string
  count: number
  pct: number
  avgProficiency?: number
}

interface EvolutionRec {
  title: string
  authors: string
  why_now: string
  esco_skills: string[]
  difficulty: string
}

interface EvolutionEntry {
  courseName: string
  generated_at: string
  recommendations: EvolutionRec[]
}

interface CourseAlignment {
  skill: string
  courseCount: number
  masteredCount: number
}

export default function FacultyDashboard() {
  const params = useParams()
  const country = (params.country as string) || 'saudi'
  const supabase = createClient()

  const TOTAL_STUDENTS = 750

  const [cohortSkills, setCohortSkills] = useState<SkillCount[]>([])
  const [courseAlignment, setCourseAlignment] = useState<CourseAlignment[]>([])
  const [aiReadyPct, setAiReadyPct] = useState(0)
  const [evolutions, setEvolutions] = useState<EvolutionEntry[]>([])
  const [publishing, setPublishing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [country])

  async function loadData() {
    setLoading(true)

    // 1. Cohort Skill Map — top 15 skills by student frequency
    const { data: ssRows } = await supabase
      .from('student_skills')
      .select('skill_id, proficiency, skills(name)')

    const skillAgg: Record<string, { count: number; totalProf: number; name: string }> = {}
    for (const row of ssRows || []) {
      const s = row.skills as unknown as { name: string } | null
      if (!s?.name) continue
      if (!skillAgg[s.name]) skillAgg[s.name] = { count: 0, totalProf: 0, name: s.name }
      skillAgg[s.name].count++
      skillAgg[s.name].totalProf += (row.proficiency as number) || 0
    }
    const sorted = Object.values(skillAgg)
      .map(v => ({
        skill: v.name,
        count: v.count,
        pct: Math.round((v.count / TOTAL_STUDENTS) * 100),
        avgProficiency: v.count > 0 ? Math.round((v.totalProf / v.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
    setCohortSkills(sorted)

    // 2. Curriculum Gaps — latest evolution log entries with course names
    const { data: evoRows } = await supabase
      .from('curriculum_evolution_log')
      .select('generated_at, recommendations, course_id, courses(name)')
      .order('generated_at', { ascending: false })
      .limit(10)

    const evoEntries: EvolutionEntry[] = (evoRows || []).map((row: Record<string, unknown>) => {
      const c = row.courses as unknown as { name: string } | null
      return {
        courseName: c?.name || `Course ${row.course_id}`,
        generated_at: row.generated_at as string,
        recommendations: (row.recommendations as EvolutionRec[]) || [],
      }
    })
    setEvolutions(evoEntries)

    // 3. AI Orchestration Readiness — from learning_sessions
    const AI_SKILL_NAMES = [
      'AI Literacy', 'Machine Learning Engineering',
      'AI & Machine Learning', 'Data Engineering', 'MLOps & AI Deployment',
    ]
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('user_id, skills_demonstrated')

    let aiReadyCount = 0
    for (const sess of sessions || []) {
      const demonstrated = (sess.skills_demonstrated as unknown as (string | Record<string, string>)[]) || []
      const skillNames = demonstrated.map(d =>
        typeof d === 'string' ? d : (d as { name?: string }).name || ''
      )
      const hasAI = skillNames.some(name =>
        AI_SKILL_NAMES.some(ai => name.toLowerCase().includes(ai.toLowerCase()))
      )
      if (hasAI) aiReadyCount++
    }
    setAiReadyPct(TOTAL_STUDENTS > 0 ? Math.round((aiReadyCount / TOTAL_STUDENTS) * 100) : 0)

    // 4. Course Alignment — skills ranked by how many courses teach them
    const { data: csRows } = await supabase
      .from('course_skills')
      .select('coverage_level, skills(name)')

    const alignAgg: Record<string, { courseCount: number; masteredCount: number }> = {}
    for (const row of csRows || []) {
      const s = row.skills as unknown as { name: string } | null
      if (!s?.name) continue
      if (!alignAgg[s.name]) alignAgg[s.name] = { courseCount: 0, masteredCount: 0 }
      alignAgg[s.name].courseCount++
      if ((row.coverage_level as string) === 'mastered') alignAgg[s.name].masteredCount++
    }
    const alignSorted = Object.entries(alignAgg)
      .map(([skill, v]) => ({ skill, courseCount: v.courseCount, masteredCount: v.masteredCount }))
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 10)
    setCourseAlignment(alignSorted)

    setLoading(false)
  }

  async function publishEvolution() {
    setPublishing(true)
    try {
      const res = await fetch('/api/university/evolve-curriculum')
      const data = await res.json()
      if (data.evolved > 0) {
        await loadData()
      }
    } catch {}
    setPublishing(false)
  }

  return (
    <Shell country={country} activeTrack="faculty">
      <div className="px-6 md:px-12 pb-16 pt-12">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-8 h-px bg-primary block" />
            <span className="font-label text-[10px] tracking-ultra uppercase text-on-surface-variant">
              Faculty Intelligence
            </span>
          </div>
          <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
            Professor Dashboard
          </h1>
          <p className="font-body text-on-surface-variant text-lg mt-3">
            Architect your curriculum with live data on student skills, market demand, and AI readiness.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-64 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Cohort Skill Map */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Cohort Intelligence</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Cohort Skill Map</h2>
              <p className="font-body text-xs text-outline mb-4">{TOTAL_STUDENTS} students &middot; top 15 skills by frequency</p>

              {cohortSkills.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No student skill data available yet.</p>
              ) : (
                <div className="space-y-2">
                  {cohortSkills.map(s => (
                    <div key={s.skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-xs text-on-surface-variant truncate mr-2">{s.skill}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-body text-[9px] text-outline tabular-nums">{s.count} students</span>
                          <span className="font-headline text-xs font-bold text-primary tabular-nums">{s.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Curriculum Gaps — Latest Evolution Logs */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Curriculum Intelligence</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Curriculum Gaps</h2>

              <button onClick={publishEvolution} disabled={publishing}
                className="btn-primary w-full mb-6 disabled:opacity-50">
                {publishing ? 'Generating...' : 'Publish Today\'s Curriculum Evolution'}
              </button>

              {evolutions.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No evolutions generated yet. Click above to generate.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {evolutions.map((evo, idx) => (
                    <div key={idx} className="bg-surface-container p-4 ghost-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-headline text-sm font-bold text-primary">{evo.courseName}</span>
                        <span className="font-label text-[9px] uppercase tracking-widest text-outline">
                          {new Date(evo.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {(evo.recommendations || []).slice(0, 3).map((rec, i) => (
                        <div key={i} className="mb-3 pb-3" style={{ borderBottom: i < Math.min((evo.recommendations || []).length, 3) - 1 ? '1px solid rgba(71,71,71,0.15)' : 'none' }}>
                          <p className="font-headline text-xs font-bold text-on-surface">{rec.title}</p>
                          {rec.why_now && <p className="font-body text-xs text-outline mt-1 italic">{rec.why_now}</p>}
                          {rec.difficulty && (
                            <span className="inline-block mt-1 font-label text-[9px] uppercase tracking-widest px-2 py-0.5"
                              style={{
                                background: rec.difficulty === 'foundational' ? 'rgba(76,175,80,0.15)' : rec.difficulty === 'intermediate' ? 'rgba(33,150,243,0.15)' : 'rgba(255,193,7,0.15)',
                                color: rec.difficulty === 'foundational' ? '#4CAF50' : rec.difficulty === 'intermediate' ? '#2196F3' : '#FFC107',
                              }}>
                              {rec.difficulty}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. AI Orchestration Readiness */}
            <div className="bg-surface-container-low ghost-border p-6 flex flex-col items-center justify-center text-center">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">AI Readiness</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-6">AI Orchestration Readiness</h2>

              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(71,71,71,0.3)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={aiReadyPct >= 60 ? '#4CAF50' : aiReadyPct >= 30 ? '#FFC107' : '#F44336'}
                    strokeWidth="4" strokeDasharray={`${aiReadyPct * 2.64} 264`} strokeLinecap="butt" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1" strokeDasharray="2 262" strokeDashoffset={`${-60 * 2.64}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline text-3xl font-bold text-primary">{aiReadyPct}%</span>
                </div>
              </div>

              <p className="font-body text-sm text-on-surface-variant">of cohort is AI orchestration ready</p>
              <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-2">Target: 60%</p>
              <p className="font-body text-[10px] text-outline mt-3">
                Based on {TOTAL_STUDENTS} students demonstrating AI Literacy, ML Engineering, Data Engineering, or MLOps skills
              </p>
            </div>

            {/* 4. Course Alignment */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Curriculum Coverage</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Course Alignment</h2>
              <p className="font-body text-xs text-outline mb-4">Skills ranked by how many courses teach them</p>

              {courseAlignment.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No course-skill mappings found.</p>
              ) : (
                <div className="space-y-2">
                  {courseAlignment.map((ca, i) => (
                    <div key={ca.skill} className="flex items-center gap-3 py-1.5" style={{ borderBottom: '1px solid rgba(71,71,71,0.1)' }}>
                      <span className="font-headline text-xs font-bold text-outline tabular-nums w-5 shrink-0">{i + 1}</span>
                      <span className="font-body text-xs text-on-surface-variant flex-1 truncate">{ca.skill}</span>
                      <span className="font-headline text-xs font-bold text-primary tabular-nums shrink-0">{ca.courseCount} courses</span>
                      {ca.masteredCount > 0 && (
                        <span className="font-label text-[8px] uppercase tracking-widest px-1.5 py-0.5 shrink-0"
                          style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
                          {ca.masteredCount} mastered
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
