import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft, CaretRight, CheckCircle, Circle } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { LearningWorkbenchMobileControls } from '@/components/learning/LearningWorkbenchMobileControls'
import { NcertChapterTutorPanel } from '@/components/learning/NcertChapterTutorPanel'
import { AdaptiveLearningSection } from '@/components/learning/AdaptiveLearningSection'
import { getNcertSubjects, getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'
import { getAdaptiveChapterView } from '@/lib/utilities/adaptive-learning-projection'

export function generateStaticParams() {
  return getNcertSubjects().flatMap((s) => s.chapters.map((c) => ({ spaceId: s.spaceId, chapterId: c.chapterId })))
}

export async function generateMetadata({ params }: { params: { spaceId: string; chapterId: string } }) {
  const chapter = getNcertChapterView(params.spaceId, params.chapterId)
  if (!chapter) return {}
  return { title: `${chapter.title} — Syrka Campus` }
}

const ACTIVITY_KIND_LABEL: Record<string, string> = {
  practical: 'Practical activity',
  discussion: 'Discussion activity',
  writing: 'Writing activity',
  project: 'Project activity',
  revision_card: 'Revision activity',
}

/**
 * The canonical NCERT chapter workbench — the same navigator / teaching
 * canvas / Learning Intelligence inspector shape as the Chemistry
 * chapter-1 vertical slice (components/learning/LearningWorkbenchMobileControls
 * gives it the identical mobile chapter-drawer + Learning Intelligence
 * bottom-sheet behaviour), generalised to resolve any of the 26 supplied
 * chapters by [spaceId]/[chapterId] instead of one hard-coded route.
 */
export default function NcertChapterPage({ params }: { params: { spaceId: string; chapterId: string } }) {
  const chapter = getNcertChapterView(params.spaceId, params.chapterId)
  if (!chapter) notFound()

  const adaptiveView = getAdaptiveChapterView(chapter.chapterId)
  const subjects = getNcertSubjects()
  const thisSubject = subjects.find((s) => s.spaceId === chapter.spaceId)

  const navigatorContent = (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{chapter.spaceTitle}</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {thisSubject?.chapters.map((c) => (
            <li key={c.chapterId}>
              <Link
                href={`/student/learning/${chapter.spaceId}/${c.chapterId}`}
                className={`flex items-center gap-1.5 rounded-campus-sm px-2 py-1.5 font-campus-sans text-campus-sm ${
                  c.chapterId === chapter.chapterId ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                }`}
              >
                {c.chapterId === chapter.chapterId ? (
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" />
                ) : (
                  <Circle size={10} className="shrink-0 text-campus-muted" aria-hidden="true" />
                )}
                <span className="truncate">{c.order}. {c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Other subjects</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {subjects
            .filter((s) => s.spaceId !== chapter.spaceId)
            .map((s) => (
              <li key={s.spaceId}>
                <Link href={`/student/learning`} className="block px-2 py-1 font-campus-sans text-campus-xs text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                  {s.title}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )

  const inspectorContent = (
    <>
      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Capability relationship</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{chapter.capability.name}</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{chapter.capability.description}</p>
      </div>

      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Odyssey connection</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{chapter.capability.pathwayAdvisory}</p>
        {adaptiveView && (
          <>
            <p className="mt-2 border-t border-campus-border pt-2 font-campus-sans text-campus-xs text-campus-text">
              Your preparedness signal here moved because of the Evidence from Session 3 — independent transfer to a new context, confirmed by a delayed retention check — not from completing the chapter alone.
            </p>
            <p className="mt-1 font-campus-mono text-[10px] text-campus-muted">Still missing: this is one concept in one chapter — broader term-level development in {chapter.subject} is not yet demonstrated. This is a preparedness signal, never a career prediction.</p>
          </>
        )}
      </div>

      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Source citation</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">
          {chapter.citation.bookTitle}, p.{chapter.citation.page}
        </p>
        <p className="mt-1 font-campus-mono text-[10px] text-campus-muted">{chapter.citation.sourceLabel}</p>
      </div>

      <NcertChapterTutorPanel chapter={chapter} />
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={chapter.title}
        subtitle={`${chapter.spaceTitle} · Chapter ${chapter.order}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Learning', href: '/student/learning' }, { label: chapter.title }]} />}
      />

      <LearningWorkbenchMobileControls navigator={navigatorContent} inspector={inspectorContent} />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <nav aria-label="Chapter navigator" className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-3 lg:self-start">
          {navigatorContent}
        </nav>

        <div className="flex flex-col gap-4">
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Chapter overview</p>
            <p className="mt-2 font-campus-sans text-campus-base text-campus-text">{chapter.overview}</p>
            {adaptiveView && (
              <p className="mt-3 border-t border-campus-border pt-3 font-campus-sans text-campus-xs text-campus-muted">
                Current session goal: <span className="text-campus-text">{adaptiveView.sessions[adaptiveView.sessions.length - 1].goal}</span> for {adaptiveView.conceptTitle} — this session builds directly on what the last one showed.
              </p>
            )}
          </div>

          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Concept sequence</p>
            <ol className="mt-2 flex flex-col gap-2">
              {chapter.concepts.map((concept, i) => (
                <li key={concept.id}>
                  <Link
                    href={`/student/learning/${chapter.spaceId}/${chapter.chapterId}/${concept.id}`}
                    className="flex items-start gap-3 rounded-campus-sm border border-campus-border p-3 hover:bg-campus-surface-raised"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-campus-border font-campus-mono text-[10px] text-campus-muted">{i + 1}</span>
                    <span>
                      <span className="block font-campus-sans text-campus-sm font-medium text-campus-text">{concept.title}</span>
                      <span className="block font-campus-sans text-campus-xs text-campus-muted">{concept.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
            Recommended: start with &ldquo;{chapter.concepts[0]?.title}&rdquo; — each concept opens its own Learn/Try/Test workbench.
          </p>

          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{chapter.example.prompt}</p>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 font-campus-sans text-campus-sm text-campus-text">
              {chapter.example.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <Badge tone="blue">{ACTIVITY_KIND_LABEL[chapter.activity.kind] ?? 'Activity'}</Badge>
            <p className="mt-2 font-campus-sans text-campus-base font-medium text-campus-text">{chapter.activity.title}</p>
            <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{chapter.activity.instructions}</p>
          </div>

          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Transfer question: {chapter.transferQuestion}</p>

          {adaptiveView && <AdaptiveLearningSection view={adaptiveView} chapterTitle={chapter.title} />}

          <div className="mt-2 flex items-center justify-between border-t border-campus-border pt-4">
            {chapter.prevChapter ? (
              <Link href={`/student/learning/${chapter.prevChapter.spaceId}/${chapter.prevChapter.chapterId}`} className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                <CaretLeft size={14} aria-hidden="true" /> {chapter.prevChapter.title}
              </Link>
            ) : (
              <span />
            )}
            {chapter.nextChapter && (
              <Link href={`/student/learning/${chapter.nextChapter.spaceId}/${chapter.nextChapter.chapterId}`} className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                {chapter.nextChapter.title} <CaretRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-4 lg:self-start">{inspectorContent}</aside>
      </div>
    </div>
  )
}
