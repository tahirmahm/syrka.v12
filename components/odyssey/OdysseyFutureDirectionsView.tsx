import { Panel } from '@/components/ui/Panel'

export interface OdysseyFutureDirectionEntry {
  subject: string
  capabilityName: string
  advisory: string
}

export interface OdysseyFutureDirectionsViewProps {
  directions: OdysseyFutureDirectionEntry[]
  missingSubjects: string[]
}

/**
 * Exploratory, explicitly non-deterministic — the one view allowed to
 * speak in "might," never "will." Every entry still traces to a real,
 * reviewed-Evidence-backed Capability from the supplied curriculum; this
 * is never where a career or stream is predicted. The missing-subjects
 * disclosure is not a footnote — it is load-bearing to the honesty of
 * this view, so it renders first, not last.
 */
export function OdysseyFutureDirectionsView({ directions, missingSubjects }: OdysseyFutureDirectionsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-campus-amber-600 dark:border-campus-amber-dark">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-amber-600 dark:text-campus-amber-dark">Incomplete by design</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
          {missingSubjects.join(', ')} and other Class X curriculum areas are not yet represented in this demonstration, so this view is necessarily incomplete — it reflects only what these four subjects&apos; reviewed Evidence can currently suggest.
        </p>
      </Panel>

      <Panel>
        <p className="font-campus-sans text-campus-sm text-campus-text">
          Your reviewed work currently shows emerging strength across the following areas. This is exploratory, not a prediction — never a guaranteed stream, career, or employability outcome, and never a measure of fixed potential or personality fit.
        </p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {directions.map((d) => (
          <Panel key={d.subject} className="flex flex-col gap-1.5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{d.subject} · {d.capabilityName}</p>
            <p className="font-campus-sans text-campus-sm text-campus-text">{d.advisory}</p>
          </Panel>
        ))}
      </div>
    </div>
  )
}
