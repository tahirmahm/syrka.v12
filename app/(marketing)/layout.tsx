import { CorporateNav } from '@/components/corporate/CorporateNav'
import { CorporateFooter } from '@/components/corporate/CorporateFooter'

/**
 * Chrome for the corporate Syrka homepage at "/" — the company and
 * five-product software architecture, not the Campus product itself.
 * Isolated syrka-* tokens only; Campus keeps its own campus-* system
 * and CampusShell/MarketingNav untouched under /campus and /student etc.
 */
export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-syrka-obsidian font-campus-sans text-syrka-offwhite">
      <CorporateNav />
      <main className="flex-1">{children}</main>
      <CorporateFooter />
    </div>
  )
}
