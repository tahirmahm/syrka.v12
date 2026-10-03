export interface SankeyNode {
  id: string
  label: string
  /** Which column (0 = leftmost) this node sits in. */
  column: number
}

export interface SankeyLink {
  from: string
  to: string
  /** Relative flow magnitude — sets ribbon thickness, not an absolute count. */
  value: number
}

export interface SankeyFlowVisualProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  /** Shown under the chart so a reader never mistakes it for a live institutional metric. */
  dataCaption: string
  className?: string
}

const WIDTH = 640
const HEIGHT = 300
const NODE_WIDTH = 10
const NODE_HEIGHT = 34

/**
 * A minimal Sankey — flow between named stages, ribbon thickness carrying
 * the relative magnitude. Adapted from inspecting Bklit UI's open-source
 * `packages/ui/src/charts/sankey/*` (MIT) — which layers `d3-sankey` for
 * automatic node/link solving, gradient links and hover-fade interaction.
 * This version reimplements the visual idea (column layout, curved flow
 * ribbons proportional to value, per-node labels) without adding
 * `d3-sankey` as a new dependency, since this chart only ever renders a
 * handful of fixed institutional stages and a full layout solver has
 * nothing to solve here. Native `<title>` tooltips on nodes and links.
 */
export function SankeyFlowVisual({ nodes, links, dataCaption, className = '' }: SankeyFlowVisualProps) {
  const columns = Math.max(...nodes.map((n) => n.column)) + 1
  const columnGap = WIDTH / (columns - 1 || 1)

  const byColumn = new Map<number, SankeyNode[]>()
  nodes.forEach((n) => {
    const list = byColumn.get(n.column) ?? []
    list.push(n)
    byColumn.set(n.column, list)
  })

  const positions = new Map<string, { x: number; y: number }>()
  byColumn.forEach((list, column) => {
    const gap = HEIGHT / (list.length + 1)
    list.forEach((n, i) => {
      positions.set(n.id, { x: column * columnGap, y: gap * (i + 1) })
    })
  })

  const maxValue = Math.max(...links.map((l) => l.value), 1)

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={dataCaption} className="h-auto w-full">
        {links.map((link, i) => {
          const from = positions.get(link.from)
          const to = positions.get(link.to)
          if (!from || !to) return null
          const strokeWidth = 2 + (link.value / maxValue) * 20
          const midX = (from.x + to.x) / 2
          const fromLabel = nodes.find((n) => n.id === link.from)?.label ?? link.from
          const toLabel = nodes.find((n) => n.id === link.to)?.label ?? link.to
          return (
            <path
              key={i}
              d={`M ${from.x + NODE_WIDTH} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
              fill="none"
              className="stroke-campus-blue-600/25 dark:stroke-campus-blue-dark/25"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            >
              <title>{`${fromLabel} → ${toLabel}: relative flow ${link.value}`}</title>
            </path>
          )
        })}
        {nodes.map((n) => {
          const pos = positions.get(n.id)!
          return (
            <g key={n.id}>
              <rect
                x={pos.x}
                y={pos.y - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={2}
                className="fill-campus-ink-950 dark:fill-campus-white"
              >
                <title>{n.label}</title>
              </rect>
              <text
                x={n.column === columns - 1 ? pos.x - 8 : pos.x + NODE_WIDTH + 8}
                y={pos.y}
                textAnchor={n.column === columns - 1 ? 'end' : 'start'}
                dominantBaseline="middle"
                className="fill-campus-text font-campus-sans text-[11px] font-medium"
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{dataCaption}</figcaption>
    </figure>
  )
}
