import Link from 'next/link'
import { BrandMark } from '@/components/ui/BrandMark'

export function MarketingFooter() {
  return (
    <footer className="border-t border-campus-border bg-campus-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <BrandMark />
        <p className="font-campus-sans text-campus-sm text-campus-muted">
          Institutional capability infrastructure. Built for institutional deployment.
        </p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/sign-in" className="font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
            Sign in
          </Link>
          <a href="#trust" className="font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
            Trust &amp; governance
          </a>
        </nav>
      </div>
    </footer>
  )
}
