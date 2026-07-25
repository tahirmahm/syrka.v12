'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import { List, X, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { SyrkaWordmark } from './SyrkaWordmark'

const SOFTWARE_LINKS = [
  { href: '#campus', label: 'Syrka Campus', desc: 'Capability developed.' },
  { href: '#odyssey', label: 'Syrka Odyssey', desc: 'Capability directed.' },
  { href: '#passport', label: 'Syrka Career Passport', desc: 'Capability proven and carried.' },
  { href: '#praxis', label: 'Syrka Praxis', desc: 'Capability put to work.' },
  { href: '#maxima', label: 'Syrka Maxima', desc: 'Capability coordinated nationally.' },
]

const PRIMARY_LINKS = [
  { href: '#domains', label: 'Academia' },
  { href: '#domains', label: 'Employers' },
  { href: '#domains', label: 'Government' },
  { href: '#closing', label: 'About' },
]

/** Sticky corporate nav for the Syrka homepage — isolated from Campus's MarketingNav/CampusShell. */
export function CorporateNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [softwareOpen, setSoftwareOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 32))

  return (
    <header
      className={`sticky top-0 z-50 border-b border-syrka-hairline transition-[background-color] duration-300 ${
        scrolled ? 'bg-syrka-obsidian' : 'bg-syrka-obsidian/70'
      }`}
    >
      <div className={`mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-all duration-300 md:px-10 ${scrolled ? 'h-14' : 'h-16'}`}>
        <Link href="/" aria-label="Syrka home" className="shrink-0">
          <SyrkaWordmark priority className="h-8 w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          <div className="relative" onMouseEnter={() => setSoftwareOpen(true)} onMouseLeave={() => setSoftwareOpen(false)}>
            <button
              type="button"
              aria-expanded={softwareOpen}
              aria-haspopup="true"
              onClick={() => setSoftwareOpen(!softwareOpen)}
              className="flex items-center gap-1 font-campus-sans text-campus-sm text-syrka-steel transition-colors hover:text-syrka-offwhite"
            >
              Software <CaretDown size={12} aria-hidden="true" />
            </button>
            {softwareOpen && (
              <div className="absolute left-0 top-full w-72 border border-syrka-hairline bg-syrka-carbon p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                {SOFTWARE_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setSoftwareOpen(false)}
                    className="block px-3 py-2.5 transition-colors hover:bg-syrka-graphite"
                  >
                    <span className="block font-campus-sans text-campus-sm text-syrka-offwhite">{link.label}</span>
                    <span className="block font-campus-mono text-[11px] text-syrka-steel">{link.desc}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          {PRIMARY_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="font-campus-sans text-campus-sm text-syrka-steel transition-colors hover:text-syrka-offwhite">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/sign-in" className="font-campus-sans text-campus-sm text-syrka-offwhite hover:text-syrka-steel">
            Sign in
          </Link>
          <a
            href="#closing"
            className="border border-syrka-signal bg-syrka-signal px-4 py-2 font-campus-sans text-campus-sm font-medium text-syrka-white transition-opacity hover:opacity-90"
          >
            Deploy Syrka
          </a>
        </div>

        <button
          type="button"
          className="p-2 text-syrka-offwhite lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Primary" className="flex flex-col gap-1 border-t border-syrka-hairline px-6 py-4 lg:hidden">
          <p className="mt-1 mb-1 font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Software</p>
          {SOFTWARE_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-none px-2 py-2 font-campus-sans text-campus-sm text-syrka-offwhite"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="my-2 h-px bg-syrka-hairline" />
          {PRIMARY_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="px-2 py-2 font-campus-sans text-campus-sm text-syrka-offwhite" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/sign-in" className="px-2 py-2 font-campus-sans text-campus-sm text-syrka-offwhite" onClick={() => setMobileOpen(false)}>
            Sign in
          </Link>
          <a
            href="#closing"
            className="mt-2 border border-syrka-signal bg-syrka-signal px-4 py-2 text-center font-campus-sans text-campus-sm font-medium text-syrka-white"
            onClick={() => setMobileOpen(false)}
          >
            Deploy Syrka
          </a>
        </nav>
      )}
    </header>
  )
}
