import Image from 'next/image'

interface SyrkaWordmarkProps {
  className?: string
  /** Rendered width in px; height is derived from the SVG's native aspect ratio so it's never stretched. */
  width: number
  priority?: boolean
}

// public/brand/syrka-wordmark-white.svg is a tightly cropped, pre-coloured
// white mark (viewBox 0 0 1826 208) — no padding to size around, no invert
// filter needed, unlike the padded transparent PNG this replaces on the
// corporate homepage.
const NATIVE_WIDTH = 1826
const NATIVE_HEIGHT = 208

export function SyrkaWordmark({ className = '', width, priority = false }: SyrkaWordmarkProps) {
  const height = Math.round((width * NATIVE_HEIGHT) / NATIVE_WIDTH)

  return (
    <Image
      src="/brand/syrka-wordmark-white.svg"
      alt="Syrka"
      width={width}
      height={height}
      unoptimized
      priority={priority}
      className={className}
    />
  )
}
