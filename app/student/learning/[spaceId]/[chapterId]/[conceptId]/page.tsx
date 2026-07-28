import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft, CaretRight, CheckCircle, Circle } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { LearningWorkbenchMobileControls } from '@/components/learning/LearningWorkbenchMobileControls'
import { ConceptWorkbench } from '@/components/learning/ConceptWorkbench'
import { getAllNcertConceptRoutes, getNcertConceptView, getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'

export function generateStaticParams() {
  return getAllNcertConceptRoutes().map((r) => ({ spaceId: r.spaceId, chapterId: r.chapterId, conceptId: r.conceptId }))
}

export async function generateMetadata({ params }: { params: { spaceId: string; chapterId: string; conceptId: string } }) {
  const view = getNcertConceptView(params.spaceId, params.chapterId, params.conceptId)
  if (!view) return {}
  return { title: `${view.title} — Syrka Campus` }
}

/**
 * CLASSX-001 §3 — the canonical concept-level Learning route
 * (/student/learning/[spaceId]/[chapterId]/[conceptId]), resolving all
 * 52 concepts across all 26 supplied chapters through one reusable
 * ConceptWorkbench rather than a hand-written page per concept.
 */
export default function NcertConceptPage({ params }: { params: { spaceId: string; chapterId: string; conceptId: string } }) {
  const view = getNcertConceptView(params.spaceId, params.chapterId, params.conceptId)
  if (!view) notFound()
  const chapter = getNcertChapterView(params.spaceId, params.chapterId)

  const navigatorContent = (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{view.chapterTitle}</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {chapter?.concepts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/student/learning/${view.spaceId}/${view.chapterId}/${c.id}`}
                className={`flex items-center gap-1.5 rounded-campus-sm px-2 py-1.5 font-campus-sans text-campus-sm ${
                  c.id === view.conceptId ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                }`}
              >
                {c.id === view.conceptId ? (
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-campus-blue-600 dark:text-campus-blue-dark" aria-hidden="true" />
                ) : (
                  <Circle size={10} className="shrink-0 text-campus-muted" aria-hidden="true" />
                )}
                <span className="truncate">{c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link href={`/student/learning/${view.spaceId}/${view.chapterId}`} className="font-campus-sans text-campus-xs text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
        ← Back to chapter overview
      </Link>
    </div>
  )

  const inspectorContent = (
    <>
      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Capability relationship</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{view.capability.name}</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{view.capability.domain}</p>
      </div>
      <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Source citation</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{view.citation.bookTitle}, p.{view.citation.page}</p>
        <p className="mt-1 font-campus-mono text-[10px] text-campus-muted">{view.citation.sourceLabel}</p>
      </div>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={view.title}
        subtitle={`${view.subject} · ${view.chapterTitle} · Chapter ${view.chapterOrder}`}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/student' },
              { label: 'Learning', href: '/student/learning' },
              { label: view.chapterTitle, href: `/student/learning/${view.spaceId}/${view.chapterId}` },
              { label: view.title },
            ]}
          />
        }
      />

      <LearningWorkbenchMobileControls navigator={navigatorContent} inspector={inspectorContent} />

      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Concept navigator" className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-3 lg:self-start">
          {navigatorContent}
          <div className="flex flex-col gap-3">{inspectorContent}</div>
        </nav>

        <div className="flex flex-col gap-4">
          <ConceptWorkbench view={view} />

          <div className="mt-2 flex items-center justify-between border-t border-campus-border pt-4">
            {view.prevConcept ? (
              <Link href={`/student/learning/${view.prevConcept.spaceId}/${view.prevConcept.chapterId}/${view.prevConcept.conceptId}`} className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                <CaretLeft size={14} aria-hidden="true" /> {view.prevConcept.title}
              </Link>
            ) : (
              <span />
            )}
            {view.nextConcept && (
              <Link href={`/student/learning/${view.nextConcept.spaceId}/${view.nextConcept.chapterId}/${view.nextConcept.conceptId}`} className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
                {view.nextConcept.title} <CaretRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
