import Image from 'next/image'
import Link from 'next/link'

const SOFTWARE_LINKS = [
  { href: '#campus', label: 'Syrka Campus' },
  { href: '#odyssey', label: 'Syrka Odyssey' },
  { href: '#passport', label: 'Syrka Career Passport' },
  { href: '#praxis', label: 'Syrka Praxis' },
  { href: '#maxima', label: 'Syrka Maxima' },
]

export function CorporateFooter() {
  return (
    <footer className="border-t border-syrka-hairline bg-syrka-obsidian">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Image src="/brand/syrka-logo.png" alt="Syrka" width={2172} height={724} className="h-6 w-auto" />
            <p className="mt-4 max-w-sm font-campus-sans text-campus-sm text-syrka-steel">
              The operating system for human capability — from academic Evidence to national capability strategy.
            </p>
          </div>
          <div>
            <p className="font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Software</p>
            <nav className="mt-3 flex flex-col gap-2">
              {SOFTWARE_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="font-campus-sans text-campus-sm text-syrka-offwhite hover:text-syrka-signal">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Company</p>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="#trust" className="font-campus-sans text-campus-sm text-syrka-offwhite hover:text-syrka-signal">
                Trust &amp; governance
              </a>
              <Link href="/sign-in" className="font-campus-sans text-campus-sm text-syrka-offwhite hover:text-syrka-signal">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-12 border-t border-syrka-hairline pt-6">
          <p className="font-campus-mono text-[11px] text-syrka-steel">Syrka. Institutional capability infrastructure.</p>
        </div>
      </div>
    </footer>
  )
}
