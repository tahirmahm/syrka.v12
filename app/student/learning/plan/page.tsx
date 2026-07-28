import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FilterBar } from '@/components/ui/FilterBar'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { learningProviders } from '@/lib/services/learning/providers'
import { buildPlanCandidates, getPlanHorizonSummary, type PlanHorizon } from '@/lib/utilities/learning-plan-projection'

export const metadata = { title: 'Learning Plan — Syrka Campus' }

const HORIZONS: { value: PlanHorizon; label: string }[] = [
  { value: 'interaction', label: 'Right now' },
  { value: 'session', label: 'This session' },
  { value: 'week', label: 'This week' },
  { value: 'chapter', label: 'Current chapter' },
  { value: 'term', label: 'This term' },
]

const RESULT_CATEGORY_LABEL: Record<string, string> = {
  deepseek_live: 'Generated with DeepSeek V4-Pro',
  deepseek_cached: 'Generated with DeepSeek V4-Pro · cached',
  deterministic_unavailable: 'DeepSeek unavailable · Syrka fallback',
  deterministic_not_configured: 'AI provider not configured · Syrka fallback',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{label}</dt>
      <dd className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{value}</dd>
    </div>
  )
}

export default async function StudentLearningPlanPage({ searchParams }: { searchParams: { horizon?: string } }) {
  const horizon = (HORIZONS.some((h) => h.value === searchParams.horizon) ? searchParams.horizon : 'week') as PlanHorizon
  const candidates = buildPlanCandidates(horizon)
  const plan = await learningProviders.learningPlan.generatePlan({ horizon, candidates })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Learning Plan"
        subtitle={getPlanHorizonSummary(horizon)}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Learning', href: '/student/learning' }, { label: 'Plan' }]} />}
        actions={<Badge tone="neutral">{RESULT_CATEGORY_LABEL[plan.trace.resultCategory ?? 'deterministic_not_configured']}</Badge>}
      />

      <FilterBar
        label="Horizon"
        options={HORIZONS.map((h) => ({ label: h.label, href: `/student/learning/plan?horizon=${h.value}`, active: h.value === horizon }))}
      />

      {plan.steps.length === 0 ? (
        <Panel>
          <p className="font-campus-sans text-campus-sm text-campus-muted">Nothing to plan for this horizon right now.</p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          {plan.steps.map((step, i) => (
            <Panel key={`${step.conceptHref}-${i}`} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{step.subject} — {step.chapterTitle}</p>
                  <p className="mt-0.5 font-campus-sans text-campus-base font-medium text-campus-text">{step.action}</p>
                </div>
                <Badge tone="blue">~{step.expectedDurationMinutes} min</Badge>
              </div>

              <p className="font-campus-sans text-campus-sm text-campus-text">{step.reason}</p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-campus-border pt-4">
                <Row label="Previous observation" value={step.previousObservation} />
                <Row label="Planned representation" value={step.plannedRepresentation.replace(/_/g, ' ')} />
                <Row label="Assessment purpose" value={step.assessmentPurpose} />
                <Row label="Permitted support" value={step.permittedSupport} />
                <Row label="Expected signal" value={step.expectedSignal} />
                <Row label="What would cause replanning" value={step.replanningTrigger} />
              </dl>

              <div className="flex flex-col gap-2 border-t border-campus-border pt-4">
                <p className="font-campus-sans text-campus-xs text-campus-muted"><span className="font-medium text-campus-text">Evidence: </span>{step.evidenceImplication}</p>
                <p className="font-campus-sans text-campus-xs text-campus-muted"><span className="font-medium text-campus-text">Odyssey: </span>{step.odysseyImplication}</p>
              </div>

              <Link href={step.conceptHref} className="font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                Open {step.conceptTitle} →
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
