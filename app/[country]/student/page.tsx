'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import RoleSelector from '@/components/layout/RoleSelector'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
  uk: '#1a3a6b',
}

const EMPLOYERS: Record<string, Record<string, string[]>> = {
  saudi: {
    'Technology': ['Aramco Digital', 'STC', 'NEOM', 'Saudi Data & AI Authority', 'stc Pay'],
    'Finance': ['Saudi National Bank', 'Riyad Bank', 'STC Pay', 'Tamara'],
    'Energy': ['Saudi Aramco', 'ACWA Power', 'Saudi Electricity Company'],
    'Health': ['Saudi German Hospital', 'Dr. Sulaiman Al Habib', 'National Guard Health Affairs'],
  },
  malta: {
    'Digital': ['Betsson', 'Tipico', 'Evolution Gaming', 'Datatrak', 'GO plc'],
    'Gaming': ['Betsson', 'LeoVegas', 'GiG', 'Evolution Gaming'],
    'Finance': ['Bank of Valletta', 'HSBC Malta', 'Calamatta Cuschieri'],
    'Maritime': ['Malta Freeport', 'Medserv', 'Boskalis Malta'],
  },
  uk: {
    'AI and Machine Learning': ['DeepMind', 'Wayve', 'Stability AI', 'Graphcore', 'Arm'],
    'Cybersecurity': ['BAE Systems', 'NCSC', 'Darktrace', 'BT Security', 'CrowdStrike UK'],
    'Cloud and Infrastructure': ['AWS UK', 'Microsoft UK', 'Google UK', 'IBM UK'],
    'Data Science and Analytics': ['ONS', 'NHS Digital', 'Palantir UK', 'Faculty AI', 'Quantexa'],
    'Health and Public Sector AI': ['NHS', 'Faculty AI', 'Sensyne Health', 'Babylon'],
  },
}

interface Profile {
  name: string | null
  career_stage: string
  education_level: string
  education_field: string
  explicit_skills: string[]
  inferred_skills: string[]
  inferred_interests: string[]
  strongest_dimensions: string[]
  vision_alignment_signals: string[]
  summary: string
  suggested_sectors: string[]
  career_trajectory: string
}

interface Certification {
  name: string
  url: string
  free: boolean
  duration: string
}

interface CareerMatch {
  title: string
  sector: string
  match_percent: number
  why_you_fit: string
  matching_skills: string[]
  skills_to_develop: string[]
  realistic_gap_months: number
  salary: number | null
  currency: string
  open_roles: number
  vision_priority: string
  gap_years: number
  certifications: Certification[]
}

type Step = 1 | 2 | 3 | 4

