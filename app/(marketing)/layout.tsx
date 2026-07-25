import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

/**
 * Shared chrome for the Campus public marketing site. The landing page
 * itself is built at (marketing)/campus-preview for review; once approved
 * it moves to (marketing)/page.tsx to take over "/" — this layout applies
 * either way without change.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-campus-bg text-campus-text">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
