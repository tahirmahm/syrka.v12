'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DEPLOY_STYLE, SyrkaLogo } from './brand'
import SpecularButton from '@/components/ui/SpecularButton'

export interface NavSystem { id: string; name: string; tagline: string }

interface Props {
  systems: NavSystem[]
  signInHref: string
}

const LINKS = [
  { label: 'Academia', href: '#domains' },
  { label: 'Employers', href: '#domains' },
  { label: 'Government', href: '#domains' },
  { label: 'About', href: '#closing' },
]

/**
 * Palantir-inspired header: a floating translucent bar inset from the edges, centred links, a solid "Deploy"
 * button and a square menu button that opens a large-link panel.
 */
export default function SiteNav({ systems, signInHref }: Props) {
  const [softwareOpen, setSoftwareOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  // True while the header floats over a light ("paper") section, so the glass and text flip to a light theme.
  const [onLight, setOnLight] = useState(false)

  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const header = headerRef.current
      if (!header) return
      const r = header.getBoundingClientRect()
      const y = r.top + r.height / 2
      // Compare against section boxes rather than hit-testing, so overlays (the loader, the 3D layer) don't interfere.
      setOnLight(Array.from(document.querySelectorAll('.lx-tone-paper')).some(el => {
        const b = el.getBoundingClientRect()
        return b.top <= y && b.bottom > y
      }))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [])

  useEffect(() => {
    if (!softwareOpen) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setSoftwareOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [softwareOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => { document.documentElement.style.overflow = ''; document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  const close = () => setMenuOpen(false)
  const bigLink = 'text-[20px] text-[var(--lx-ink)] no-underline hover:text-[var(--lx-accent-ink)]'

  return (
    <>
      <header ref={headerRef} className="fixed inset-x-2 top-2 z-50 md:inset-x-3 md:top-3">
        <div className={`lx-nav grid h-[60px] grid-cols-[1fr_auto] items-center gap-6 liquid-glass rounded-md px-4 md:px-5 lg:grid-cols-[1fr_auto_1fr] ${onLight && !menuOpen ? 'lx-nav-light' : ''}`}>
          <a href="#top" aria-label="Syrka, back to top" className="justify-self-start">
            <SyrkaLogo preload className="h-[16px] w-auto md:h-[19px]" />
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-10 lg:flex">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className="lx-navlink flex items-center gap-2"
                aria-expanded={softwareOpen}
                aria-controls="lx-software-menu"
                onClick={() => setSoftwareOpen(o => !o)}
              >
                Software
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${softwareOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              {softwareOpen && (
                <div id="lx-software-menu" className="absolute left-1/2 top-full mt-5 w-[400px] -translate-x-1/2 rounded-md border border-white/10 bg-[#101013] p-2">
                  {systems.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setSoftwareOpen(false)}
                      className="group grid grid-cols-[36px_1fr] gap-x-3 rounded px-3 py-3 no-underline hover:bg-white/[0.05]"
                    >
                      <span className="lx-mono pt-1 text-[var(--lx-dim)]">/{i + 1}</span>
                      <span>
                        <span className="block text-[17px] text-[var(--lx-ink)]">{s.name}</span>
                        <span className="block text-[13px] text-[var(--lx-dim)]">{s.tagline}</span>
                      </span>
                    </a>
                  ))}
                  <a href="#trust" onClick={() => setSoftwareOpen(false)} className="mt-1 block border-t border-white/10 px-3 pb-2 pt-3 text-[14px] text-[var(--lx-dim)] no-underline hover:text-[var(--lx-ink)]">
                    Trust &amp; governance →
                  </a>
                </div>
              )}
            </div>
            {LINKS.map(l => <a key={l.label} href={l.href} className="lx-navlink">{l.label}</a>)}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            <a href={signInHref} className="lx-navlink mr-4 hidden lg:inline">Sign in</a>
            <SpecularButton href="#closing" size="sm" radius={10} textColor="#ffffff" lineColor="#e2dcff" baseColor="#2a1f99" style={DEPLOY_STYLE} className="!hidden h-10 whitespace-nowrap sm:!inline-flex">
              Deploy Syrka
            </SpecularButton>
            <button
              type="button"
              className="lx-nav-menu flex h-10 w-10 items-center justify-center border text-[var(--lx-ink)] transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="lx-menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                {menuOpen
                  ? <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.4" />
                  : <path d="M2 7h14M2 11h14" stroke="currentColor" strokeWidth="1.4" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would otherwise become the containing block for this fixed panel. */}
      {menuOpen && (
        <div id="lx-menu" className="fixed inset-0 z-40 overflow-y-auto bg-[#050506] px-4 pb-12 pt-[96px] md:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="lx-mono mb-4 text-[var(--lx-dim)]">Our software</div>
              {systems.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} onClick={close} className="group flex items-baseline justify-between gap-6 border-t border-white/10 py-4 no-underline">
                  <span>
                    <span className="block text-[clamp(28px,4vw,40px)] leading-tight tracking-[-0.03em] text-[var(--lx-ink)] transition-colors group-hover:text-[var(--lx-accent-ink)]">{s.name}</span>
                    <span className="mt-1 block text-[15px] text-[var(--lx-dim)]">{s.tagline}</span>
                  </span>
                  <span className="lx-mono text-[var(--lx-dim)]">/{i + 1}</span>
                </a>
              ))}
            </div>
            <div className="grid content-start gap-10 sm:grid-cols-2">
              <nav aria-label="Domains" className="flex flex-col gap-2">
                <span className="lx-mono mb-2 text-[var(--lx-dim)]">Domains</span>
                {LINKS.slice(0, 3).map(l => <a key={l.label} href={l.href} onClick={close} className={bigLink}>{l.label}</a>)}
              </nav>
              <nav aria-label="Company" className="flex flex-col gap-2">
                <span className="lx-mono mb-2 text-[var(--lx-dim)]">Company</span>
                <a href="#closing" onClick={close} className={bigLink}>About</a>
                <a href="#trust" onClick={close} className={bigLink}>Trust &amp; governance</a>
                <a href={signInHref} className={bigLink}>Sign in</a>
              </nav>
              <nav aria-label="Platform" className="flex flex-col gap-2">
                <span className="lx-mono mb-2 text-[var(--lx-dim)]">Platform</span>
                <Link href="/saudi/ministry" className={bigLink}>Intelligence dashboards</Link>
                <Link href="/model-cards" className={bigLink}>Model governance</Link>
              </nav>
              <SpecularButton href="#closing" onClick={close} size="md" radius={12} textColor="#ffffff" lineColor="#e2dcff" baseColor="#2a1f99" style={DEPLOY_STYLE} className="h-12 self-end sm:col-span-2">
                Deploy Syrka
              </SpecularButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
