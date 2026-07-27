import Link from 'next/link'
import { ArrowRight, Clock, Compass } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { ConceptReadinessMatrix } from '@/components/learning/visualizations/ConceptReadinessMatrix'
import { ChapterConceptMap } from '@/components/learning/visualizations/ChapterConceptMap'
import { LearningTrajectoryChart } from '@/components/learning/visualizations/LearningTrajectoryChart'
import { IndependenceProgression } from '@/components/learning/visualizations/IndependenceProgression'
import { EvidencePipelineVisual } from '@/components/learning/visualizations/EvidencePipelineVisual'
import { LearningOdysseyAlignment } from '@/components/learning/visualizations/LearningOdysseyAlignment'
import { buildStudentLearningProjection } from '@/lib/utilities/learning-projection'
import { learningPrerequisites } from '@/lib/mock-data/learning-seed'

export const metadata = { title: 'Learning — Syrka Campus' }

/**
 * The Learning command centre — a Learning Intelligence view, not a
 * course-card grid. Everything below reads from
 * buildStudentLearningProjection(), a projection over deterministic,
 * clearly-labelled Chapter 1 demonstration fixtures
 * (lib/mock-data/learning-seed.ts) — never real student data.
 */
export default function StudentLearningPage() {
  const projection = buildStudentLearningProjection()
  const prerequisitePairs: [string, string][] = learningPrerequisites
    .filter((p) => projection.concepts.some((c) => c.conceptId === p.conceptId))
    .map((p) => [p.conceptId, p.requiresConceptId])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Learning"
        subtitle="A Learning Intelligence view of your active coursework — demonstration content, deterministic and reviewable, not live student data."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Learning' }]} />}
      />

      {/* Active Learning Space */}
      <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Continue Learning
        </h2>
        <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                {projection.course.title} · {projection.chapter.title}
              </p>
              <h3 className="mt-1 font-campus-sans text-campus-xl font-semibold text-campus-text">{projection.lesson.title}</h3>
              <p className="mt-1 font-campus-sans text-campus-sm text-campus-muted">Current concept: {projection.currentConceptTitle}</p>
            </div>
            <Badge tone="neutral">{projection.space.lifecycleState}</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-campus-sm border border-campus-border p-3">
              <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Latest completed activity</p>
              <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{projection.latestCompletedActivity}</p>
            </div>
            <div className="rounded-campus-sm border border-campus-border p-3">
              <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Independence so far</p>
              <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{projection.independenceSummary}</p>
            </div>
          </div>

          {projection.unresolvedConcept && (
            <p className="mt-3 font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">Still needs work: {projection.unresolvedConcept}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-campus-border pt-4">
            <div className="flex items-center gap-3 font-campus-sans text-campus-xs text-campus-muted">
              <span className="flex items-center gap-1">
                <Clock size={13} aria-hidden="true" /> ~{projection.expectedTimeMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Compass size={13} aria-hidden="true" /> Next: {projection.nextRecommendedAction}
              </span>
            </div>
            <Link
              href="/student/learning/chapter-1"
              className="flex items-center gap-1.5 rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white hover:opacity-90 dark:bg-campus-stone-100 dark:text-campus-ink-950"
            >
              Continue Learning <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning trajectory */}
        <section aria-labelledby="trajectory-heading">
          <h2 id="trajectory-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Learning trajectory
          </h2>
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <LearningTrajectoryChart trajectory={projection.trajectory} />
          </div>
        </section>

        {/* Independence progression */}
        <section aria-labelledby="independence-heading">
          <h2 id="independence-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Independence progression
          </h2>
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <IndependenceProgression counts={projection.independenceCounts} totalAttempts={projection.trajectory.length} />
          </div>
        </section>
      </div>

      {/* Concept readiness */}
      <section aria-labelledby="concepts-heading">
        <h2 id="concepts-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Concept readiness
        </h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <ConceptReadinessMatrix concepts={projection.concepts} />
          </div>
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Chapter concept map</p>
            <ChapterConceptMap concepts={projection.concepts} prerequisites={prerequisitePairs} />
          </div>
        </div>
      </section>

      {/* Evidence pipeline */}
      <section aria-labelledby="evidence-pipeline-heading">
        <h2 id="evidence-pipeline-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          From Learning to portable proof
        </h2>
        <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
          <EvidencePipelineVisual stages={projection.evidencePipeline} />
        </div>
      </section>

      {/* Learning and Odyssey */}
      {projection.odysseyConnection && (
        <section aria-labelledby="odyssey-connection-heading">
          <h2 id="odyssey-connection-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Learning and Odyssey
          </h2>
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <LearningOdysseyAlignment
              lessonTitle={projection.lesson.title}
              capabilityName={projection.odysseyConnection.capabilityName}
              milestoneId={projection.odysseyConnection.milestoneId}
              milestoneTitle={projection.odysseyConnection.milestoneTitle}
            />
          </div>
        </section>
      )}
    </div>
  )
}
