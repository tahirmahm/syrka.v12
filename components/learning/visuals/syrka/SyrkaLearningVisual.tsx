import { ArrowDown, ArrowRight, ArrowsLeftRight } from '@phosphor-icons/react/dist/ssr'
import type { SemanticConceptModel, SemanticStage, VisualTemplateId } from '@/lib/campus-types/semantic-concept-model'
import { SyrkaIllustration } from './illustrations'

const ROLE_LABEL: Record<SemanticStage['role'], string> = {
  context: 'Context',
  problem: 'Problem',
  cause: 'Why it happens',
  mechanism: 'How it works',
  intervention: 'What changes it',
  outcome: 'Outcome',
}

function StageCard({ stage, tone }: { stage: SemanticStage; tone: 'neutral' | 'amber' | 'green' }) {
  const toneClasses =
    tone === 'amber'
      ? 'border-campus-amber-600/40 bg-campus-amber-600/5 dark:border-campus-amber-dark/40'
      : tone === 'green'
        ? 'border-campus-green-600/40 bg-campus-green-600/5 dark:border-campus-green-dark/40'
        : 'border-campus-border bg-campus-surface'
  return (
    <div className={`flex items-start gap-2.5 rounded-campus-sm border p-3 ${toneClasses}`}>
      {stage.illustrationId && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-campus-surface-raised text-campus-ink-950 dark:text-campus-stone-100">
          <SyrkaIllustration id={stage.illustrationId} size={18} />
        </span>
      )}
      <div>
        <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">{ROLE_LABEL[stage.role]}</p>
        <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{stage.proposition}</p>
      </div>
    </div>
  )
}

function BeforeAfterTemplate({ model }: { model: SemanticConceptModel }) {
  const before = model.stages.filter((s) => s.role === 'context' || s.role === 'problem' || s.role === 'cause')
  const after = model.stages.filter((s) => s.role === 'intervention' || s.role === 'outcome')
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="flex flex-col gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-amber-600 dark:text-campus-amber-dark">Before</p>
        {before.map((s) => (
          <StageCard key={s.id} stage={s} tone="amber" />
        ))}
      </div>
      <ArrowRight size={20} className="mx-auto hidden shrink-0 text-campus-muted sm:block" aria-hidden="true" />
      <ArrowDown size={20} className="mx-auto shrink-0 text-campus-muted sm:hidden" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-green-600 dark:text-campus-green-dark">After</p>
        {after.map((s) => (
          <StageCard key={s.id} stage={s} tone="green" />
        ))}
      </div>
    </div>
  )
}