export default function StudentDashboard() {
  const params = useParams()
  const country = (params.country as string) || 'saudi'
  const accent = ACCENT[country] || '#C9A84C'

  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editedSummary, setEditedSummary] = useState('')
  const [confirmedSkills, setConfirmedSkills] = useState<Set<string>>(new Set())
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([])
  const [identityStatement, setIdentityStatement] = useState('')
  const [expandedCareer, setExpandedCareer] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const progressPct = (step / 4) * 100

  function toggleSkill(skill: string) {
    setConfirmedSkills(prev => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  async function handleAnalyse() {
    if (!file) return
    setLoading(true)
    setError('')
    setLoadingMsg('Reading your CV...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('context', context)
      fd.append('country', country)
      const res = await fetch('/api/students/parse-resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error && !data.profile?.summary) {
        setError(data.error || 'Could not read file')
        setLoading(false)
        return
      }
      const p: Profile = data.profile
      setProfile(p)
      setEditedSummary(p.summary)
      const allSkills = new Set([...p.explicit_skills, ...p.inferred_skills])
      setConfirmedSkills(allSkills)
      setStep(2)
    } catch {
      setError('Something went wrong — please try again.')
    }
    setLoading(false)
  }

  async function handleMatch() {
    if (!profile) return
    setLoading(true)
    setLoadingMsg('Matching your profile to Vision careers...')
    const patchedProfile = { ...profile, summary: editedSummary, explicit_skills: Array.from(confirmedSkills) }
    try {
      const res = await fetch('/api/students/match-careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: patchedProfile, country }),
      })
      const data = await res.json()
      setCareerMatches(data.matches || [])
      setStep(3)
    } catch {
      setCareerMatches([])
      setStep(3)
    }
    setLoading(false)
  }

  async function handleIdentity() {
    if (!profile || careerMatches.length === 0) return
    setLoading(true)
    setLoadingMsg('Crafting your Career Identity Statement...')
    try {
      const top = careerMatches[0]
      const res = await fetch('/api/students/identity-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: Array.from(confirmedSkills).slice(0, 6).map(s => ({ skill: s })),
          topCareer: top,
          background: editedSummary,
          country,
        }),
      })
      const data = await res.json()
      setIdentityStatement(data.statement || '')
      setStep(4)
      fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          sector_interest: profile.suggested_sectors?.[0],
          self_assessed_skills: Array.from(confirmedSkills).map(s => ({ skill: s })),
          vision_aligned_careers: careerMatches.slice(0, 3),
        }),
      }).catch(() => {})
    } catch {
      setIdentityStatement('Unable to generate statement at this time.')
      setStep(4)
    }
    setLoading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.size <= 5 * 1024 * 1024) setFile(dropped)
  }

  function reset() {
    setStep(1); setFile(null); setContext(''); setProfile(null)
    setEditedSummary(''); setConfirmedSkills(new Set()); setCareerMatches([])
    setIdentityStatement(''); setExpandedCareer(null); setError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <RoleSelector role="Student" accentColor={accent} />
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="flex gap-2 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ backgroundColor: accent, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-gray-500 text-sm">{loadingMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <RoleSelector role="Student" accentColor={accent} />

      {/* Progress */}
      <div className="px-8 pt-5">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: accent }} />
        </div>
        <p className="text-xs text-gray-400 mt-2" style={{ letterSpacing: '0.3px' }}>
          STEP {step} OF 4
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <div>
            <h1 className="font-display text-[28px] text-gray-900">Upload your CV</h1>
            <p className="text-gray-400 text-[15px] mt-2 leading-relaxed">
              We read your CV and build your career profile automatically. No chips to select. No boxes to fill.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="mt-8 border-2 border-dashed rounded-xl p-10 text-center transition-colors"
              style={{ borderColor: dragOver ? accent : '#E2E5EB', backgroundColor: dragOver ? `${accent}08` : '#FAFAFA' }}
            >
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  <button onClick={() => setFile(null)}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-3">📄</div>
                  <p className="text-sm text-gray-500">Drag and drop your CV here</p>
                  <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max 5 MB</p>
                  <label className="mt-4 inline-block cursor-pointer px-5 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ borderColor: accent, color: accent }}>
                    Browse file
                    <input type="file" accept=".pdf,.docx" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) setFile(f) }} />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-500 mb-2">
                Anything you want us to know? <span className="text-gray-300">(optional)</span>
              </label>
              <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                placeholder="e.g. I am switching careers from finance to tech, or I am particularly interested in AI..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none" />
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button onClick={handleAnalyse} disabled={!file}
              className="mt-8 w-full py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-30"
              style={{ backgroundColor: accent }}>
              Analyse my CV →
            </button>
            <p className="text-xs text-gray-300 text-center mt-3">
              Your CV is processed to extract your profile and is not stored on our servers.
            </p>
          </div>
        )}

        {/* ── STEP 2: Review Profile ── */}
        {step === 2 && profile && (
          <div>
            <h1 className="font-display text-[28px] text-gray-900">
              {profile.name ? `Here's your profile, ${profile.name}` : 'Here is your profile'}
            </h1>
            <p className="text-gray-400 text-[15px] mt-2">
              Review what we found. Edit the summary, deselect any skills that don&apos;t fit.
            </p>

            {/* Summary */}
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2"
                style={{ letterSpacing: '0.3px' }}>Summary</p>
              <textarea value={editedSummary} onChange={e => setEditedSummary(e.target.value)} rows={4}
                className="w-full border-l-2 pl-4 py-2 text-sm text-gray-700 bg-transparent focus:outline-none resize-none italic leading-relaxed"
                style={{ borderColor: accent }} />
            </div>

            {/* Strongest dimensions */}
            {profile.strongest_dimensions.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2"
                  style={{ letterSpacing: '0.3px' }}>Strongest dimensions</p>
                <div className="flex flex-wrap gap-2">
                  {profile.strongest_dimensions.map(d => (
                    <span key={d} className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: accent }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2"
                style={{ letterSpacing: '0.3px' }}>Skills — deselect any that don&apos;t fit</p>

              {profile.explicit_skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-300 mb-1.5">From your CV</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.explicit_skills.map(s => {
                      const on = confirmedSkills.has(s)
                      return (
                        <button key={s} onClick={() => toggleSkill(s)}
                          className="px-3 py-1.5 rounded-full text-xs transition-all"
                          style={{
                            border: `1.5px solid ${on ? '#16A34A' : '#E2E5EB'}`,
                            backgroundColor: on ? '#F0FDF4' : '#F9FAFB',
                            color: on ? '#15803D' : '#9CA3AF',
                            textDecoration: on ? 'none' : 'line-through',
                          }}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {profile.inferred_skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-300 mb-1.5">Inferred from your background</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.inferred_skills.map(s => {
                      const on = confirmedSkills.has(s)
                      return (
                        <button key={s} onClick={() => toggleSkill(s)}
                          className="px-3 py-1.5 rounded-full text-xs transition-all"
                          style={{
                            border: `1.5px solid ${on ? '#D97706' : '#E2E5EB'}`,
                            backgroundColor: on ? '#FFFBEB' : '#F9FAFB',
                            color: on ? '#B45309' : '#9CA3AF',
                            textDecoration: on ? 'none' : 'line-through',
                          }}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sectors */}
            {profile.suggested_sectors.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2"
                  style={{ letterSpacing: '0.3px' }}>Best-fit sectors</p>
                <div className="flex flex-wrap gap-2">
                  {profile.suggested_sectors.map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-full text-xs border border-gray-200 text-gray-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-10">
              <button onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                ← Back
              </button>
              <button onClick={handleMatch} disabled={confirmedSkills.size === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-30"
                style={{ backgroundColor: accent }}>
                Find my career matches →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Career Matches ── */}
        {step === 3 && (
          <div>
            <h1 className="font-display text-[28px] text-gray-900">Career matches</h1>
            <p className="text-gray-400 text-[15px] mt-2">
              Ranked by fit to your profile — not generic job descriptions.
            </p>

            <div className="space-y-4 mt-8">
              {careerMatches.map(career => {
                const expanded = expandedCareer === career.title
                const freeCert = career.certifications?.find(c => c.free)
                const paidCerts = career.certifications?.filter(c => !c.free) || []
                const employers = (EMPLOYERS[country] || {})[career.sector] || []
                const salaryDisplay = career.salary
                  ? `${career.currency} ${Number(career.salary).toLocaleString()}/yr`
                  : null

                return (
                  <div key={career.title} className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{career.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5" style={{ letterSpacing: '0.3px' }}>
                            {(career.sector || '').toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
                            {career.match_percent}%
                          </span>
                          <p className="text-xs text-gray-400">fit</p>
                        </div>
                      </div>

                      {/* Match bar */}
                      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${career.match_percent}%`, backgroundColor: accent }} />
                      </div>

                      <p className="mt-4 text-sm text-gray-600 leading-[1.65]">{career.why_you_fit}</p>

                      <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-gray-500">
                        <div>
                          <p className="font-medium tabular-nums text-gray-700">
                            {career.realistic_gap_months || Math.round((career.gap_years || 2) * 12)} mo
                          </p>
                          <p className="text-gray-400">to close gap</p>
                        </div>
                        {salaryDisplay && (
                          <div>
                            <p className="font-medium tabular-nums text-gray-700">{salaryDisplay}</p>
                            <p className="text-gray-400">median salary</p>
                          </div>
                        )}
                        <div>
                          <p className="font-medium tabular-nums text-gray-700">
                            {(career.open_roles || 0).toLocaleString()}
                          </p>
                          <p className="text-gray-400">open roles</p>
                        </div>
                      </div>

                      <button onClick={() => setExpandedCareer(expanded ? null : career.title)}
                        className="mt-4 text-xs font-medium transition-colors"
                        style={{ color: accent }}>
                        {expanded ? 'Hide details ↑' : 'See certification path ↓'}
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-gray-50 p-5 bg-gray-50/50 space-y-5">
                        {/* Skills */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2"
                              style={{ letterSpacing: '0.3px' }}>Skills you have</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(career.matching_skills || []).map(s => (
                                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2"
                              style={{ letterSpacing: '0.3px' }}>Skills to build</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(career.skills_to_develop || []).map(s => (
                                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Certification pipeline */}
                        {career.certifications?.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-3"
                              style={{ letterSpacing: '0.3px' }}>Certification pipeline</p>
                            <div className="space-y-2">
                              {freeCert && (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide shrink-0">Free</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-emerald-800 truncate">{freeCert.name}</p>
                                    <p className="text-xs text-emerald-600">{freeCert.duration}</p>
                                  </div>
                                  <a href={freeCert.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-emerald-700 hover:underline shrink-0">
                                    Start →
                                  </a>
                                </div>
                              )}
                              {paidCerts.slice(0, 2).map((cert, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wide shrink-0">Paid</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{cert.name}</p>
                                    <p className="text-xs text-gray-400">{cert.duration}</p>
                                  </div>
                                  <a href={cert.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-gray-400 hover:text-gray-600 hover:underline shrink-0">
                                    View →
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Employers */}
                        {employers.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2"
                              style={{ letterSpacing: '0.3px' }}>Who&apos;s hiring</p>
                            <div className="flex flex-wrap gap-2">
                              {employers.slice(0, 4).map(e => (
                                <span key={e} className="px-2.5 py-1 rounded text-xs bg-white border border-gray-200 text-gray-600">
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {careerMatches.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No career matches found — try adjusting your profile.</p>
              )}
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                ← Back
              </button>
              <button onClick={handleIdentity} disabled={careerMatches.length === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-30"
                style={{ backgroundColor: accent }}>
                Generate my Career Identity →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Identity Statement + 90-day Plan ── */}
        {step === 4 && (
          <div>
            <h1 className="font-display text-[28px] text-gray-900">Your Career Identity Statement</h1>
            <p className="text-gray-400 text-[15px] mt-2">
              Use this on your CV, LinkedIn, or in interviews.
            </p>

            <blockquote className="mt-8 p-6 rounded-lg italic text-lg leading-[1.7] text-gray-800"
              style={{ borderLeft: `3px solid ${accent}`, backgroundColor: `${accent}06` }}>
              {identityStatement}
            </blockquote>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => { navigator.clipboard.writeText(identityStatement); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: accent }}>
                {copied ? 'Copied ✓' : 'Copy statement'}
              </button>
              <button onClick={reset}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                Start again
              </button>
            </div>

            {/* 90-day action plan */}
            {careerMatches.length > 0 && (() => {
              const top = careerMatches[0]
              const freeCert = top.certifications?.find(c => c.free)
              const paidCert = top.certifications?.find(c => !c.free)
              const employers = (EMPLOYERS[country] || {})[top.sector] || []

              return (
                <div className="mt-10">
                  <h2 className="font-display text-xl text-gray-900 mb-6">Your 90-Day Action Plan</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: accent }}>
                        Mo 1
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-800 text-sm">Start free certification</p>
                        {freeCert ? (
                          <p className="text-sm text-gray-500 mt-1 leading-[1.65]">
                            Begin <a href={freeCert.url} target="_blank" rel="noopener noreferrer"
                              className="underline" style={{ color: accent }}>{freeCert.name}</a> — {freeCert.duration}. No cost, immediate signal of intent on LinkedIn.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Find a free introductory course in {top.skills_to_develop?.[0] || top.sector}.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: accent }}>
                        Mo 2–3
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-800 text-sm">Add paid credential</p>
                        {paidCert ? (
                          <p className="text-sm text-gray-500 mt-1 leading-[1.65]">
                            Enrol in <a href={paidCert.url} target="_blank" rel="noopener noreferrer"
                              className="underline" style={{ color: accent }}>{paidCert.name}</a> — {paidCert.duration}. This is the credential {top.title} hiring managers look for.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Research industry-recognised certifications for {top.sector}.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: accent }}>
                        Mo 3+
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-800 text-sm">Apply with real employers</p>
                        <p className="text-sm text-gray-500 mt-1 leading-[1.65]">
                          {employers.length > 0
                            ? `Target: ${employers.slice(0, 3).join(', ')}. These employers actively recruit for ${top.title} roles in ${country === 'saudi' ? 'Vision 2030' : country === 'uk' ? 'the UK AI Action Plan' : 'Vision 2050'}.`
                            : `Search for ${top.title} roles aligned with ${top.sector}.`
                          }
                        </p>
                        <a
                          href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(top.title)}&location=${encodeURIComponent(country === 'saudi' ? 'Saudi Arabia' : country === 'uk' ? 'United Kingdom' : 'Malta')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs font-medium underline"
                          style={{ color: accent }}>
                          Search {top.title} on LinkedIn →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

      </div>
    </div>
  )
}
