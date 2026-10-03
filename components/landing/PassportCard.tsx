'use client'

import PrismaticBurst from './PrismaticBurst'
import { seededRandom } from './seededRandom'

/**
 * The Syrka ID (Career Passport): a sample card floating over a moving prismatic light burst. The card sways
 * gently in 3D and a glare sweeps across it. All details are illustrative.
 */

const QR_SIZE = 25

/** Decorative QR-style matrix: three finder squares plus seeded noise. Not a scannable code. */
function qrCells() {
  const rand = seededRandom(42)
  const cells: [number, number][] = []
  const inFinder = (x: number, y: number) =>
    [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]].find(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8)
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const f = inFinder(x, y)
      if (f) {
        const dx = x - f[0], dy = y - f[1]
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) continue
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3))
        if (ring === 3 || ring <= 1) cells.push([x, y])
      } else if (rand() < 0.5) cells.push([x, y])
    }
  }
  return cells
}
const QR = qrCells()

function Seal() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <path
        d="M20 2l4.2 3.1 5.2-.4 1.9 4.9 4.7 2.3-.6 5.2 2.9 4.3-2.9 4.3.6 5.2-4.7 2.3-1.9 4.9-5.2-.4L20 38l-4.2-3.1-5.2.4-1.9-4.9-4.7-2.3.6-5.2L1.7 20l2.9-4.3-.6-5.2 4.7-2.3 1.9-4.9 5.2.4z"
        fill="#c8a96a"
      />
      <path d="M13.5 20.5l4.3 4.3 8.7-9" fill="none" stroke="#1a1408" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PassportCard({ burst = true }: { burst?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Moving light behind the card, faded out towards the edges of the column. */}
      {burst && <div
        className="absolute inset-0"
        style={{ maskImage: 'radial-gradient(closest-side, black 55%, transparent 100%)', WebkitMaskImage: 'radial-gradient(closest-side, black 55%, transparent 100%)' }}
      >
        <PrismaticBurst animationType="rotate3d" intensity={2} speed={0.5} colors={['#ff007a', '#4d3dff', '#A855F7', '#ffffff']} mixBlendMode="lighten" />
      </div>}

      <div className="lx-passport relative w-[min(440px,92%)]" role="img" aria-label="Sample Syrka Career Passport for Alex Chen, institutionally reviewed">
        <div className="lx-passport-card relative overflow-hidden rounded-[28px] border border-white/10 p-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(122,92,255,0.6)] md:p-9">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[22px] font-medium tracking-[-0.01em] text-white">Syrka</div>
              <div className="lx-mono mt-1 !text-[11px] tracking-[0.3em] text-white/55">CAREER PASSPORT</div>
            </div>
            <Seal />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="lx-mono grid h-16 w-16 place-items-center rounded-full bg-white/[0.08] !text-[18px] text-white">AC</div>
            <div>
              <div className="text-[24px] font-medium leading-tight text-white">Alex Chen</div>
              <div className="text-[16px] text-white/55">Class X</div>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-5">
            <dl className="lx-mono grid grid-cols-2 gap-x-6 gap-y-4 !text-[11px]">
              {[
                ['Passport ID', 'passport-1'],
                ['Version', '1'],
                ['Issued', 'July 27, 2026'],
                ['Institution', 'NCERT Class X'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="uppercase tracking-[0.08em] text-white/45">{k}</dt>
                  <dd className="mt-1 normal-case text-white/90">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="shrink-0 rounded-xl bg-white p-2">
              <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className="h-24 w-24 md:h-28 md:w-28" shapeRendering="crispEdges" aria-hidden="true">
                {QR.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0b0b0d" />)}
              </svg>
            </div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5">
            <span className="lx-mono inline-flex rounded-full border border-[#c8a96a]/50 px-3 py-1.5 !text-[11px] tracking-[0.08em] text-[#c8a96a]">INSTITUTIONALLY REVIEWED</span>
          </div>
        </div>
      </div>
    </div>
  )
}
