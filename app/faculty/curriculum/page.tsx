import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { getNcertSubjects } from '@/lib/utilities/ncert-curriculum-projection'
import { listFacultyChapterIntelligence } from '@/lib/utilities/faculty-adaptive-projection'

export const metadata = { title: 'Curriculum — Syrka Campus' }

/**
 * A read-only Faculty curriculum browser — deliberately separate from
 * the gated, in-memory /faculty/learning-spaces production-authoring
 * workspace (which 404s unless LEARNING_AUTHORING_ENABLED is set).
 * This route only ever reads the already-published NCERT curriculum;
 * it has no upload, edit, or approval action anywhere on it.
 */
export default function FacultyCurriculumPage() {
  const subjects = getNcertSubjects()
  const adaptiveIntelligence = listFacultyChapterIntelligence()
  const adaptiveChapterIds = new Set(adaptiveIntelligence.map((i) => i.chapterId))

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Curriculum"
        subtitle="Read-only view of the published NCERT Class X curriculum across your courses — inspect structure, source citations, and (where available) adaptive Tutor intelligence."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Curriculum' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <div key={subject.spaceId} className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{subject.title}</p>
            <p className="mt-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{subject.chapters.length} chapters</p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {subject.chapters.map((c) => (
                <li key={c.chapterId}>
                  <Link
                    href={`/faculty/curriculum/${subject.spaceId}/${c.chapterId}`}
                    className="flex items-center justify-between gap-2 rounded-campus-sm px-1.5 py-1 font-campus-sans text-campus-xs text-campus-text hover:bg-campus-surface-raised hover:text-campus-blue-600 dark:hover:text-campus-blue-dark"
                  >
                    <span className="truncate">{c.order}. {c.title}</span>
                    {adaptiveChapterIds.has(c.chapterId) && <Badge tone="blue">Adaptive intelligence</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
