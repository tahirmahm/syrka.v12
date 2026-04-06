'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import RoleSelector from '@/components/layout/RoleSelector'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
}

const INTEREST_CHIPS: Record<string, string[]> = {
  saudi: [
    'AI and Machine Learning', 'Cybersecurity', 'Cloud Computing',
    'Fintech', 'Smart Cities', 'Renewable Energy',
    'Tourism Technology', 'Healthcare AI', 'Defense Tech',
    'Digital Media', 'Logistics', 'Space Technology',
  ],
  malta: [
    'Blockchain and Web3', 'AI and Machine Learning', 'iGaming Technology',
    'Cybersecurity', 'Fintech', 'Maritime Technology',
    'Climate Tech', 'Digital Media', 'Health Tech',
  ],
}

const QUICK_CHIPS: Record<string, string[]> = {
  saudi: ['University student', 'Recent graduate', 'Working professional'],
  malta: ['University student', 'iGaming professional', 'Switching careers'],
}

interface ExtractedSkill {
  skill: string
  esco_label: string
  source: string
  vision_relevance: string
}

interface CareerMatch {
  title: string
  sector: string
  gap_years: number
  median_salary_usd: number
  open_roles: number
  vision_priority: string
  match_percent: number
  why_you_fit: string
  matching_skills: string[]
  skills_to_develop: string[]
  free_resource?: string
}

interface Session {
  step: number
  step1: string
  step2: string
  interests: string[]
  extractedSkills: ExtractedSkill[]
  careerMatches: CareerMatch[]
  identityStatement: string
  country: string
}

