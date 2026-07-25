import Link from 'next/link'
import { ArrowRight, Bell } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { Status } from '@/components/ui/Status'
import {
  mockCapabilityRepository,
  mockEvidenceRepository,
  mockOdysseyRepository,
  mockPassportRepository,
  mockInstitutionRepository,
} from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Dashboard — Syrka Campus' }

export default async function StudentDashboardPage() {
  const [capabilityClaims, evidence, odyssey, passport, programme] = await Promise.all([
    mockCapabilityRepository.listClaimsForSubject(currentUser.id),
    mockEvidenceRepository.listForStudent(currentUser.id),
    mockOdysseyRepository.getPlanForStudent(currentUser.id),
    mockPassportRepository.getForStudent(currentUser.id),
    currentUser.programmeId ? mockInstitutionRepository.getProgramme(currentUser.programmeId) : Promise.resolve(undefined),
  ])
  const institution = await mockInstitutionRepository.getInstitution(currentUser.institutionId)

  const capabilityCards = (
    await Promise.all(
      capabilityClaims.map(async (claim) => ({
        claim,
        definition: await mockCapabilityRepository.getDefinition(claim.capabilityId),
      }))
    )
  )
    .sort((a, b) => new Date(b.claim.lastObservedAt).getTime() - new Date(a.claim.lastObservedAt).getTime())
    .slice(0, 4)

  const recentEvidence = [...evidence].sort((a, b) => new Date(b.record.submittedAt).getTime() - new Date(a.record.submittedAt).getTime()).slice(0, 4)
  const pendingEvidence = evidence.filter((item) => item.review.status === 'pending')
  const currentMilestone = odyssey?.milestones.find((m) => m.status === 'current')
  const topRecommendation = odyssey?.recommendations[0]
  const latestPassportVersion = passport?.versions.find((v) => v.version === passport.currentVersion)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${currentUser.name.split(' ')[0]}`}
        subtitle={programme && institution ? `${programme.name} · ${institution.name}` : undefined}
      />

      {/* What should I do next */}
      <section aria-labelledby="priorities-heading">
        <h2 id="priorities-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          What to do next
        </h2>
        <div className="flex flex-col gap-2">
          {pendingEvidence.map((item) => (
            <Card key={item.record.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Badge tone="amber">Pending</Badge>
                <p className="font-campus-sans text-campus-sm text-campus-text">
                  <span className="font-medium">{item.record.title}</span> is awaiting faculty review.
                </p>
              </div>
            </Card>
          ))}
          {currentMilestone && (
            <Card className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Badge tone="blue">Odyssey</Badge>
                <p className="font-campus-sans text-campus-sm text-campus-text">
                  Continue toward <span className="font-medium">{currentMilestone.title}</span>.
                </p>
              </div>
              <Link href="/student/odyssey" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                View <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Card>
          )}
          {topRecommendation && (
            <Card className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Badge tone="purple">Recommended</Badge>
                <p className="font-campus-sans text-campus-sm text-campus-text">{topRecommendation.title}</p>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Capability profile */}
      <section aria-labelledby="capabilities-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="capabilities-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
            Capability profile
          </h2>
          <Link href="/student/capabilities" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
            View all <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {capabilityCards.map(({ claim, definition }) => (
            <Link key={claim.id} href={`/student/capabilities/${claim.capabilityId}`}>
              <Card interactive className="p-5">
                <h3 className="font-campus-sans text-campus-base font-medium text-campus-text">{definition?.name}</h3>
                <p className="mt-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{claim.maturity}</p>
                <div className="mt-4">
                  <ConfidenceMeter confidence={claim.confidence} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent evidence */}
        <section aria-labelledby="evidence-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="evidence-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
              Recent evidence
            </h2>
            <Link href="/student/evidence" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentEvidence.map((item) => (
              <Link key={item.record.id} href={`/student/evidence/${item.record.id}`}>
                <Card interactive className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{item.record.title}</p>
                    <p className="font-campus-mono text-campus-xs text-campus-muted">{item.record.provenance}</p>
                  </div>
                  <Status tone={item.review.status} />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Academic Passport readiness */}
        <section aria-labelledby="passport-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="passport-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
              Academic Passport
            </h2>
            <Link href="/student/passport" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
              View <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {passport && latestPassportVersion ? (
            <Panel className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version {passport.currentVersion}</span>
                <Badge tone="gold">Verified</Badge>
              </div>
              <p className="font-campus-sans text-campus-sm text-campus-text">
                {latestPassportVersion.claims.length} verified capability {latestPassportVersion.claims.length === 1 ? 'claim' : 'claims'}, issued by {passport.verificationSeal.issuer}.
              </p>
            </Panel>
          ) : (
            <Panel>
              <p className="font-campus-sans text-campus-sm text-campus-muted">No Passport issued yet.</p>
            </Panel>
          )}
        </section>
      </div>

      {/* Notifications */}
      {latestPassportVersion && (
        <section aria-labelledby="notifications-heading">
          <h2 id="notifications-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Notifications
          </h2>
          <Card className="flex items-start gap-3 p-4">
            <Bell size={18} className="mt-0.5 text-campus-muted" aria-hidden="true" />
            <p className="font-campus-sans text-campus-sm text-campus-text">
              Your Academic Passport was reissued on {new Date(latestPassportVersion.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </Card>
        </section>
      )}
    </div>
  )
}
