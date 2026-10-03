'use client'

import { useEffect } from 'react'

/**
 * SVG filter behind the `.liquid-glass` material (see globals.css). Only Chromium can reference an SVG filter
 * from `backdrop-filter`; elsewhere the declaration would be dropped wholesale, so the refraction layer is
 * switched on via `data-lg-refract` and other browsers keep the blur + specular fallback.
 */
export default function LiquidGlassFilter() {
  useEffect(() => {
    const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands
    if (brands?.some(b => b.brand === 'Chromium')) document.documentElement.dataset.lgRefract = ''
  }, [])

  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <filter id="lg-refract" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
