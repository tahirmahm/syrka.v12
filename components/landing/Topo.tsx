import { seededRandom } from './seededRandom'

/** Topographic contour lines, generated deterministically so the server and client render the same SVG. */
export default function Topo({ seed = 7, className }: { seed?: number; className?: string }) {
  const rand = seededRandom(seed * 9301 + 49297)

  const paths: string[] = []
  const hills = 4
  for (let h = 0; h < hills; h++) {
    const cx = 100 + rand() * 1000
    const cy = 80 + rand() * 640
    const harmonics = [2, 3, 5].map(n => ({ n, a: 0.06 + rand() * 0.1, p: rand() * Math.PI * 2 }))
    const rings = 6 + Math.floor(rand() * 6)
    for (let k = 1; k <= rings; k++) {
      const base = k * (26 + rand() * 6)
      let d = ''
      for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * Math.PI * 2
        // Outer rings wobble more, like real terrain.
        const wob = harmonics.reduce((acc, hm) => acc + hm.a * Math.sin(hm.n * t + hm.p + k * 0.15), 0) * (1 + k * 0.08)
        const r = base * (1 + wob)
        d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * r * 1.35).toFixed(1)} ${(cy + Math.sin(t) * r).toFixed(1)}`
      }
      paths.push(d + 'Z')
    }
  }

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {paths.map((d, i) => <path key={i} d={d} vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  )
}
