import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

/**
 * Shared chrome for the Syrka Campus product marketing site at /campus.
 * "/" itself is now the corporate Syrka homepage (app/(marketing)/*),
 * which presents Campus as one of five products rather than the entire
 * company; this page is the dedicated Campus product deep-dive it links to.
 */
export default function CampusMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-campus-bg text-campus-text">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
