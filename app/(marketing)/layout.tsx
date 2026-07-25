/**
 * Scaffolding for the Phase 2 public marketing site (landing page, etc).
 * No page.tsx yet: the legacy homepage still owns "/" (app/page.tsx).
 * Where the Campus marketing home ultimately lives — replacing "/" or a
 * distinct path — needs an explicit decision before Phase 2 begins.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
