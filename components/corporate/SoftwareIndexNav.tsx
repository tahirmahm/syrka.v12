'use client'

import { useEffect, useState } from 'react'

const PRODUCTS = [
  { id: 'campus', label: 'Campus' },
  { id: 'odyssey', label: 'Odyssey' },
  { id: 'passport', label: 'Career Passport' },
  { id: 'praxis', label: 'Praxis' },
  { id: 'maxima', label: 'Maxima' },
]

/**
 * A restrained "01 Campus / 02 Odyssey / ..." index that tracks which
 * product chapter is currently in view via IntersectionObserver — never
 * hijacks scrolling, just reflects and (on click) navigates to it via a
 * plain in-page anchor. Desktop only; mobile keeps native section flow.
 */
export function SoftwareIndexNav() {
  const [activeId, setActiveId] = useState<string>()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const elements = PRODUCTS.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => Boolean(el))
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting)
        if (intersecting.length > 0) {
          setVisible(true)
          const closest = intersecting.reduce((a, b) => (Math.abs(a.intersectionRatio - 0.5) < Math.abs(b.intersectionRatio - 0.5) ? a : b))
          setActiveId(closest.target.id)
        } else {
          setVisible(false)
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label="Software chapters"
      className={`fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 border-l border-syrka-hairline pl-4 transition-opacity duration-300 lg:flex ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {PRODUCTS.map((product, i) => (
        <a
          key={product.id}
          href={`#${product.id}`}
          aria-current={activeId === product.id ? 'true' : undefined}
          className={`font-campus-mono text-[10px] uppercase tracking-widest transition-colors ${
            activeId === product.id ? 'text-syrka-signal' : 'text-syrka-steel hover:text-syrka-offwhite'
          }`}
        >
          {String(i + 1).padStart(2, '0')} {product.label}
        </a>
      ))}
    </nav>
  )
}
