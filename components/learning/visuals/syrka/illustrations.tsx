import {
  Plant, Storefront, User, Coins, ArrowsLeftRight, FileText, Bank, Leaf, ArrowRight, Tree, Buildings, Files, ChatCircleText, CheckCircle,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import type { SyrkaIllustrationId } from '@/lib/campus-types/semantic-concept-model'

/**
 * LEARN-002 visual-quality correction — the allowlisted illustration
 * set. DeepSeek (or a deterministic builder) may select one of these
 * ids; it can never emit new SVG, an external image URL, or arbitrary
 * markup. Built from Phosphor icons already vendored in this project —
 * no new remote asset fetch.
 */
const ILLUSTRATION_ICON: Record<SyrkaIllustrationId, Icon> = {
  farmer: Plant,
  shopkeeper: Storefront,
  buyer: User,
  coins: Coins,
  barter_exchange: ArrowsLeftRight,
  document: FileText,
  institution: Bank,
  resource: Leaf,
  exchange_arrows: ArrowRight,
  environment: Tree,
  government: Buildings,
  evidence: Files,
  claim: ChatCircleText,
  outcome_check: CheckCircle,
}

export function SyrkaIllustration({ id, size = 22, className = '' }: { id: SyrkaIllustrationId; size?: number; className?: string }) {
  const Icon = ILLUSTRATION_ICON[id]
  return <Icon size={size} weight="duotone" className={className} />
}
