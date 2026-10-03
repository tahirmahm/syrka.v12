import { CheckCircle, Circle, Hourglass, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import type { EvidencePipelineStage } from '@/lib/utilities/learning-projection'

const STATUS_ICON = {
  complete: { icon: CheckCircle, accentClass: 'text-campus-green-600 dark:text-campus-green-dark' },
  pending: { icon: Hourglass, accentClass: 'text-campus-amber-600 dark:text-campus-amber-dark' },
  not_reached: { icon: Circle, accentClass: 'text-campus-muted' },
} as const

export interface EvidencePipelineVisualProps {
  stages: EvidencePipelineStage[]
}

/**
 * Answers "what could become Evidence, and how far has it gone?" — the
 * real path from one lesson activity to Career Passport eligibility,
 * stage by stage, with each stage's status traced to a real record
 * (EvidencePipelineStage.detail), never inferred.
 */
export function EvidencePipelineVisual({ stages }: EvidencePipelineVisualProps) {
  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-1.5 overflow-x-auto">
        {stages.map((stage, i) => {
          const config = STATUS_ICON[stage.status]
          const Icon = config.icon
          return (
            <div key={stage.id} className="flex items-center gap-1.5">
              <div className={`flex min-w-[112px] flex-col items-center gap-1 rounded-campus-sm border px-2 py-2 text-center ${stage.status === 'complete' ? 'border-campus-green-600/40 dark:border-campus-green-dark/40' : 'border-campus-border'}`}>
                <Icon size={16} weight={stage.status === 'complete' ? 'fill' : 'regular'} className={config.accentClass} aria-hidden="true" />
                <p className="font-campus-sans text-[11px] font-medium leading-tight text-campus-text">{stage.label}</p>
              </div>
              {i < stages.length - 1 && <ArrowRight size={13} className="shrink-0 text-campus-muted" aria-hidden="true" />}
            </div>
          )
        })}
      </div>
      <dl className="mt-3 flex flex-col gap-1">
        {stages.map((stage) => (
          <div key={stage.id} className="flex gap-2 font-campus-sans text-campus-xs">
            <dt className="w-40 shrink-0 text-campus-muted">{stage.label}</dt>
            <dd className="text-campus-text">{stage.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
