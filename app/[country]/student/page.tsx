import Link from 'next/link'
import Shell from '@/components/Shell'
import DegreeMatrix from '@/components/student/DegreeMatrix'
import ModuleIntelligence from '@/components/student/ModuleIntelligence'
import CareerVector from '@/components/student/CareerVector'
import SkillTopography from '@/components/student/SkillTopography'
import Directives from '@/components/student/Directives'
import ProfileInit from '@/components/student/ProfileInit'
import { OU_R88, TARGET_VECTOR } from '@/lib/degree-config'

const TABS = [
  { id: 'matrix', label: 'Degree Matrix' },
  { id: 'intelligence', label: 'Module Intel' },
  { id: 'career', label: 'Career Vector' },
  { id: 'skills', label: 'Skills' },
  { id: 'directives', label: 'Directives' },
  { id: 'profile', label: 'Profile' },
]

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>
  searchParams: Promise<{ tab?: string; module?: string }>
}) {
  const { country } = await params
  const sp = await searchParams
  const tab = sp.tab ?? 'matrix'
  const selectedModule = sp.module ?? null

  const completedCredits = OU_R88.stages
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.credits, 0)

  return (
    <Shell country={country} activeTrack="student">
      <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Sticky top header bar — 48px */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between"
          style={{
            height: 48,
            background: '#0d0e10',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: '0 24px',
          }}
        >
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="font-headline font-bold hidden sm:block"
              style={{ fontSize: 13, letterSpacing: '0.35em', color: '#c4c7ca', textDecoration: 'none' }}
            >
              SYRKA
            </a>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} className="hidden sm:block" />
            <span style={{ fontSize: 11, color: '#939eb4' }} className="hidden sm:block">
              {OU_R88.institution}
            </span>
          </div>

          {/* Center: tab pills */}
          <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(t => {
              const isActive = t.id === tab
              return (
                <Link
                  key={t.id}
                  href={`/${country}/student?tab=${t.id}`}
                  style={{
                    textDecoration: 'none',
                    padding: '6px 14px',
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'ui-monospace, monospace',
                    color: isActive ? '#679cff' : '#73757c',
                    background: isActive ? 'rgba(103,156,255,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(103,156,255,0.15)' : '1px solid transparent',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>

          {/* Right: status indicators */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: 6, height: 6, background: '#679cff', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, color: '#679cff', fontFamily: 'ui-monospace, monospace' }}>
                {TARGET_VECTOR.alignment}% aligned
              </span>
            </div>
            <span style={{ fontSize: 10, color: '#73757c', fontFamily: 'ui-monospace, monospace' }}>
              {completedCredits}/{OU_R88.total_credits} credits
            </span>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1">
          {tab === 'matrix' && (
            <DegreeMatrix country={country} selectedModule={selectedModule} />
          )}
          {tab === 'intelligence' && (
            <ModuleIntelligence moduleCode={selectedModule ?? ''} country={country} />
          )}
          {tab === 'career' && (
            <CareerVector country={country} />
          )}
          {tab === 'skills' && (
            <SkillTopography />
          )}
          {tab === 'directives' && (
            <Directives country={country} />
          )}
          {tab === 'profile' && (
            <ProfileInit country={country} />
          )}
        </div>
      </div>
    </Shell>
  )
}
