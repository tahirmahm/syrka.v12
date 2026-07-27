'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ShareNetwork, Printer, SealCheck, Check } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

export interface PassportWalletCardProps {
  holderName: string
  initials: string
  passportId: string
  institutionName: string
  programmeName?: string
  issueDate: string
  version: number
  verificationLabel: string
  qrSvgMarkup: string
  verifyUrl: string
}

/**
 * The Career Passport's front face — a real credential card, not another
 * data panel. Restrained tilt-on-hover (disabled under reduced motion),
 * a QR that genuinely encodes a demonstration verification URL, and
 * print/share actions that do something real.
 */
export function PassportWalletCard({
  holderName,
  initials,
  passportId,
  institutionName,
  programmeName,
  issueDate,
  version,
  verificationLabel,
  qrSvgMarkup,
  verifyUrl,
}: PassportWalletCardProps) {
  const reduceMotion = useReducedMotionSafe()
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const rotateXRaw = useMotionValue(0)
  const rotateYRaw = useMotionValue(0)
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 24 })
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 24 })
  const sheenX = useTransform(rotateY, [-6, 6], [0, 100])
  const sheenBackground = useTransform(sheenX, (x) => `linear-gradient(105deg, transparent ${x - 30}%, rgba(255,255,255,0.08) ${x}%, transparent ${x + 30}%)`)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateYRaw.set((px - 0.5) * 12)
    rotateXRaw.set((0.5 - py) * 8)
  }

  function handleMouseLeave() {
    rotateXRaw.set(0)
    rotateYRaw.set(0)
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Syrka Career Passport', url: verifyUrl })
        return
      } catch {
        // User cancelled or share unsupported — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the visible verifyUrl text below remains the fallback.
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 print:block">
      <div style={{ perspective: 1400 }} className="max-w-full overflow-hidden print:[perspective:none]">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative w-[400px] max-w-full overflow-hidden rounded-campus-lg border border-campus-ink-950/10 bg-campus-ink-950 p-6 text-campus-white shadow-campus-panel dark:border-campus-white/10 print:w-full print:shadow-none print:[transform:none]"
        >
          {/* Provenance texture — a restrained repeating hairline pattern, never a decorative flourish that competes with the data. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, transparent 0 6px, rgba(255,255,255,0.6) 6px 7px)',
            }}
          />
          {/* A subtle directional sheen, position-linked to tilt — never a looping shimmer. */}
          {!reduceMotion && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: sheenBackground }} />}

          <div className="relative flex items-start justify-between">
            <div>
              <p className="font-campus-sans text-campus-sm font-semibold tracking-tight">Syrka</p>
              <p className="font-campus-mono text-[9px] uppercase tracking-[0.2em] text-campus-white/60">Career Passport</p>
            </div>
            <SealCheck size={22} weight="fill" className="text-campus-gold-500" aria-hidden="true" />
          </div>

          <div className="relative mt-6 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-campus-white/10 font-campus-mono text-campus-sm font-medium">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-campus-sans text-campus-base font-medium">{holderName}</p>
              <p className="truncate font-campus-sans text-campus-xs text-campus-white/70">{programmeName ?? institutionName}</p>
            </div>
          </div>

          <div className="relative mt-6 flex items-end justify-between gap-4">
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2.5 font-campus-mono text-[9px] uppercase tracking-wide text-campus-white/60">
              <div className="min-w-0">
                <dt className="whitespace-nowrap">Passport ID</dt>
                <dd className="mt-0.5 truncate normal-case tracking-normal text-campus-white/90">{passportId}</dd>
              </div>
              <div className="min-w-0">
                <dt className="whitespace-nowrap">Version</dt>
                <dd className="mt-0.5 truncate normal-case tracking-normal text-campus-white/90">{version}</dd>
              </div>
              <div className="min-w-0">
                <dt className="whitespace-nowrap">Issued</dt>
                <dd className="mt-0.5 truncate normal-case tracking-normal text-campus-white/90">{issueDate}</dd>
              </div>
              <div className="min-w-0">
                <dt className="whitespace-nowrap">Institution</dt>
                <dd className="mt-0.5 truncate normal-case tracking-normal text-campus-white/90">{institutionName}</dd>
              </div>
            </dl>
            <div className="shrink-0 rounded-campus-sm bg-campus-white p-1.5" dangerouslySetInnerHTML={{ __html: qrSvgMarkup }} />
          </div>

          <div className="relative mt-4 border-t border-campus-white/10 pt-3">
            <span className="rounded-full border border-campus-gold-500/40 bg-campus-gold-500/10 px-2 py-0.5 font-campus-mono text-[9px] uppercase tracking-wide text-campus-gold-500">
              {verificationLabel}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <ShareNetwork size={15} aria-hidden="true" />}
          {copied ? 'Link copied' : 'Scan or share'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <Printer size={15} aria-hidden="true" />
          Print or export
        </button>
      </div>
      <p className="max-w-[340px] text-center font-campus-mono text-[10px] text-campus-muted print:hidden">
        The QR encodes a demonstration verification link: <span className="break-all">{verifyUrl}</span>
      </p>
    </div>
  )
}
