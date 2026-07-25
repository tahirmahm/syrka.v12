import Image from 'next/image'

interface SyrkaWordmarkProps {
  className?: string
  /** Dark corporate surfaces (obsidian/carbon) need the artwork flipped to white; off-white surfaces use the original dark rendering. */
  surface?: 'dark' | 'light'
  priority?: boolean
}

/**
 * Transparent Syrka wordmark (public/brand/syrka-wordmark-transparent.png).
 * The source artwork is dark. On dark surfaces its visible pixels are
 * rendered white via a non-destructive CSS filter (brightness-0 invert),
 * preserving the PNG's transparency — the asset itself is never recoloured,
 * redrawn, re-encoded, or cropped.
 */
export function SyrkaWordmark({ className = '', surface = 'dark', priority = false }: SyrkaWordmarkProps) {
  return (
    <Image
      src="/brand/syrka-wordmark-transparent.png"
      alt="Syrka"
      width={1536}
      height={1024}
      priority={priority}
      className={`${surface === 'dark' ? 'brightness-0 invert' : ''} ${className}`}
    />
  )
}
