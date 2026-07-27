'use client'

import { useState } from 'react'
import Link from 'next/link'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'

const SECTION_LINKS = [
  { href: '#system', label: 'System' },
  { href: '#roles', label: 'Roles' },
  { href: '#trust', label: 'Trust' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-campus-border bg-campus-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/campus" aria-label="Syrka Campus home">
          <BrandMark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="font-campus-sans text-campus-sm text-campus-muted transition-colors hover:text-campus-text">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className="font-campus-sans text-campus-sm text-campus-text hover:text-campus-muted">
            Sign in
          </Link>
          <a href="#cta">
            <Button size="sm">Request a demonstration</Button>
          </a>
        </div>

        <button
          type="button"
          className="rounded-campus-sm p-2 text-campus-text md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {open && (
        <nav aria-label="Primary" className="flex flex-col gap-1 border-t border-campus-border px-6 py-4 md:hidden">
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
