import LiquidGlassFilter from '@/components/LiquidGlassFilter'

/**
 * Chrome for the Syrka homepage at "/". The page brings its own nav and footer; this layout adds the SVG filter
 * behind the nav's liquid-glass effect and the Google Fonts the landing canvases draw with by name
 * ('Space Grotesk' for the footer wordmark, 'Inter' as the sans fallback).
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />
      <LiquidGlassFilter />
      {children}
    </>
  )
}
