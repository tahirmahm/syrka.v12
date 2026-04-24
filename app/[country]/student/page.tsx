'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

declare const chrome: { runtime?: { sendMessage: (id: string, msg: unknown) => void } } | undefined

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

interface OfferEvaluation {
  dimensions: Array<{ name: string; score: number; weight: number; rationale: string }>
  overall_score: number
  grade: string
  verdict: string
  negotiation_points: string[]
  key_risk: string
}

interface CvBrief {
  headline: string
  skills_to_highlight: string[]
  skills_to_downplay: string[]
  cover_letter_opening: string
  ats_keywords: string[]
  accomplishment_reframes: string[]
  vision_alignment_statement: string
}

type Step = 1 | 2 | 3 | 4 | 5

export default function StudentDashboard() {
  const params = useParams()
  const country = (params.country as string) || 'saudi'

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

  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        if (prof) {
          setUserProfile(prof)
          if (prof.resume_parsed && typeof prof.resume_parsed === 'object' && Object.keys(prof.resume_parsed).length > 0) {
            setProfile(prof.resume_parsed as Profile)
            setEditedSummary((prof.resume_parsed as Profile).summary || '')
            const skills = (prof.extracted_skills as string[]) || []
            setConfirmedSkills(new Set(skills))
            setStep(3)
          }
        }
        // Forward auth token to Chrome extension if installed
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        if (token && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          try {
            chrome.runtime.sendMessage(
              'SYRKA_EXTENSION_ID',
              { type: 'STORE_AUTH', token }
            )
          } catch {}
        }
      }
    })
  }, [])

  const [offerJobTitle, setOfferJobTitle] = useState('')
  const [offerCompany, setOfferCompany] = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [offerSalary, setOfferSalary] = useState('')
  const [offerCurrency, setOfferCurrency] = useState('USD')
  const [offerEval, setOfferEval] = useState<OfferEvaluation | null>(null)
  const [cvBrief, setCvBrief] = useState<CvBrief | null>(null)
  const [copiedField, setCopiedField] = useState('')

  interface JobRec {
    title: string
    description: string
    matchPercent: number
    keySkillsMatched: string[]
    salaryRange: string
    seniorityLevel: string
    linkedinSearchUrl: string
    indeedSearchUrl: string
    whyMatch: string
  }
  const [jobRecs, setJobRecs] = useState<JobRec[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)

  interface WeekRange {
    weeks: string
    focus: string
    actions: string[]
    resources: string[]
    skills_unlocked: string[]
  }
  interface AdaptivePath {
    week_ranges: WeekRange[]
    immediate_action: string
    velocity_assessment: 'ahead' | 'on_track' | 'behind'
    velocity_reasoning: string
    bottleneck: string
    shortcut: string
  }
  const [adaptivePath, setAdaptivePath] = useState<AdaptivePath | null>(null)
  const [loadingPath, setLoadingPath] = useState(false)

  const progressPct = (step / 5) * 100

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
      if (user) {
        supabase.from('user_profiles').upsert({
          id: user.id,
          resume_parsed: p,
          extracted_skills: Array.from(allSkills),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).then(() => {})
      }
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

  async function handleEvaluateOffer() {
    if (!offerJobTitle) return
    setLoading(true)
    setLoadingMsg('Evaluating your offer...')
    try {
      const res = await fetch('/api/students/evaluate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: offerJobTitle,
          company: offerCompany,
          description: offerDescription,
          salaryOffered: offerSalary,
          salaryCurrency: offerCurrency,
          country,
          studentSkills: Array.from(confirmedSkills),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setOfferEval(data)
      }
    } catch {
      setError('Could not evaluate offer — please try again.')
    }
    setLoading(false)
  }

  async function handleGenerateBrief() {
    if (!offerJobTitle) return
    setLoading(true)
    setLoadingMsg('Generating your CV brief...')
    try {
      const res = await fetch('/api/students/generate-cv-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: offerJobTitle,
          company: offerCompany,
          description: offerDescription,
          studentSkills: Array.from(confirmedSkills),
          studentSummary: editedSummary,
          country,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setCvBrief(data)
      }
    } catch {
      setError('Could not generate brief — please try again.')
    }
    setLoading(false)
  }

  function copyField(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    setTimeout(() => setCopiedField(''), 2000)
  }

  function reset() {
    setStep(1); setFile(null); setContext(''); setProfile(null)
    setEditedSummary(''); setConfirmedSkills(new Set()); setCareerMatches([])
    setIdentityStatement(''); setExpandedCareer(null); setError('')
    setOfferEval(null); setCvBrief(null); setOfferJobTitle(''); setOfferCompany('')
    setOfferDescription(''); setOfferSalary(''); setOfferCurrency('USD')
    setJobRecs([])
  }

  async function fetchAdaptivePath() {
    const skills = Array.from(confirmedSkills)
    if (skills.length === 0) return
    setLoadingPath(true)
    try {
      const res = await fetch('/api/students/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills,
          completedModules: [],
          timeAvailable: 'medium',
          targetRole: careerMatches[0]?.title || '',
          country,
        }),
      })
      const data = await res.json()
      if (data.week_ranges) setAdaptivePath(data)
    } catch {}
    setLoadingPath(false)
  }

  async function fetchJobRecs() {
    const skills = Array.from(confirmedSkills)
    if (skills.length === 0) return
    setLoadingRecs(true)
    try {
      const res = await fetch('/api/students/job-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, country, userId: user?.id }),
      })
      const data = await res.json()
      setJobRecs(Array.isArray(data) ? data : [])
    } catch {
      setJobRecs([])
    }
    setLoadingRecs(false)
  }

  return (
    <Shell country={country} activeTrack="student">
      <div className="overflow-y-auto px-6 md:px-12 pb-16 pt-12" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto">

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="flex gap-2 mb-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">{loadingMsg}</p>
            </div>
          ) : (
            <>
              {/* Profile status bar */}
              {user && (
                <div className="bg-surface-container-low ghost-border p-4 mb-6 flex items-center justify-between mt-8">
                  <div className="flex items-center gap-4">
                    {user.user_metadata?.avatar_url && (
                      <img src={user.user_metadata.avatar_url}
                           className="w-8 h-8" style={{ borderRadius: 0 }} alt="" />
                    )}
                    <div>
                      <div className="font-headline text-sm font-bold text-primary">
                        {user.user_metadata?.full_name}
                      </div>
                      <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {userProfile?.resume_parsed && typeof userProfile.resume_parsed === 'object' && Object.keys(userProfile.resume_parsed).length > 0
                          ? '● Profile synced' : '○ Upload resume to build profile'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {typeof userProfile?.linkedin_url === 'string' && userProfile.linkedin_url && (
                      <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="btn-ghost text-xs py-1 px-3" style={{ textDecoration: 'none' }}>LinkedIn &#8599;</a>
                    )}
                    {typeof userProfile?.github_username === 'string' && userProfile.github_username && (
                      <a href={`https://github.com/${userProfile.github_username}`}
                         target="_blank" rel="noopener noreferrer"
                         className="btn-ghost text-xs py-1 px-3" style={{ textDecoration: 'none' }}>GitHub &#8599;</a>
                    )}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="pt-8 mb-10">
                <div className="h-px bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }} />
                </div>
                <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-3">
                  Step {step} of 5
                </p>
              </div>

              {/* ── STEP 1: Upload ── */}
              {step === 1 && (
                <div>
                  <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
                    Upload your CV
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg mt-4 leading-relaxed">
                    We read your CV and build your career profile automatically. No chips to select. No boxes to fill.
                  </p>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="mt-8 p-10 text-center transition-colors"
                    style={{
                      border: `2px dashed ${dragOver ? 'rgba(255,255,255,0.4)' : 'rgba(71,71,71,0.4)'}`,
                      backgroundColor: dragOver ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                  >
                    {file ? (
                      <div>
                        <span className="material-symbols-outlined text-primary mb-3 block" style={{ fontSize: '2rem' }}>description</span>
                        <p className="font-body text-sm text-primary">{file.name}</p>
                        <p className="font-body text-xs text-outline mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                        <button onClick={() => setFile(null)}
                          className="mt-3 font-label text-xs uppercase tracking-widest text-outline hover:text-on-surface-variant transition-colors"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span className="material-symbols-outlined text-outline mb-4 block" style={{ fontSize: '2.5rem' }}>upload_file</span>
                        <p className="font-body text-sm text-on-surface-variant">Drag and drop your CV here</p>
                        <p className="font-body text-xs text-outline mt-1">PDF or DOCX · max 5 MB</p>
                        <label className="mt-6 inline-block cursor-pointer btn-ghost text-xs">
                          Browse file
                          <input type="file" accept=".pdf,.docx" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) setFile(f) }} />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">
                      Anything you want us to know? <span className="text-outline normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                      placeholder="e.g. I am switching careers from finance to tech, or I am particularly interested in AI..."
                      className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 placeholder-outline focus:outline-none resize-none transition-colors"
                      style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }} />
                  </div>

                  {error && (
                    <p className="mt-4 font-body text-sm text-error">{error}</p>
                  )}

                  <button onClick={handleAnalyse} disabled={!file}
                    className="btn-primary w-full mt-8 disabled:opacity-30">
                    Analyse my CV →
                  </button>
                  <p className="font-body text-xs text-outline text-center mt-3">
                    Your CV is processed to extract your profile and is not stored on our servers.
                  </p>
                </div>
              )}

              {/* ── STEP 2: Review Profile ── */}
              {step === 2 && profile && (
                <div>
                  <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
                    {profile.name ? `Here's your profile, ${profile.name}` : 'Here is your profile'}
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg mt-4">
                    Review what we found. Edit the summary, deselect any skills that don&apos;t fit.
                  </p>

                  {/* Summary */}
                  <div className="mt-8">
                    <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Summary</p>
                    <textarea value={editedSummary} onChange={e => setEditedSummary(e.target.value)} rows={4}
                      className="w-full bg-transparent text-on-surface font-body text-sm pl-4 py-2 focus:outline-none resize-none italic leading-relaxed"
                      style={{ borderLeft: '2px solid #FFFFFF' }} />
                  </div>

                  {/* Strongest dimensions */}
                  {profile.strongest_dimensions.length > 0 && (
                    <div className="mt-6">
                      <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Strongest dimensions</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.strongest_dimensions.map(d => (
                          <span key={d} className="data-chip">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="mt-6">
                    <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">
                      Skills — deselect any that don&apos;t fit
                    </p>

                    {profile.explicit_skills.length > 0 && (
                      <div className="mb-4">
                        <p className="font-body text-xs text-outline mb-2">From your CV</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.explicit_skills.map(s => {
                            const on = confirmedSkills.has(s)
                            return (
                              <button key={s} onClick={() => toggleSkill(s)}
                                className="font-label text-xs px-3 py-1.5 uppercase tracking-wider transition-all"
                                style={{
                                  background: on ? '#323538' : 'transparent',
                                  border: `1px solid ${on ? 'rgba(255,255,255,0.3)' : 'rgba(71,71,71,0.4)'}`,
                                  color: on ? '#FFFFFF' : '#919191',
                                  textDecoration: on ? 'none' : 'line-through',
                                  cursor: 'pointer',
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
                        <p className="font-body text-xs text-outline mb-2">Inferred from your background</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.inferred_skills.map(s => {
                            const on = confirmedSkills.has(s)
                            return (
                              <button key={s} onClick={() => toggleSkill(s)}
                                className="font-label text-xs px-3 py-1.5 uppercase tracking-wider transition-all"
                                style={{
                                  background: on ? '#272A2D' : 'transparent',
                                  border: `1px solid ${on ? 'rgba(255,255,255,0.15)' : 'rgba(71,71,71,0.4)'}`,
                                  color: on ? '#C6C6C6' : '#919191',
                                  textDecoration: on ? 'none' : 'line-through',
                                  cursor: 'pointer',
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
                      <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Best-fit sectors</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.suggested_sectors.map(s => (
                          <span key={s} className="font-label text-xs px-3 py-1.5 uppercase tracking-wider text-outline"
                            style={{ border: '1px solid rgba(71,71,71,0.4)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-10">
                    <button onClick={() => setStep(1)} className="btn-ghost px-5 py-2.5 text-sm">
                      ← Back
                    </button>
                    <button onClick={handleMatch} disabled={confirmedSkills.size === 0}
                      className="btn-primary flex-1 disabled:opacity-30">
                      Find my career matches →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Career Matches ── */}
              {step === 3 && (
                <div>
                  <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
                    Career matches
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg mt-4">
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
                        <div key={career.title} className="bg-surface-container-low ghost-border overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-headline font-bold text-primary">{career.title}</h3>
                                <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-1">
                                  {(career.sector || '').toUpperCase()}
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="font-headline text-2xl font-bold text-primary tabular-nums">
                                  {career.match_percent}%
                                </span>
                                <p className="font-label text-label-sm uppercase tracking-widest text-outline">fit</p>
                              </div>
                            </div>

                            {/* Match bar */}
                            <div className="mt-4 h-px bg-surface-container-high overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-700"
                                style={{ width: `${career.match_percent}%` }} />
                            </div>

                            <p className="mt-4 font-body text-sm text-on-surface-variant leading-relaxed">{career.why_you_fit}</p>

                            <div className="grid grid-cols-3 gap-4 mt-5">
                              <div>
                                <p className="font-headline font-bold text-primary tabular-nums">
                                  {career.realistic_gap_months || Math.round((career.gap_years || 2) * 12)} mo
                                </p>
                                <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-1">to close gap</p>
                              </div>
                              {salaryDisplay && (
                                <div>
                                  <p className="font-headline font-bold text-primary tabular-nums">{salaryDisplay}</p>
                                  <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-1">median salary</p>
                                </div>
                              )}
                              <div>
                                <p className="font-headline font-bold text-primary tabular-nums">
                                  {(career.open_roles || 0).toLocaleString()}
                                </p>
                                <p className="font-label text-label-sm uppercase tracking-widest text-outline mt-1">open roles</p>
                              </div>
                            </div>

                            <button onClick={() => setExpandedCareer(expanded ? null : career.title)}
                              className="mt-5 font-label text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                              {expanded ? 'Hide details ↑' : 'Certification path ↓'}
                            </button>
                          </div>

                          {expanded && (
                            <div className="border-t border-surface-container-high p-6 bg-surface-container space-y-6">
                              {/* Skills grid */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Skills you have</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(career.matching_skills || []).map(s => (
                                      <span key={s} className="font-label text-xs px-2.5 py-1 uppercase tracking-wider bg-surface-container-highest text-primary">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Skills to build</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(career.skills_to_develop || []).map(s => (
                                      <span key={s} className="font-label text-xs px-2.5 py-1 uppercase tracking-wider bg-surface-container text-outline"
                                        style={{ border: '1px solid rgba(71,71,71,0.4)' }}>
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Certification pipeline */}
                              {career.certifications?.length > 0 && (
                                <div>
                                  <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Certification pipeline</p>
                                  <div className="space-y-2">
                                    {freeCert && (
                                      <div className="flex items-center gap-4 p-3 bg-surface-container-highest">
                                        <span className="font-label text-label-sm uppercase tracking-widest text-primary shrink-0">Free</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-body text-sm text-primary truncate">{freeCert.name}</p>
                                          <p className="font-body text-xs text-on-surface-variant">{freeCert.duration}</p>
                                        </div>
                                        <a href={freeCert.url} target="_blank" rel="noopener noreferrer"
                                          className="font-label text-label-sm uppercase tracking-widest text-primary hover:text-on-surface-variant transition-colors shrink-0"
                                          style={{ textDecoration: 'none' }}>
                                          Start →
                                        </a>
                                      </div>
                                    )}
                                    {paidCerts.slice(0, 2).map((cert, i) => (
                                      <div key={i} className="flex items-center gap-4 p-3 bg-surface-container">
                                        <span className="font-label text-label-sm uppercase tracking-widest text-outline shrink-0">Paid</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-body text-sm text-on-surface-variant truncate">{cert.name}</p>
                                          <p className="font-body text-xs text-outline">{cert.duration}</p>
                                        </div>
                                        <a href={cert.url} target="_blank" rel="noopener noreferrer"
                                          className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-on-surface-variant transition-colors shrink-0"
                                          style={{ textDecoration: 'none' }}>
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
                                  <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Who&apos;s hiring</p>
                                  <div className="flex flex-wrap gap-2">
                                    {employers.slice(0, 4).map(e => (
                                      <span key={e} className="font-label text-xs px-2.5 py-1 uppercase tracking-wider text-outline"
                                        style={{ border: '1px solid rgba(71,71,71,0.4)' }}>
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
                      <p className="font-body text-sm text-outline text-center py-12">
                        No career matches found — try adjusting your profile.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-10">
                    <button onClick={() => setStep(2)} className="btn-ghost px-5 py-2.5 text-sm">
                      ← Back
                    </button>
                    <button onClick={handleIdentity} disabled={careerMatches.length === 0}
                      className="btn-primary flex-1 disabled:opacity-30">
                      Generate my Career Identity →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Identity Statement + 90-day Plan ── */}
              {step === 4 && (
                <div>
                  <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
                    Your Career Identity Statement
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg mt-4">
                    Use this on your CV, LinkedIn, or in interviews.
                  </p>

                  <blockquote className="mt-8 p-6 bg-surface-container-low italic font-body text-lg leading-[1.7] text-on-surface"
                    style={{ borderLeft: '2px solid #FFFFFF' }}>
                    {identityStatement}
                  </blockquote>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => { navigator.clipboard.writeText(identityStatement); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="btn-primary">
                      {copied ? 'Copied ✓' : 'Copy statement'}
                    </button>
                    <button onClick={reset} className="btn-ghost">
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
                      <div className="mt-12">
                        <div className="border-t border-surface-container pt-8 mb-8">
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Next steps</p>
                          <h2 className="font-headline text-headline-lg font-bold text-primary">Your 90-Day Action Plan</h2>
                        </div>
                        <div className="space-y-8">
                          {[
                            {
                              label: 'Mo 1',
                              title: 'Start free certification',
                              body: freeCert ? (
                                <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
                                  Begin <a href={freeCert.url} target="_blank" rel="noopener noreferrer"
                                    className="text-primary underline">{freeCert.name}</a> — {freeCert.duration}. No cost, immediate signal of intent on LinkedIn.
                                </p>
                              ) : (
                                <p className="font-body text-sm text-on-surface-variant mt-2">Find a free introductory course in {top.skills_to_develop?.[0] || top.sector}.</p>
                              ),
                            },
                            {
                              label: 'Mo 2–3',
                              title: 'Add paid credential',
                              body: paidCert ? (
                                <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
                                  Enrol in <a href={paidCert.url} target="_blank" rel="noopener noreferrer"
                                    className="text-primary underline">{paidCert.name}</a> — {paidCert.duration}. This is the credential {top.title} hiring managers look for.
                                </p>
                              ) : (
                                <p className="font-body text-sm text-on-surface-variant mt-2">Research industry-recognised certifications for {top.sector}.</p>
                              ),
                            },
                            {
                              label: 'Mo 3+',
                              title: 'Apply with real employers',
                              body: (
                                <>
                                  <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
                                    {employers.length > 0
                                      ? `Target: ${employers.slice(0, 3).join(', ')}. These employers actively recruit for ${top.title} roles in ${country === 'saudi' ? 'Vision 2030' : country === 'uk' ? 'the UK AI Action Plan' : 'Vision 2050'}.`
                                      : `Search for ${top.title} roles aligned with ${top.sector}.`
                                    }
                                  </p>
                                  <a
                                    href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(top.title)}&location=${encodeURIComponent(country === 'saudi' ? 'Saudi Arabia' : country === 'uk' ? 'United Kingdom' : 'Malta')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-block mt-3 font-label text-label-sm uppercase tracking-widest text-primary hover:text-on-surface-variant transition-colors"
                                    style={{ textDecoration: 'none' }}>
                                    Search {top.title} on LinkedIn →
                                  </a>
                                </>
                              ),
                            },
                          ].map(item => (
                            <div key={item.label} className="flex gap-6">
                              <div className="shrink-0 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-label text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                                {item.label}
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="font-headline font-bold text-primary text-sm">{item.title}</p>
                                {item.body}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Adaptive Learning Path */}
                  <div className="mt-12 border-t border-surface-container pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Personalised for you</div>
                        <h2 className="font-headline text-2xl font-bold tracking-tighter text-primary">
                          Adaptive Learning Path
                        </h2>
                      </div>
                      <button onClick={fetchAdaptivePath}
                        className="btn-ghost text-xs py-2 px-4"
                        style={{ background: 'none', border: '1px solid rgba(71,71,71,0.4)', cursor: 'pointer' }}>
                        {adaptivePath ? 'Refresh' : 'Generate'} &#8635;
                      </button>
                    </div>

                    {loadingPath && (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
                      </div>
                    )}

                    {adaptivePath && (
                      <div className="space-y-6">
                        {/* Today's action */}
                        <div className="btn-primary p-4 text-center">
                          <div className="font-label text-label-sm uppercase tracking-widest opacity-70 mb-1">Today&apos;s Action</div>
                          <div className="font-body text-sm">{adaptivePath.immediate_action}</div>
                        </div>

                        {/* Velocity badge */}
                        <div className="flex items-center gap-4">
                          <span className="font-label text-xs uppercase tracking-widest px-3 py-1"
                            style={{
                              background: adaptivePath.velocity_assessment === 'ahead' ? 'rgba(76,175,80,0.15)'
                                : adaptivePath.velocity_assessment === 'on_track' ? 'rgba(33,150,243,0.15)'
                                : 'rgba(244,67,54,0.15)',
                              color: adaptivePath.velocity_assessment === 'ahead' ? '#4CAF50'
                                : adaptivePath.velocity_assessment === 'on_track' ? '#2196F3'
                                : '#F44336',
                              border: `1px solid ${adaptivePath.velocity_assessment === 'ahead' ? 'rgba(76,175,80,0.3)'
                                : adaptivePath.velocity_assessment === 'on_track' ? 'rgba(33,150,243,0.3)'
                                : 'rgba(244,67,54,0.3)'}`,
                            }}>
                            {adaptivePath.velocity_assessment === 'on_track' ? 'ON TRACK' : adaptivePath.velocity_assessment.toUpperCase()}
                          </span>
                          <span className="font-body text-xs text-on-surface-variant">{adaptivePath.velocity_reasoning}</span>
                        </div>

                        {/* Bottleneck */}
                        <div className="flex items-center gap-3">
                          <span className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Bottleneck:</span>
                          <span className="font-label text-xs px-3 py-1 uppercase tracking-wider"
                            style={{ border: '1px solid rgba(244,67,54,0.4)', color: '#F44336' }}>
                            {adaptivePath.bottleneck}
                          </span>
                        </div>

                        {/* Week ranges */}
                        <div className="space-y-4">
                          {(adaptivePath.week_ranges || []).map((wr, i) => (
                            <div key={i} className="bg-surface-container-low ghost-border p-5">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-headline font-bold text-primary text-sm">{wr.weeks}</span>
                                <span className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">{wr.focus}</span>
                              </div>
                              <ul className="space-y-1 mb-3">
                                {(wr.actions || []).slice(0, 3).map((a, j) => (
                                  <li key={j} className="font-body text-xs text-on-surface-variant">&#8594; {a}</li>
                                ))}
                              </ul>
                              {(wr.skills_unlocked || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {wr.skills_unlocked.map(s => (
                                    <span key={s} className="data-chip text-[9px]">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Shortcut */}
                        <div className="p-4 bg-surface-container ghost-border">
                          <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Fastest Path</div>
                          <p className="font-body text-sm text-primary">{adaptivePath.shortcut}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Job Recommendations */}
                  <div className="mt-12 border-t border-surface-container pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Based on your profile</div>
                        <h2 className="font-headline text-2xl font-bold tracking-tighter text-primary">
                          Job Recommendations
                        </h2>
                      </div>
                      <button onClick={fetchJobRecs}
                        className="btn-ghost text-xs py-2 px-4"
                        style={{ background: 'none', border: '1px solid rgba(71,71,71,0.4)', cursor: 'pointer' }}>
                        {jobRecs.length > 0 ? 'Refresh' : 'Load'} &#8635;
                      </button>
                    </div>

                    {loadingRecs && (
                      <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="skeleton h-48 w-full" />
                        ))}
                      </div>
                    )}

                    {jobRecs.length > 0 && (
                      <div className="grid grid-cols-1 gap-4">
                        {jobRecs.map((job, i) => (
                          <div key={i} className="bg-surface-container-low ghost-border p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="font-headline text-base font-bold text-primary tracking-tighter">{job.title}</div>
                                  <div className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">{job.seniorityLevel}</div>
                                </div>
                                <div className="font-headline text-xl font-bold text-primary tabular-nums">
                                  {job.matchPercent}%
                                </div>
                              </div>
                              <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">{job.whyMatch}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {(job.keySkillsMatched || []).slice(0, 3).map(skill => (
                                  <span key={skill} className="data-chip text-[9px]">{skill}</span>
                                ))}
                              </div>
                              <div className="font-label text-label-sm text-on-surface-variant mb-4">{job.salaryRange}</div>
                            </div>
                            <div className="flex gap-2 mt-auto pt-4 border-t border-surface-container">
                              <a href={job.linkedinSearchUrl} target="_blank" rel="noopener noreferrer"
                                 className="btn-primary flex-1 text-center text-xs py-2" style={{ textDecoration: 'none' }}>
                                LinkedIn Jobs &#8599;
                              </a>
                              <a href={job.indeedSearchUrl} target="_blank" rel="noopener noreferrer"
                                 className="btn-ghost flex-1 text-center text-xs py-2" style={{ textDecoration: 'none' }}>
                                Indeed &#8599;
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 border-t border-surface-container pt-8">
                    <button onClick={() => { setOfferJobTitle(careerMatches[0]?.title || ''); setStep(5) }}
                      className="btn-primary w-full">
                      Evaluate a job offer →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 5: Job Pipeline ── */}
              {step === 5 && (
                <div>
                  <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary">
                    Job Pipeline
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg mt-4">
                    Evaluate an offer and generate a tailored CV brief.
                  </p>

                  {/* Offer form */}
                  <div className="mt-8 space-y-4">
                    <div>
                      <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Job Title</label>
                      <input type="text" value={offerJobTitle} onChange={e => setOfferJobTitle(e.target.value)}
                        placeholder="e.g. AI Engineer"
                        className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 placeholder-outline focus:outline-none"
                        style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }} />
                    </div>
                    <div>
                      <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Company</label>
                      <input type="text" value={offerCompany} onChange={e => setOfferCompany(e.target.value)}
                        placeholder="e.g. NEOM"
                        className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 placeholder-outline focus:outline-none"
                        style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }} />
                    </div>
                    <div>
                      <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Job Description <span className="text-outline normal-case tracking-normal">(optional)</span></label>
                      <textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} rows={3}
                        placeholder="Paste the job description or key requirements..."
                        className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 placeholder-outline focus:outline-none resize-none"
                        style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Salary Offered</label>
                        <input type="text" value={offerSalary} onChange={e => setOfferSalary(e.target.value)}
                          placeholder="e.g. 85000"
                          className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 placeholder-outline focus:outline-none"
                          style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }} />
                      </div>
                      <div>
                        <label className="block font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Currency</label>
                        <select value={offerCurrency} onChange={e => setOfferCurrency(e.target.value)}
                          className="w-full bg-surface-container-low text-on-surface font-body text-sm px-4 py-3 focus:outline-none appearance-none"
                          style={{ border: '1px solid rgba(71,71,71,0.4)', borderRadius: 0 }}>
                          <option value="SAR">SAR</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>

                    {error && <p className="font-body text-sm text-error">{error}</p>}

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleEvaluateOffer} disabled={!offerJobTitle}
                        className="btn-primary flex-1 disabled:opacity-30">
                        Evaluate Offer
                      </button>
                      <button onClick={handleGenerateBrief} disabled={!offerJobTitle}
                        className="btn-ghost flex-1 disabled:opacity-30">
                        Generate CV Brief
                      </button>
                    </div>
                  </div>

                  {/* Offer evaluation results */}
                  {offerEval && (
                    <div className="mt-10 border-t border-surface-container pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Offer Grade</p>
                          <h2 className="font-headline text-headline-lg font-bold text-primary">
                            {offerJobTitle} at {offerCompany || 'Company'}
                          </h2>
                        </div>
                        <div className="shrink-0 w-16 h-16 flex items-center justify-center ghost-border"
                          style={{
                            backgroundColor: offerEval.grade.startsWith('A') ? 'rgba(76,175,80,0.15)'
                              : offerEval.grade.startsWith('B') ? 'rgba(33,150,243,0.15)'
                              : offerEval.grade.startsWith('C') ? 'rgba(255,193,7,0.15)'
                              : 'rgba(244,67,54,0.15)',
                          }}>
                          <span className="font-headline text-2xl font-bold"
                            style={{
                              color: offerEval.grade.startsWith('A') ? '#4CAF50'
                                : offerEval.grade.startsWith('B') ? '#2196F3'
                                : offerEval.grade.startsWith('C') ? '#FFC107'
                                : '#F44336',
                            }}>
                            {offerEval.grade}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <span className="font-headline text-4xl font-bold text-primary tabular-nums">{offerEval.overall_score}</span>
                        <span className="font-label text-label-sm uppercase tracking-widest text-outline">/100 weighted score</span>
                      </div>

                      <p className="font-body text-on-surface-variant leading-relaxed mb-6">{offerEval.verdict}</p>

                      {/* Dimension breakdown */}
                      <div className="space-y-3 mb-8">
                        <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Dimension Breakdown</p>
                        {offerEval.dimensions.map(d => (
                          <div key={d.name} className="bg-surface-container-low p-4 ghost-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{d.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-label text-xs text-outline">{d.weight}%w</span>
                                <span className="font-headline font-bold text-primary tabular-nums">{d.score}</span>
                              </div>
                            </div>
                            <div className="h-px bg-surface-container-high overflow-hidden mb-2">
                              <div className="h-full bg-primary transition-all duration-700"
                                style={{ width: `${d.score}%` }} />
                            </div>
                            <p className="font-body text-xs text-outline">{d.rationale}</p>
                          </div>
                        ))}
                      </div>

                      {/* Negotiation points */}
                      {offerEval.negotiation_points?.length > 0 && (
                        <div className="mb-6">
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Negotiation Points</p>
                          <div className="space-y-2">
                            {offerEval.negotiation_points.map((point, i) => (
                              <div key={i} className="flex gap-3 p-3 bg-surface-container">
                                <span className="font-headline font-bold text-primary shrink-0">{i + 1}.</span>
                                <p className="font-body text-sm text-on-surface-variant">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key risk */}
                      {offerEval.key_risk && (
                        <div className="p-4 bg-surface-container ghost-border" style={{ borderLeftColor: 'rgba(244,67,54,0.5)', borderLeftWidth: 2 }}>
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">Key Risk</p>
                          <p className="font-body text-sm text-on-surface-variant">{offerEval.key_risk}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CV Brief results */}
                  {cvBrief && (
                    <div className="mt-10 border-t border-surface-container pt-8">
                      <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">CV Brief</p>
                      <h2 className="font-headline text-headline-lg font-bold text-primary mb-6">
                        Tailored for {offerJobTitle}
                      </h2>

                      {/* Headline */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Professional Headline</p>
                          <button onClick={() => copyField(cvBrief.headline, 'headline')}
                            className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            {copiedField === 'headline' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="font-headline font-bold text-primary text-lg">{cvBrief.headline}</p>
                      </div>

                      {/* Skills to highlight */}
                      {cvBrief.skills_to_highlight?.length > 0 && (
                        <div className="mb-6">
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Skills to Highlight</p>
                          <div className="flex flex-wrap gap-2">
                            {cvBrief.skills_to_highlight.map(s => (
                              <span key={s} className="font-label text-xs px-3 py-1.5 uppercase tracking-wider bg-surface-container-highest text-primary">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills to downplay */}
                      {cvBrief.skills_to_downplay?.length > 0 && (
                        <div className="mb-6">
                          <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Skills to Downplay</p>
                          <div className="flex flex-wrap gap-2">
                            {cvBrief.skills_to_downplay.map(s => (
                              <span key={s} className="font-label text-xs px-3 py-1.5 uppercase tracking-wider text-outline line-through"
                                style={{ border: '1px solid rgba(71,71,71,0.4)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cover letter opening */}
                      {cvBrief.cover_letter_opening && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Cover Letter Opening</p>
                            <button onClick={() => copyField(cvBrief.cover_letter_opening, 'cover')}
                              className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              {copiedField === 'cover' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <blockquote className="p-4 bg-surface-container-low italic font-body text-sm leading-relaxed text-on-surface-variant"
                            style={{ borderLeft: '2px solid #FFFFFF' }}>
                            {cvBrief.cover_letter_opening}
                          </blockquote>
                        </div>
                      )}

                      {/* ATS keywords */}
                      {cvBrief.ats_keywords?.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">ATS Keywords</p>
                            <button onClick={() => copyField(cvBrief.ats_keywords.join(', '), 'ats')}
                              className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              {copiedField === 'ats' ? 'Copied' : 'Copy all'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cvBrief.ats_keywords.map(k => (
                              <span key={k} className="data-chip">{k}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accomplishment reframes */}
                      {cvBrief.accomplishment_reframes?.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Accomplishment Reframes</p>
                            <button onClick={() => copyField(cvBrief.accomplishment_reframes.join('\n'), 'reframes')}
                              className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              {copiedField === 'reframes' ? 'Copied' : 'Copy all'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {cvBrief.accomplishment_reframes.map((r, i) => (
                              <div key={i} className="p-3 bg-surface-container-low ghost-border">
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed">{r}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vision alignment */}
                      {cvBrief.vision_alignment_statement && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Vision Alignment</p>
                            <button onClick={() => copyField(cvBrief.vision_alignment_statement, 'vision')}
                              className="font-label text-label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              {copiedField === 'vision' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="font-body text-sm text-primary leading-relaxed p-4 bg-surface-container-low"
                            style={{ borderLeft: '2px solid #FFFFFF' }}>
                            {cvBrief.vision_alignment_statement}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 mt-10">
                    <button onClick={() => setStep(4)} className="btn-ghost px-5 py-2.5 text-sm">
                      ← Back
                    </button>
                    <button onClick={reset} className="btn-ghost flex-1">
                      Start again
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}