function ProblemSolutionOutcomeTemplate({ model }: { model: SemanticConceptModel }) {
  const problem = model.stages.filter((s) => s.role === 'context' || s.role === 'problem' || s.role === 'cause')
  const intervention = model.stages.filter((s) => s.role === 'intervention')
  const outcome = model.stages.filter((s) => s.role === 'outcome')
  const buckets = (
    [
      { label: 'Problem', tone: 'amber', stages: problem },
      { label: 'Intervention', tone: 'neutral', stages: intervention },
      { label: 'Outcome', tone: 'green', stages: outcome },
    ] satisfies { label: string; tone: 'amber' | 'neutral' | 'green'; stages: SemanticStage[] }[]
  ).filter((b) => b.stages.length > 0)

  return (
    <div className="flex flex-col gap-3">
      {buckets.map((bucket, i) => (
        <div key={bucket.label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-campus-ink-950 font-campus-mono text-[10px] text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950">
              {i + 1}
            </span>
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{bucket.label}</p>
          </div>
          {bucket.stages.map((s) => (
            <StageCard key={s.id} stage={s} tone={bucket.tone} />
          ))}
          {i < buckets.length - 1 && <ArrowDown size={16} className="ml-2 text-campus-muted" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

function CausalChainTemplate({ model }: { model: SemanticConceptModel }) {
  return (
    <div className="flex flex-col gap-2">
      {model.stages.map((stage, i) => (
        <div key={stage.id} className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-campus-ink-950 font-campus-mono text-[10px] text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950">
              {i + 1}
            </span>
            <div className="flex-1">
              <StageCard stage={stage} tone="neutral" />
            </div>
          </div>
          {i < model.stages.length - 1 && <ArrowDown size={16} className="ml-2 text-campus-muted" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

/**
 * A real side-by-side comparison — two labelled columns, each holding the
 * stages tagged to that side (comparisonSide 'a'/'b'), with a short central
 * distinction summary between them. Used for any "X vs. Y" concept the
 * classifier detects (e.g. "Federal vs. unitary systems"), not only for
 * concepts with a bespoke interactive.
 */
function ComparisonColumnsTemplate({ model }: { model: SemanticConceptModel }) {
  const sideA = model.stages.filter((s) => s.comparisonSide === 'a')
  const sideB = model.stages.filter((s) => s.comparisonSide === 'b')
  const labels = model.comparisonLabels ?? { a: 'Side A', b: 'Side B' }
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
      <div className="flex flex-col gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">{labels.a}</p>
        {sideA.map((s) => (
          <StageCard key={s.id} stage={s} tone="neutral" />
        ))}
      </div>
      <div className="mx-auto hidden shrink-0 flex-col items-center gap-1 sm:flex" aria-hidden="true">
        <ArrowsLeftRight size={20} className="text-campus-muted" />
        <span className="font-campus-mono text-[9px] uppercase text-campus-faint">vs.</span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-green-600 dark:text-campus-green-dark">{labels.b}</p>
        {sideB.map((s) => (
          <StageCard key={s.id} stage={s} tone="neutral" />
        ))}
      </div>
    </div>
  )
}

/**
 * Renders the model's own actors and relationships as a real actor-flow
 * composition — each actor is an allowlisted illustration, each
 * relationship a full grounded sentence, never a generic node/edge graph.
 * Only used when the model actually names distinct actors and
 * relationships (e.g. "Functions of money"'s farmer / cloth seller / buyer).
 */
function ActorExchangeTemplate({ model }: { model: SemanticConceptModel }) {
  if (model.actors.length === 0) return <CausalChainTemplate model={model} />
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {model.actors.map((actor, i) => (
          <div key={actor.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 rounded-campus-sm border border-campus-border bg-campus-surface p-3">
              {actor.illustrationId && (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-campus-surface-raised text-campus-ink-950 dark:text-campus-stone-100">
                  <SyrkaIllustration id={actor.illustrationId} size={22} />
                </span>
              )}
              <p className="font-campus-sans text-campus-xs font-medium text-campus-text">{actor.label}</p>
            </div>
            {i < model.actors.length - 1 && <ArrowRight size={18} className="shrink-0 text-campus-muted" aria-hidden="true" />}
          </div>
        ))}
      </div>
      {model.relationships.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-campus-border pt-3">
          {model.relationships.map((rel) => {
            const from = model.actors.find((a) => a.id === rel.fromActorId)
            const to = model.actors.find((a) => a.id === rel.toActorId)
            return (
              <div key={rel.id} className="flex items-start gap-2 font-campus-sans text-campus-xs text-campus-text">
                <ArrowRight size={14} className="mt-0.5 shrink-0 text-campus-muted" aria-hidden="true" />
                <p>
                  <span className="font-medium">{from?.label ?? 'Someone'}</span> {rel.label}
                  {to ? <> to <span className="font-medium">{to.label}</span></> : null}.
                </p>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-campus-border pt-3">
        {model.stages.map((stage) => (
          <StageCard key={stage.id} stage={stage} tone="neutral" />
        ))}
      </div>
    </div>
  )
}

export interface SyrkaLearningVisualProps {
  model: SemanticConceptModel
  templateId: VisualTemplateId
}

/**
 * LEARN-002 visual-quality correction — renders a validated
 * SemanticConceptModel through a curated Syrka-owned template. Never
 * Mermaid, never a generic node/edge graph: every stage is a full
 * proposition with an optional allowlisted illustration, laid out by a
 * template chosen for its pedagogical shape (before/after, problem →
 * intervention → outcome, or a plain causal sequence).
 */
export function SyrkaLearningVisual({ model, templateId }: SyrkaLearningVisualProps) {
  if (templateId === 'before_after') return <BeforeAfterTemplate model={model} />
  if (templateId === 'problem_solution_outcome') return <ProblemSolutionOutcomeTemplate model={model} />
  if (templateId === 'comparison_columns') return <ComparisonColumnsTemplate model={model} />
  if (templateId === 'actor_exchange') return <ActorExchangeTemplate model={model} />
  return <CausalChainTemplate model={model} />
}
