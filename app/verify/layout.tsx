import Link from 'next/link'
import { BrandMark } from '@/components/ui/BrandMark'

/**
 * A minimal public shell for verification routes — no authenticated-app
 * rail, no marketing chrome. This is what a QR scan or a shared link opens
 * into, so it stays deliberately quiet: identity, the verified content,
 * and a way back to Syrka, nothing else competing for attention.
 */
export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-campus-bg text-campus-text">
      <header className="border-b border-campus-border px-6 py-4 md:px-10">
        <Link href="/campus" aria-label="Syrka Campus">
          <BrandMark />
        </Link>
      </header>
      <main className="flex-1 px-6 py-10 md:px-10 md:py-16">{children}</main>
      <footer className="border-t border-campus-border px-6 py-6 text-center font-campus-sans text-campus-xs text-campus-muted md:px-10">
        Independently verifiable at this address — no sign-in required.
      </footer>
    </div>
  )
}
