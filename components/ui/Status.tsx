import { CheckCircle, Clock, WarningCircle, XCircle } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import { Badge, type BadgeTone } from './Badge'

export type StatusTone = 'pending' | 'verified' | 'disputed' | 'revoked'

const toneConfig: Record<StatusTone, { badgeTone: BadgeTone; icon: Icon; label: string }> = {
  pending: { badgeTone: 'amber', icon: Clock, label: 'Pending' },
  verified: { badgeTone: 'green', icon: CheckCircle, label: 'Verified' },
  disputed: { badgeTone: 'red', icon: WarningCircle, label: 'Disputed' },
  revoked: { badgeTone: 'neutral', icon: XCircle, label: 'Revoked' },
}

export interface StatusProps {
  tone: StatusTone
  label?: string
}

/** Evidence/capability status — icon + text together, never color alone. */
export function Status({ tone, label }: StatusProps) {
  const config = toneConfig[tone]
  const IconComponent = config.icon
  return (
    <Badge tone={config.badgeTone} className="gap-1">
      <IconComponent size={12} weight="bold" aria-hidden="true" />
      {label ?? config.label}
    </Badge>
  )
}
