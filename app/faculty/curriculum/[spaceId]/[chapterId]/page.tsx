import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { STRATEGY_LABEL } from '@/lib/services/learning/pedagogical-strategies'
import { getNcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'
import { getFacultyChapterDetail } from '@/lib/utilities/faculty-adaptive-projection'
import { formatDate } from '@/lib/utilities/format-relative-time'

export async function generateMetadata({ params }: { params: { spaceId: string; chapterId: string } }) {
  const chapter = getNcertChapterView(params.spaceId, params.chapterId)
  return chapter ? { title: `${chapter.title} — Faculty — Syrka Campus` } : {}
}

/** Read-only Faculty inspection of one chapter — curriculum structure always; adaptive Tutor intelligence, attempts, assistance history, and Evidence provenance only for the four representative chapters that have it. */
export default function FacultyChapterIntelligencePage({ params }: { params: { spaceId: string; chapterId: string } }) {
  const chapter = getNcertChapterView(params.spaceId, params.chapterId)
  if (!chapter) notFound()
  const detail = getFacultyChapterDetail(chapter.chapterId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={chapter.title}
        subtitle={`${chapter.spaceTitle} · Chapter ${chapter.order} — read-only Faculty inspection.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Curriculum', href: '/faculty/curriculum' }, { label: chapter.title }]} />}
      />

      <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Concepts and learning objectives</p>
        <ul className="mt-2 flex flex-col gap-2">
          {chapter.concepts.map((c) => (
            <li key={c.id}>
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{c.title}</p>
              <p className="font-campus-sans text-campus-xs text-campus-muted">{c.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-campus-border pt-3 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Source citation</p>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{chapter.citation.bookTitle}, p.{chapter.citation.page}</p>
        <p className="font-campus-mono text-[10px] text-campus-muted">No extraction warnings recorded for this chapter&rsquo;s citation page.</p>
      </section>

      {!detail ? (
        <section className="rounded-campus-md border border-dashed border-campus-border p-5">
          <p className="font-campus-sans text-campus-sm text-campus-muted">
            No adaptive session history exists for this chapter yet — it is one of the 22 chapters that has curriculum structure and a chapter-aware Tutor but no fabricated multi-session history (IAU-001 §12).
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Adaptation decisions ({detail.learnerModel.decisions.length} sessions)</p>
            <ol className="flex flex-col gap-3">
              {detail.learnerModel.decisions.map((d, i) => (
                <li key={d.id} className="rounded-campus-sm border border-campus-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Session {i + 1}</Badge>
                    <Badge tone="blue">{STRATEGY_LABEL[d.strategy]}</Badge>
                    <Badge tone={d.uncertainty === 'low' ? 'green' : d.uncertainty === 'moderate' ? 'amber' : 'red'}>{d.uncertainty} uncertainty</Badge>
                  </div>
                  <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-text">{d.reason}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Attempts and assistance history</p>
            <table className="w-full text-left font-campus-sans text-campus-xs">
              <thead>
                <tr className="border-b border-campus-border text-campus-muted">
                  <th className="py-1 pr-2 font-campus-mono text-[10px] uppercase tracking-wide">Submitted</th>
                  <th className="py-1 pr-2 font-campus-mono text-[10px] uppercase tracking-wide">Independence</th>
                  <th className="py-1 pr-2 font-campus-mono text-[10px] uppercase tracking-wide">Hints used</th>
                  <th className="py-1 font-campus-mono text-[10px] uppercase tracking-wide">Correct</th>
                </tr>
              </thead>
              <tbody>
                {detail.attempts.map((a) => (
                  <tr key={a.id} className="border-b border-campus-border last:border-0">
                    <td className="py-1.5 pr-2 text-campus-text">{formatDate(a.submittedAt)}</td>
                    <td className="py-1.5 pr-2 text-campus-text">{a.independenceLevel.replace(/_/g, ' ')}</td>
                    <td className="py-1.5 pr-2 text-campus-text">{a.hintLevelUsed}</td>
                    <td className="py-1.5 text-campus-text">{a.correct ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Recurring misconceptions</p>
            {detail.misconceptions.map((m) => (
              <p key={m.id} className="font-campus-sans text-campus-xs text-campus-text">{m.description} <span className="text-campus-muted">(recurrence: {m.recurrenceCount})</span></p>
            ))}
          </section>

          <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Evidence candidate and review provenance</p>
            <p className="font-campus-sans text-campus-xs text-campus-text">{detail.evidenceCandidate.rationale}</p>
            <p className="mt-1 font-campus-mono text-[10px] text-campus-muted">
              Authority: {detail.provenance.authorityClass.replace(/_/g, ' ')} · Confidence: {detail.capabilityInference.confidence.band} ({Math.round(detail.capabilityInference.confidence.score * 100)}%)
            </p>
          </section>

          <section className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">AI-use disclosure</p>
            <p className="font-campus-sans text-campus-xs text-campus-text">{detail.aiUse.disclosure.toolOrTutorUsed} — {detail.aiUse.disclosure.declaredPurpose}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={detail.aiUse.assistanceRecord.judgement === 'independent_orchestration' ? 'green' : 'neutral'}>{(detail.aiUse.assistanceRecord.judgement ?? 'insufficient_evidence').replace(/_/g, ' ')}</Badge>
              <span className="font-campus-mono text-[10px] text-campus-muted">{detail.aiUse.assistanceRecord.facultyNote}</span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
