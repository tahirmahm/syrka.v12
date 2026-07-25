import type { ReactNode } from 'react'
import Link from 'next/link'
import { MotionReveal } from '@/components/motion/MotionReveal'

export interface ProductChapterProps {
  id: string
  eyebrow: string
  tagline: string
  name: string
  descriptor?: string
  description: string
  audience: string
  dark: boolean
  cta?: { label: string; href: string }
  status?: string
  children?: ReactNode
}

/**
 * One full-width product chapter in the "Our Software" portfolio —
 * alternates obsidian/off-white per DESIGN direction, never a small
 * generic SaaS card. `children` renders a per-product detail list or
 * conceptual visual.
 */
export function ProductChapter({ id, eyebrow, tagline, name, descriptor, description, audience, dark, cta, status, children }: ProductChapterProps) {
  const surface = dark ? 'bg-syrka-obsidian text-syrka-offwhite' : 'bg-syrka-offwhite text-syrka-obsidian'
  const muted = dark ? 'text-syrka-steel' : 'text-syrka-obsidian/60'
  const border = dark ? 'border-syrka-hairline' : 'border-syrka-obsidian/10'

  return (
    <section id={id} className={`border-t ${border} ${surface}`}>
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <MotionReveal>
              <p className={`font-campus-mono text-[11px] uppercase tracking-widest ${muted}`}>{eyebrow}</p>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <h2 className="mt-3 font-campus-sans text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-tight">{tagline}</h2>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="mt-6 font-campus-sans text-campus-lg font-medium">{name}</p>
            </MotionReveal>
            {descriptor && (
              <MotionReveal delay={0.12}>
                <p className={`mt-1 font-campus-sans text-campus-sm ${muted}`}>{descriptor}</p>
              </MotionReveal>
            )}
            <MotionReveal delay={0.15}>
              <p className={`mt-5 max-w-xl font-campus-sans text-campus-base ${muted}`}>{description}</p>
            </MotionReveal>
            <MotionReveal delay={0.2} className="mt-6 flex flex-wrap items-center gap-4">
              <span className={`border px-3 py-1 font-campus-mono text-[10px] uppercase tracking-widest ${border} ${muted}`}>{audience}</span>
              {status && <span className={`font-campus-mono text-[10px] uppercase tracking-widest ${muted}`}>{status}</span>}
              {cta && (
                <Link href={cta.href} className="font-campus-sans text-campus-sm font-medium text-syrka-signal hover:underline">
                  {cta.label} →
                </Link>
              )}
            </MotionReveal>
          </div>
          {children && (
            <MotionReveal delay={0.15} className="flex items-center">
              {children}
            </MotionReveal>
          )}
        </div>
      </div>
    </section>
  )
}
