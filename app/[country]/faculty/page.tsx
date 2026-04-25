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
  sources?: { year: number; publication: string; doi_or_url: string; confidence: string; freshness_signal: string }[]
}

interface EvolutionEntry {
  id: string
  courseName: string
  generated_at: string
  recommendations: EvolutionRec[]
  freshnessScore: number | null
  facultyApproved: boolean
}

interface CourseAlignment {
  skill: string
  courseCount: number
  masteredCount: number
}

interface Experiment {
  id: string
  name: string
  hypothesis: string
  metric: string
  status: string
  current_value: number
  target_value: number
  promote_threshold: number
  rollback_threshold: number
  outcome_log: { value: number; note: string; recorded_at: string }[]
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
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [publishing, setPublishing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [expName, setExpName] = useState('')
  const [expHypothesis, setExpHypothesis] = useState('')
  const [expMetric, setExpMetric] = useState('employment_velocity')
  const [expCreating, setExpCreating] = useState(false)
  const [measureValue, setMeasureValue] = useState('')
  const [measureNote, setMeasureNote] = useState('')

  useEffect(() => {
    loadData()
  }, [country])

  async function loadData() {
    setLoading(true)

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

    const { data: evoRows } = await supabase
      .from('curriculum_evolution_log')
      .select('id, generated_at, recommendations, course_id, freshness_score, faculty_approved, courses(name)')
      .order('generated_at', { ascending: false })
      .limit(10)

    const evoEntries: EvolutionEntry[] = (evoRows || []).map((row: Record<string, unknown>) => {
      const c = row.courses as unknown as { name: string } | null
      return {
        id: row.id as string,
        courseName: c?.name || `Course ${row.course_id}`,
        generated_at: row.generated_at as string,
        recommendations: (row.recommendations as EvolutionRec[]) || [],
        freshnessScore: (row.freshness_score as number) ?? null,
        facultyApproved: (row.faculty_approved as boolean) || false,
      }
    })
    setEvolutions(evoEntries)

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

    try {
      const expRes = await fetch(`/api/experiments?country=${country}`)
      const expData = await expRes.json()
      setExperiments(Array.isArray(expData) ? expData : [])
    } catch {
      setExperiments([])
    }

    setLoading(false)
  }

  async function publishEvolution() {
    setPublishing(true)
    try {
      const res = await fetch('/api/university/evolve-curriculum')
      const data = await res.json()
      if (data.evolved > 0) await loadData()
    } catch {}
    setPublishing(false)
  }

  async function approveEvolution(id: string) {
    try {
      await fetch(`/api/university/curriculum-evidence/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'faculty' }),
      })
      await loadData()
    } catch {}
  }

  async function createExperiment() {
    if (!expName || !expHypothesis) return
    setExpCreating(true)
    try {
      await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: expName,
          hypothesis: expHypothesis,
          metric: expMetric,
          target_value: 70,
          promote_threshold: 80,
          rollback_threshold: 30,
          country,
        }),
      })
      setExpName('')
      setExpHypothesis('')
      await loadData()
    } catch {}
    setExpCreating(false)
  }

  async function activateExperiment(id: string) {
    try {
      await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      await loadData()
    } catch {}
  }

  async function logMeasurement(id: string) {
    const val = parseFloat(measureValue)
    if (isNaN(val)) return
    try {
      await fetch(`/api/experiments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val, note: measureNote }),
      })
      setMeasureValue('')
      setMeasureNote('')
      await loadData()
    } catch {}
  }

  const statusColor = (s: string) => {
    if (s === 'promoted') return { bg: 'rgba(76,175,80,0.15)', color: '#4CAF50' }
    if (s === 'rolled_back') return { bg: 'rgba(244,67,54,0.15)', color: '#F44336' }
    if (s === 'active') return { bg: 'rgba(33,150,243,0.15)', color: '#2196F3' }
    return { bg: 'rgba(158,158,158,0.15)', color: '#9E9E9E' }
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

            {/* 2. Curriculum Gaps with Evidence Viewer */}
            <div className="bg-surface-container-low ghost-border p-6">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Curriculum Intelligence</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Curriculum Evidence</h2>

              <button onClick={publishEvolution} disabled={publishing}
                className="btn-primary w-full mb-6 disabled:opacity-50">
                {publishing ? 'Generating...' : 'Publish Today\'s Curriculum Evolution'}
              </button>

              {evolutions.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No evolutions generated yet. Click above to generate.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {evolutions.map((evo) => (
                    <div key={evo.id} className="bg-surface-container p-4 ghost-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-headline text-sm font-bold text-primary">{evo.courseName}</span>
                        <div className="flex items-center gap-2">
                          {evo.freshnessScore !== null && (
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-1 bg-surface-container-high overflow-hidden">
                                <div className="h-full" style={{
                                  width: `${Math.round(evo.freshnessScore * 100)}%`,
                                  background: evo.freshnessScore >= 0.7 ? '#4CAF50' : evo.freshnessScore >= 0.4 ? '#FFC107' : '#F44336',
                                }} />
                              </div>
                              <span className="font-body text-[9px] text-outline">{Math.round(evo.freshnessScore * 100)}%</span>
                            </div>
                          )}
                          <span className="font-label text-[8px] uppercase tracking-widest px-1.5 py-0.5" style={{
                            background: evo.facultyApproved ? 'rgba(76,175,80,0.15)' : 'rgba(255,193,7,0.15)',
                            color: evo.facultyApproved ? '#4CAF50' : '#FFC107',
                          }}>
                            {evo.facultyApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <span className="font-label text-[9px] uppercase tracking-widest text-outline">
                        {new Date(evo.generated_at).toLocaleDateString()}
                      </span>

                      {(evo.recommendations || []).slice(0, 2).map((rec, i) => (
                        <div key={i} className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(71,71,71,0.1)' }}>
                          <p className="font-headline text-xs font-bold text-on-surface">{rec.title}</p>
                          {rec.authors && <p className="font-body text-[10px] text-outline">{rec.authors}</p>}
                          {rec.why_now && <p className="font-body text-[10px] text-outline italic mt-1">{rec.why_now}</p>}
                          {rec.sources && rec.sources.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {rec.sources.map((src, si) => (
                                <div key={si} className="flex items-center gap-2">
                                  <span className="font-body text-[9px] text-on-surface-variant">{src.publication} ({src.year})</span>
                                  <span className="font-label text-[8px] uppercase px-1" style={{
                                    background: src.confidence === 'high' ? 'rgba(76,175,80,0.15)' : src.confidence === 'medium' ? 'rgba(255,193,7,0.15)' : 'rgba(244,67,54,0.15)',
                                    color: src.confidence === 'high' ? '#4CAF50' : src.confidence === 'medium' ? '#FFC107' : '#F44336',
                                  }}>{src.confidence}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {!evo.facultyApproved && (
                        <button onClick={() => approveEvolution(evo.id)}
                          className="mt-3 font-label text-[10px] uppercase tracking-widest px-3 py-1 ghost-border hover:bg-surface-container-high transition-colors text-primary">
                          Approve Evidence
                        </button>
                      )}
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
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline text-3xl font-bold text-primary">{aiReadyPct}%</span>
                </div>
              </div>

              <p className="font-body text-sm text-on-surface-variant">of cohort is AI orchestration ready</p>
              <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-2">Target: 60%</p>
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

            {/* 5. Policy Experiment Lab */}
            <div className="bg-surface-container-low ghost-border p-6 md:col-span-2">
              <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Policy Lab</div>
              <h2 className="font-headline text-headline-lg font-bold text-primary mb-4">Experiment Engine</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input value={expName} onChange={(e) => setExpName(e.target.value)} placeholder="Experiment name"
                  className="bg-surface-container ghost-border px-3 py-2 font-body text-sm text-on-surface" />
                <input value={expHypothesis} onChange={(e) => setExpHypothesis(e.target.value)} placeholder="Hypothesis"
                  className="bg-surface-container ghost-border px-3 py-2 font-body text-sm text-on-surface" />
                <div className="flex gap-2">
                  <select value={expMetric} onChange={(e) => setExpMetric(e.target.value)}
                    className="flex-1 bg-surface-container ghost-border px-3 py-2 font-body text-sm text-on-surface">
                    <option value="employment_velocity">Employment Velocity</option>
                    <option value="mastery_gain">Mastery Gain</option>
                    <option value="dropout_risk">Dropout Risk</option>
                    <option value="ai_orchestration_score">AI Orchestration Score</option>
                  </select>
                  <button onClick={createExperiment} disabled={expCreating || !expName}
                    className="btn-primary px-4 disabled:opacity-50 shrink-0">
                    {expCreating ? '...' : 'Create'}
                  </button>
                </div>
              </div>

              {experiments.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">No experiments yet. Create one above.</p>
              ) : (
                <div className="space-y-3">
                  {experiments.map((exp) => {
                    const sc = statusColor(exp.status)
                    return (
                      <div key={exp.id} className="bg-surface-container p-4 ghost-border">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-headline text-sm font-bold text-on-surface">{exp.name}</span>
                            <span className="font-label text-[8px] uppercase tracking-widest px-1.5 py-0.5 ml-2" style={{ background: sc.bg, color: sc.color }}>{exp.status}</span>
                          </div>
                          <span className="font-body text-xs text-outline">{exp.metric}</span>
                        </div>
                        <p className="font-body text-xs text-on-surface-variant mb-3">{exp.hypothesis}</p>

                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1">
                            <div className="h-2 bg-surface-container-high overflow-hidden relative">
                              <div className="absolute h-full bg-red-500 opacity-20" style={{ left: 0, width: `${exp.rollback_threshold}%` }} />
                              <div className="absolute h-full bg-green-500 opacity-20" style={{ left: `${exp.promote_threshold}%`, width: `${100 - exp.promote_threshold}%` }} />
                              <div className="h-full bg-primary relative z-10" style={{ width: `${Math.min(100, exp.current_value)}%` }} />
                            </div>
                          </div>
                          <span className="font-headline text-sm font-bold text-primary tabular-nums">{exp.current_value}%</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-outline font-body mb-3">
                          <span>Rollback: {exp.rollback_threshold}%</span>
                          <span>Target: {exp.target_value}%</span>
                          <span>Promote: {exp.promote_threshold}%</span>
                        </div>

                        {exp.status === 'draft' && (
                          <button onClick={() => activateExperiment(exp.id)}
                            className="font-label text-[10px] uppercase tracking-widest px-3 py-1 ghost-border hover:bg-surface-container-high transition-colors text-primary">
                            Activate
                          </button>
                        )}

                        {exp.status === 'active' && (
                          <div className="flex gap-2 mt-2">
                            <input type="number" value={measureValue} onChange={(e) => setMeasureValue(e.target.value)} placeholder="Value"
                              className="w-20 bg-surface-container-high ghost-border px-2 py-1 font-body text-xs text-on-surface" />
                            <input value={measureNote} onChange={(e) => setMeasureNote(e.target.value)} placeholder="Note"
                              className="flex-1 bg-surface-container-high ghost-border px-2 py-1 font-body text-xs text-on-surface" />
                            <button onClick={() => logMeasurement(exp.id)}
                              className="font-label text-[10px] uppercase tracking-widest px-3 py-1 ghost-border hover:bg-surface-container-high transition-colors text-primary">
                              Log
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
