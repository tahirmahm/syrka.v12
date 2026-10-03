'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'

const SECTION_LINKS = [
  { href: '#narrative', label: 'System' },
  { href: '#odyssey', label: 'Odyssey' },
  { href: '#passport', label: 'Passport' },
  { href: '#learning', label: 'Learning' },
  { href: '#institutional', label: 'Institutional Intelligence' },
]

/**
 * Transparent over the dark hero, turning into a solid surface once the
 * visitor scrolls past it — so the nav never competes with the hero, but
 * stays legible once the page moves into its off-white sections.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = scrolled || open

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-campus-base ${
        solid ? 'border-campus-border bg-campus-surface/90 backdrop-blur' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <Link href="/campus" aria-label="Syrka Campus home">
          {solid ? (
            <BrandMark />
          ) : (
            <span className="font-campus-sans text-campus-lg font-semibold tracking-tight text-campus-white">
              Syrka<span className="ml-1 font-campus-mono text-[10px] uppercase tracking-widest text-campus-white/60">Campus</span>
            </span>
          )}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-campus-sans text-campus-sm transition-colors ${solid ? 'text-campus-muted hover:text-campus-text' : 'text-campus-white/70 hover:text-campus-white'}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className={`font-campus-sans text-campus-sm ${solid ? 'text-campus-text hover:text-campus-muted' : 'text-campus-white hover:text-campus-white/80'}`}>
            Sign in
          </Link>
          <a href="#cta">
            <Button size="sm">Request a demonstration</Button>
          </a>
        </div>

        <button
          type="button"
          className={`rounded-campus-sm p-2 md:hidden ${solid ? 'text-campus-text' : 'text-campus-white'}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {open && (
        <nav aria-label="Primary" className="flex flex-col gap-1 border-t border-campus-border bg-campus-surface px-6 py-4 md:hidden">
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="rounded-campus-sm px-2 py-2 font-campus-sans text-campus-sm text-campus-text" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/sign-in" className="rounded-campus-sm px-2 py-2 font-campus-sans text-campus-sm text-campus-text" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <a href="#cta" className="mt-2" onClick={() => setOpen(false)}>
            <Button className="w-full">Request a demonstration</Button>
          </a>
        </nav>
      )}
    </header>
  )
}
