import Image from 'next/image'

/**
 * Official Syrka logo lockup. Only a dark-surface (black background) PNG
 * is available so far — used here only on dark surfaces (DESIGN-001 §3
 * "use on black, near-black, white, or neutral backgrounds only"). On
 * light surfaces we fall back to a neutral text wordmark until a
 * transparent or light-surface variant is provided. Do not use this
 * component to derive a favicon, app icon, seal, or OG image — those
 * still need a dedicated variant.
 */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="font-campus-sans text-campus-lg font-semibold tracking-tight text-campus-text dark:hidden">
        Syrka<span className="ml-1 font-campus-mono text-[10px] uppercase tracking-widest text-campus-muted">Campus</span>
      </span>
      <Image
        src="/brand/syrka-logo.png"
        alt="Syrka"
        width={2172}
        height={724}
        priority
        className="hidden h-6 w-auto dark:block"
      />
    </span>
  )
}
