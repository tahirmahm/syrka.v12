import Link from 'next/link'
import { CheckCircle, Circle } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { EquationWorkbench } from '@/components/learning/EquationWorkbench'
import { DeterministicTutorPanel } from '@/components/learning/DeterministicTutorPanel'
import { EvidencePipelineVisual } from '@/components/learning/visualizations/EvidencePipelineVisual'
import { LearningWorkbenchMobileControls } from '@/components/learning/LearningWorkbenchMobileControls'
import { buildStudentLearningProjection, getLessonWorkbenchContent } from '@/lib/utilities/learning-projection'

export const metadata = { title: 'Balancing Chemical Equations — Syrka Campus' }

/**
 * The lesson workbench: a real workbench, not an article with cards
 * around it. Desktop: navigator / teaching canvas / Learning Intelligence
 * inspector, three genuinely distinct panes. Every fact shown traces to
 * the same deterministic Chapter 1 fixtures as the command centre.
 */
export default function Chapter1LessonPage() {
  const projection = buildStudentLearningProjection()
  const { lesson, concept, explanation, example, equation, transferQuestion } = getLessonWorkbenchContent()

  const navigatorContent = (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Chapter sections</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          <li className="flex items-center gap-1.5 rounded-campus-sm bg-campus-surface-raised px-2 py-1.5 font-campus-sans text-campus-sm text-campus-text">
            <CheckCircle size={13} weight="fill" className="text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" /> Why equations must balance
          </li>
        </ul>
      </div>
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Concepts</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {projection.concepts.map((c) => (
            <li key={c.conceptId} className="flex items-center gap-1.5 px-2 py-1.5 font-campus-sans text-campus-sm text-campus-text">
              <Circle size={10} className="text-campus-muted" aria-hidden="true" /> {c.title}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Evidence missions</p>
        <p className="mt-1.5 px-2 font-campus-sans text-campus-xs text-campus-muted">Independent transfer on this lesson is Evidence-eligible once reviewed.</p>
      </div>
    </div>
  )

  const inspectorContent = (
    <>
      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Current Tutor state</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
          {projection.activeSession ? `${projection.activeSession.mode} · ${projection.activeSession.currentState}` : 'No active session'}
        </p>
        <p className="mt-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Concept relationships</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{concept.title} builds on Conservation of mass.</p>
      </div>

      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Observation summary</p>
        <Badge tone="blue">{projection.independenceSummary}</Badge>
      </div>

      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Evidence readiness</p>
        <EvidencePipelineVisual stages={projection.evidencePipeline.slice(0, 3)} />
      </div>

      {projection.odysseyConnection && (
        <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
          <p className="mb-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Odyssey connection</p>
          <Link href={`/student/odyssey?milestone=${projection.odysseyConnection.milestoneId}`} className="font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
            {projection.odysseyConnection.milestoneTitle}
          </Link>
        </div>
      )}

      <DeterministicTutorPanel odysseyConnection={projection.odysseyConnection} evidencePipeline={projection.evidencePipeline} />
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={lesson.title}
        subtitle={`${projection.course.title} · ${projection.chapter.title}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Learning', href: '/student/learning' }, { label: lesson.title }]} />}
      />

      <LearningWorkbenchMobileControls navigator={navigatorContent} inspector={inspectorContent} />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Chapter and lesson navigator — desktop only; mobile reaches this via the Drawer above */}
        <nav aria-label="Chapter navigator" className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-3 lg:self-start">
          {navigatorContent}
        </nav>

        {/* Primary learning workspace — always in view, mobile's central activity */}
        <div className="flex flex-col gap-4">
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Original Syrka lesson content</p>
            <p className="mt-2 font-campus-sans text-campus-base text-campus-text">{explanation?.body}</p>
            {equation && <p className="mt-3 rounded-campus-sm bg-campus-surface-raised p-3 text-center font-campus-mono text-campus-sm text-campus-text">{equation.expression}</p>}
          </div>

          {example && (
            <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
              <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Worked example</p>
              <p className="mt-2 font-campus-sans text-campus-sm text-campus-text">{example.prompt}</p>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 font-campus-sans text-campus-sm text-campus-text">
                {example.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <EquationWorkbench />

          {transferQuestion && (
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Transfer question on record: {transferQuestion.prompt}</p>
          )}
        </div>

        {/* Learning Intelligence inspector — desktop only; mobile reaches this via the bottom sheet above */}
        <aside className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-4 lg:self-start">
          {inspectorContent}
        </aside>
      </div>
    </div>
  )
}
