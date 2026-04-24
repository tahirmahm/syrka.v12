'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { createClient } from '@/lib/supabase'

interface SkillCount {
  skill: string
  count: number
  pct: number
}

interface EvolutionRec {
  title: string
  authors: string
  why_now: string
  esco_skills: string[]
  difficulty: string
}

interface EvolutionLog {
  id: string
  course_id: string
  recommendations: EvolutionRec[]
  generated_at: string
}

export default function FacultyDashboard() {
  const params = useParams()
  const country = (params.country as string) || 'saudi'
  const supabase = createClient()

  const [cohortSkills, setCohortSkills] = useState<SkillCount[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [curriculumSkills, setCurriculumSkills] = useState<string[]>([])
  const [marketGaps, setMarketGaps] = useState<string[]>([])
  const [aiReadyPct, setAiReadyPct] = useState(0)
  const [evolutions, setEvolutions] = useState<EvolutionLog[]>([])
  const [publishing, setPublishing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [country])

  async function loadData() {
    setLoading(true)

    // Section A: Cohort Skill Map
    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('self_assessed_skills')
      .eq('country', country)

    const skillMap: Record<string, number> = {}
    const profileCount = profiles?.length || 0
    setTotalStudents(profileCount)

    for (const p of profiles || []) {
      const skills = (p.self_assessed_skills as Array<{ skill: string }>) || []
      for (const s of skills) {
        if (s.skill) skillMap[s.skill] = (skillMap[s.skill] || 0) + 1
      }
    }

    const sorted = Object.entries(skillMap)
      .map(([skill, count]) => ({
        skill,
        count,
        pct: profileCount > 0 ? Math.round((count / profileCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
    setCohortSkills(sorted)

    // Section B: Curriculum skills from course_skills
    const { data: courseSkills } = await supabase
      .from('course_skills')
      .select('skill_id, skills(name)')
      .limit(100)

    const currSkills = Array.from(new Set(
      (courseSkills || [])
        .map((cs: Record<string, unknown>) => {
          const s = cs.skills as { name: string } | null
          return s?.name
        })
        .filter(Boolean) as string[]
    ))
    setCurriculumSkills(currSkills)

    // Market demanded skills (from sectors table if available, else static)
    const MARKET_DEMANDED = [
      'Machine Learning', 'Data Analysis', 'Cloud Computing', 'Cybersecurity',
      'AI Systems', 'Project Management', 'Digital Transformation', 'Python',
      'Statistical Analysis', 'UX Design', 'DevOps', 'Blockchain',
    ]
    const gaps = MARKET_DEMANDED.filter(
      d => !currSkills.some(c => c.toLowerCase().includes(d.toLowerCase()))
    )
    setMarketGaps(gaps)

    // Section C: AI Orchestration Readiness from moodle_courses
    const { data: moodleCourses } = await supabase
      .from('moodle_courses')
      .select('extracted_skills')

    let aiReady = 0
    const totalMoodle = moodleCourses?.length || 0
    const AI_KEYWORDS = ['ai', 'machine learning', 'deep learning', 'neural', 'automation', 'data science', 'python']
    for (const mc of moodleCourses || []) {
      const skills = (mc.extracted_skills as string[]) || []
      const hasAI = skills.some(s => AI_KEYWORDS.some(k => s.toLowerCase().includes(k)))
      if (hasAI) aiReady++
    }
    setAiReadyPct(totalMoodle > 0 ? Math.round((aiReady / totalMoodle) * 100) : 0)

    // Section D: Load existing evolutions
    const { data: evoLogs } = await supabase
      .from('curriculum_evolution_log')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10)
    setEvolutions((evoLogs || []) as EvolutionLog[])

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

            {/* Section A: Cohort Skill Map */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Section A</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Cohort Skill Map</h2>
              <p className="font-body text-xs text-outline mb-4">{totalStudents} student profiles analysed</p>

              {cohortSkills.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No student skill data available yet.</p>
              ) : (
                <div className="space-y-2">
                  {cohortSkills.map(s => (
                    <div key={s.skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-xs text-on-surface-variant truncate mr-2">{s.skill}</span>
                        <span className="font-headline text-xs font-bold text-primary tabular-nums shrink-0">{s.pct}%</span>
                      </div>
                      <div className="h-px bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Curriculum Gaps vs Market */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Section B</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Curriculum vs Market</h2>

              <div className="mb-4">
                <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Your curriculum produces</p>
                <div className="flex flex-wrap gap-1.5">
                  {curriculumSkills.slice(0, 8).map(s => (
                    <span key={s} className="data-chip text-[9px]">{s}</span>
                  ))}
                  {curriculumSkills.length > 8 && (
                    <span className="font-body text-xs text-outline">+{curriculumSkills.length - 8} more</span>
                  )}
                  {curriculumSkills.length === 0 && (
                    <span className="font-body text-xs text-outline">No course-skill mappings found</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Market demands (gap)</p>
                <div className="flex flex-wrap gap-1.5">
                  {marketGaps.map(g => (
                    <span key={g} className="font-label text-xs px-2.5 py-1 uppercase tracking-wider"
                      style={{ border: '1px solid rgba(244,67,54,0.4)', color: '#F44336' }}>
                      {g}
                    </span>
                  ))}
                  {marketGaps.length === 0 && (
                    <span className="font-body text-xs text-primary">Full alignment achieved</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section C: AI Orchestration Readiness */}
            <div className="bg-surface-container-low ghost-border p-6 flex flex-col items-center justify-center text-center">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Section C</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-6">AI Orchestration Readiness</h2>

              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(71,71,71,0.3)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={aiReadyPct >= 60 ? '#4CAF50' : aiReadyPct >= 30 ? '#FFC107' : '#F44336'}
                    strokeWidth="4" strokeDasharray={`${aiReadyPct * 2.64} 264`} strokeLinecap="butt" />
                  {/* Target line at 60% */}
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1" strokeDasharray="2 262" strokeDashoffset={`${-60 * 2.64}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline text-3xl font-bold text-primary">{aiReadyPct}%</span>
                </div>
              </div>

              <p className="font-body text-sm text-on-surface-variant">of cohort is AI orchestration ready</p>
              <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-2">Target: 60%</p>
            </div>

            {/* Section D: Publish Evolution */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Section D</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Curriculum Evolution</h2>

              <button onClick={publishEvolution} disabled={publishing}
                className="btn-primary w-full mb-6 disabled:opacity-50">
                {publishing ? 'Generating...' : 'Publish Today\'s Curriculum Evolution'}
              </button>

              {evolutions.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No evolutions generated yet. Click above to generate.</p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {evolutions.map(evo => (
                    <div key={evo.id} className="bg-surface-container p-4 ghost-border">
                      <p className="font-label text-label-sm uppercase tracking-widest text-outline mb-3">
                        {new Date(evo.generated_at).toLocaleDateString()}
                      </p>
                      {(evo.recommendations || []).map((rec, i) => (
                        <div key={i} className="mb-3 pb-3" style={{ borderBottom: i < (evo.recommendations || []).length - 1 ? '1px solid rgba(71,71,71,0.15)' : 'none' }}>
                          <p className="font-headline text-sm font-bold text-primary">{rec.title}</p>
                          <p className="font-body text-xs text-on-surface-variant mt-1">{rec.authors}</p>
                          <p className="font-body text-xs text-outline mt-1 italic">{rec.why_now}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5"
                              style={{
                                background: rec.difficulty === 'foundational' ? 'rgba(76,175,80,0.15)' : rec.difficulty === 'intermediate' ? 'rgba(33,150,243,0.15)' : 'rgba(255,193,7,0.15)',
                                color: rec.difficulty === 'foundational' ? '#4CAF50' : rec.difficulty === 'intermediate' ? '#2196F3' : '#FFC107',
                              }}>
                              {rec.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
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
