'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * framer-motion's useReducedMotion reads matchMedia synchronously on the
 * client's first render, so its value can differ from the server-rendered
 * markup (which always assumes motion is enabled) — a hydration mismatch on
 * any browser that actually has prefers-reduced-motion set. This defers to
 * the real value only after mount, matching the server's assumption until
 * then.
 */
export function useReducedMotionSafe(): boolean {
  const [mounted, setMounted] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? Boolean(prefersReduced) : false
}