export default function StudentDashboard() {
  const params = useParams()
  const country = (params.country as string) || 'saudi'
  const accentColor = ACCENT[country] || '#C9A84C'

  const [session, setSession] = useState<Session>({
    step: 1, step1: '', step2: '', interests: [],
    extractedSkills: [], careerMatches: [],
    identityStatement: '', country,
  })
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [expandedCareer, setExpandedCareer] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deselected, setDeselected] = useState<Set<string>>(new Set())

  const update = useCallback((patch: Partial<Session>) => {
    setSession((prev) => ({ ...prev, ...patch }))
  }, [])

  const progressPercent = Math.round((session.step / 6) * 100)

  // Step 4: extract skills
  const runExtraction = useCallback(async () => {
    setLoading(true)
    const msgs = ['Reading your experiences...', 'Mapping to ESCO Skills Taxonomy...', 'Finding your strengths...']
    for (let i = 0; i < msgs.length; i++) {
      setLoadingMsg(msgs[i])
      await new Promise((r) => setTimeout(r, 1500))
    }
    try {
      const res = await fetch('/api/students/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step1: session.step1, step2: session.step2, interests: session.interests, country }),
      })
      const data = await res.json()
      update({ extractedSkills: data.skills || [], step: 4 })
    } catch {
      update({ extractedSkills: [], step: 4 })
    }
    setLoading(false)
  }, [session.step1, session.step2, session.interests, country, update])

  // Step 5: match careers
  const runMatching = useCallback(async () => {
    setLoading(true)
    setLoadingMsg('Matching your skills to Vision careers...')
    try {
      const activeSkills = session.extractedSkills.filter((s) => !deselected.has(s.skill))
      const res = await fetch('/api/students/match-careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: activeSkills, country, interests: session.interests }),
      })
      const data = await res.json()
      update({ careerMatches: data.matches || [], step: 5 })
    } catch {
      update({ careerMatches: [], step: 5 })
    }
    setLoading(false)
  }, [session.extractedSkills, session.interests, country, deselected, update])

  // Step 6: identity statement
  const runIdentity = useCallback(async () => {
    setLoading(true)
    setLoadingMsg('Crafting your Career Identity Statement...')
    try {
      const top = session.careerMatches[0]
      const activeSkills = session.extractedSkills.filter((s) => !deselected.has(s.skill))
      const res = await fetch('/api/students/identity-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: activeSkills,
          topCareer: top,
          background: `${session.step1}. ${session.step2}`,
          country,
        }),
      })
      const data = await res.json()
      update({ identityStatement: data.statement || '', step: 6 })

      // Save profile silently
      fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          sector_interest: session.interests[0],
          self_assessed_skills: activeSkills,
          vision_aligned_careers: session.careerMatches.slice(0, 3),
        }),
      }).catch(() => {})
    } catch {
      update({ identityStatement: 'Unable to generate statement at this time.', step: 6 })
    }
    setLoading(false)
  }, [session, country, deselected, update])

  // PDF download
  const downloadPDF = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const accent: [number, number, number] = country === 'saudi' ? [201, 168, 76] : [27, 107, 90]
    const M = 20, W = 210

    doc.setFillColor(...accent)
    doc.rect(0, 0, W, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text('SYRKA', M, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text('Career Identity Statement', M, 26)
    doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 26, { align: 'right' })

    doc.setDrawColor(...accent)
    doc.line(M, 30, W - M, 30)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(40)
    const lines = doc.splitTextToSize(session.identityStatement, W - 2 * M)
    doc.text(lines, M, 42)

    let y = 42 + lines.length * 6 + 12
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Top Career Matches', M, y)
    y += 8

    session.careerMatches.slice(0, 3).forEach((c) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...accent)
      doc.text(c.title, M, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80)
      doc.text(`${c.sector}  |  ~${c.gap_years} years to close gap  |  $${(c.median_salary_usd || 0).toLocaleString()}/yr`, M, y + 5)
      y += 14
    })

    y += 6
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text('Generated by Syrka — syrka.co — Powered by ESCO Skills Taxonomy', M, y)

    const cName = country === 'saudi' ? 'Saudi_Arabia' : 'Malta'
    doc.save(`Syrka_Career_Identity_${cName}_${new Date().toISOString().split('T')[0]}.pdf`)
  }, [session, country])

  const handleNext = useCallback(() => {
    if (session.step === 3) {
      update({ step: 4 })
      runExtraction()
    } else if (session.step === 4) {
      runMatching()
    } else if (session.step === 5) {
      runIdentity()
    } else {
      update({ step: session.step + 1 })
    }
  }, [session.step, update, runExtraction, runMatching, runIdentity])

  const canAdvance = (() => {
    if (loading) return false
    if (session.step === 1) return session.step1.length >= 10
    if (session.step === 2) return session.step2.length >= 20
    if (session.step === 3) return session.interests.length >= 1
    if (session.step === 4) return session.extractedSkills.length > 0
    if (session.step === 5) return session.careerMatches.length > 0
    return false
  })()

  const nextLabel = (() => {
    if (session.step === 3) return 'Uncover my skills →'
    if (session.step === 4) return 'Find my career matches →'
    if (session.step === 5) return 'Generate my Career Identity →'
    return 'Next →'
  })()

  // Loading overlay for Steps 4-6
  if (loading && session.step >= 3) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-8 py-4">
          <RoleSelector role="Student" accentColor={accentColor} />
        </div>
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ backgroundColor: accentColor, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-lg text-gray-600">{loadingMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-8 py-4">
        <RoleSelector role="Student" accentColor={accentColor} />
      </div>

      {/* Progress bar */}
      <div className="px-8">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Step {session.step} of 6</p>
      </div>

      <div className="max-w-2xl mx-auto" style={{ padding: '48px 32px' }}>

        {/* Step 1 */}
        {session.step === 1 && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              Tell us about yourself
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              Career paths aren&apos;t always linear. Every experience matters.
            </p>
            <textarea
              value={session.step1}
              onChange={(e) => update({ step1: e.target.value })}
              rows={3}
              placeholder="I'm studying computer science at university / I work in finance / I recently graduated in engineering..."
              className="mt-6 w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-4">
              {(QUICK_CHIPS[country] || QUICK_CHIPS.saudi).map((chip) => (
                <button
                  key={chip}
                  onClick={() => update({ step1: chip })}
                  className="px-4 py-1.5 rounded-full border border-gray-200 text-xs text-gray-500 hover:border-gray-400 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {session.step === 2 && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              What have you done?
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              Studies, projects, jobs, volunteering — anything counts.
            </p>
            <textarea
              value={session.step2}
              onChange={(e) => update({ step2: e.target.value })}
              rows={5}
              placeholder="I've worked on a Python project for automating reports, volunteered at a tech event, completed a Google Data Analytics certificate, helped my family business with accounting..."
              className="mt-6 w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none"
            />
            <p className="text-[11px] text-gray-300 mt-2">
              The more detail you share, the more accurate your career matches will be.
            </p>
          </div>
        )}

        {/* Step 3 */}
        {session.step === 3 && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              What pulls your attention?
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              Choose up to 3 Vision-priority areas that interest you most.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              {(INTEREST_CHIPS[country] || INTEREST_CHIPS.saudi).map((chip) => {
                const selected = session.interests.includes(chip)
                return (
                  <button
                    key={chip}
                    onClick={() => {
                      if (selected) {
                        update({ interests: session.interests.filter((i) => i !== chip) })
                      } else if (session.interests.length < 3) {
                        update({ interests: [...session.interests, chip] })
                      }
                    }}
                    className="px-4 py-2 rounded-full text-sm transition-all"
                    style={{
                      border: `1.5px solid ${selected ? accentColor : '#e5e7eb'}`,
                      backgroundColor: selected ? `${accentColor}10` : 'white',
                      color: selected ? accentColor : '#6b7280',
                    }}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-300 mt-3">
              {session.interests.length}/3 selected
            </p>
          </div>
        )}

        {/* Step 4 — Skills Display */}
        {session.step === 4 && !loading && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              Here are your skills
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              These are the transferable skills we found in your background. Deselect any that don&apos;t fit.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {session.extractedSkills.map((skill) => {
                const isDeselected = deselected.has(skill.skill)
                return (
                  <button
                    key={skill.skill}
                    onClick={() => {
                      setDeselected((prev) => {
                        const next = new Set(prev)
                        if (isDeselected) next.delete(skill.skill)
                        else next.add(skill.skill)
                        return next
                      })
                    }}
                    className="group text-left"
                  >
                    <span
                      className="inline-block px-4 py-2 rounded-full text-sm transition-all"
                      style={{
                        border: `1.5px solid ${isDeselected ? '#e5e7eb' : accentColor}`,
                        backgroundColor: isDeselected ? '#f9fafb' : `${accentColor}10`,
                        color: isDeselected ? '#9ca3af' : accentColor,
                        textDecoration: isDeselected ? 'line-through' : 'none',
                      }}
                    >
                      {skill.skill}
                    </span>
                    <span className="block text-[11px] text-gray-300 mt-1 px-2">
                      {skill.source}
                    </span>
                  </button>
                )
              })}
            </div>
            {session.extractedSkills.length === 0 && (
              <p className="text-sm text-gray-400 mt-6">No skills could be extracted. Try adding more detail in the previous steps.</p>
            )}
          </div>
        )}

        {/* Step 5 — Career Matches */}
        {session.step === 5 && !loading && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              Careers that could fit you
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              Based on your skills and Vision-priority interests.
            </p>
            <div className="space-y-4 mt-6">
              {session.careerMatches.map((career) => {
                const isExpanded = expandedCareer === career.title
                return (
                  <div
                    key={career.title}
                    className="bg-white rounded-xl p-5"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{career.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {career.sector} · Vision Priority: <span className="capitalize">{career.vision_priority}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedCareer(isExpanded ? null : career.title)}
                        className="text-xs px-3 py-1 rounded border transition-colors"
                        style={{ borderColor: accentColor, color: accentColor }}
                      >
                        {isExpanded ? 'Collapse' : 'Explore'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{career.why_you_fit}</p>
                    {/* Match bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[11px] text-gray-400 w-20">Skills match</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${career.match_percent}%`, backgroundColor: accentColor }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: accentColor }}>
                        {career.match_percent}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-gray-500">
                      <div>~{career.gap_years} years gap</div>
                      <div>${(career.median_salary_usd || 0).toLocaleString()}/yr</div>
                      <div>{(career.open_roles || 0).toLocaleString()} open roles</div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="mb-3">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Skills you have</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(career.matching_skills || []).map((s) => (
                              <span key={s} className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Skills to develop</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(career.skills_to_develop || []).map((s) => (
                              <span key={s} className="px-2.5 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        {career.free_resource && (
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Start with:</span> {career.free_resource}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {session.careerMatches.length === 0 && (
                <p className="text-sm text-gray-400">No career matches found. Try adjusting your skills or interests.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 6 — Identity Statement */}
        {session.step === 6 && !loading && (
          <div>
            <h1 className="text-[28px] text-gray-900" style={{ fontFamily: 'var(--font-display, serif)' }}>
              Your Career Identity Statement
            </h1>
            <p className="text-[15px] text-gray-400 mt-2">
              A professional summary you can use on your CV, LinkedIn, or in interviews.
            </p>
            <blockquote
              className="mt-8 p-6 rounded-lg bg-white italic text-lg leading-[1.7] text-gray-800"
              style={{ borderLeft: `3px solid ${accentColor}` }}
            >
              {session.identityStatement}
            </blockquote>
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.identityStatement)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                {copied ? 'Copied ✓' : 'Copy Statement'}
              </button>
              <button
                onClick={downloadPDF}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                Download as PDF
              </button>
              <button
                onClick={() => {
                  setSession({ step: 1, step1: '', step2: '', interests: [], extractedSkills: [], careerMatches: [], identityStatement: '', country })
                  setDeselected(new Set())
                  setExpandedCareer(null)
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors"
              >
                Start Again
              </button>
            </div>

            {/* Next steps */}
            {session.careerMatches.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Your next steps</h2>
                <div className="space-y-3">
                  <a
                    href={`/${country}/employer`}
                    className="block text-sm text-gray-600 hover:underline"
                  >
                    1. Explore {session.careerMatches[0].title} — {(session.careerMatches[0].open_roles || 0).toLocaleString()} open roles in {country === 'saudi' ? 'Saudi Vision 2030' : 'Malta Vision 2050'}
                  </a>
                  {session.careerMatches[0]?.skills_to_develop?.[0] && (
                    <p className="text-sm text-gray-600">
                      2. Develop {session.careerMatches[0].skills_to_develop[0]} — {session.careerMatches[0].free_resource || 'Search for free courses online'}
                    </p>
                  )}
                  <a
                    href={`/${country}/university`}
                    className="block text-sm text-gray-600 hover:underline"
                  >
                    3. See how universities are aligning curriculum to these roles →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next button — Steps 1-5 */}
        {session.step < 6 && (
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="mt-8 w-full py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-30"
            style={{ backgroundColor: accentColor }}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
