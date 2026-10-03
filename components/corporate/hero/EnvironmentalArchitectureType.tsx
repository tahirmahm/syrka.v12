import { GeistPixelCircle } from 'geist/font/pixel'

interface EnvironmentalWordConfig {
  id: string
  text: string
  /** Character indices rendered at the brighter, "found on closer inspection" opacity. */
  highlightedIndices: number[]
  positionClassName: string
}

/**
 * Systematic / Relational / Knowledge / Architecture — whose leading
 * letters (Sy-R-K-A) spell SYRKA. Word text, highlighted-letter indices,
 * and desktop/mobile positions are centralised here; see the
 * `.environmental-word--*` rules in app/globals.css for the actual
 * placement, scale, and motion values.
 */
const ENVIRONMENTAL_WORDS: EnvironmentalWordConfig[] = [
  { id: 'systematic', text: 'Systematic', highlightedIndices: [0, 1], positionClassName: 'environmental-word--systematic' },
  { id: 'relational', text: 'Relational', highlightedIndices: [0], positionClassName: 'environmental-word--relational' },
  { id: 'knowledge', text: 'Knowledge', highlightedIndices: [0], positionClassName: 'environmental-word--knowledge' },
  { id: 'architecture', text: 'Architecture', highlightedIndices: [0], positionClassName: 'environmental-word--architecture' },
]

/**
 * Decorative background typography for the corporate hero only. Purely
 * atmospheric — aria-hidden, excluded from the heading structure — so it
 * must never be mistaken for real copy by assistive tech. Isolated to this
 * one component so Geist Pixel is never loaded on an authenticated Campus
 * route.
 */
export function EnvironmentalArchitectureType() {
  return (
    <div aria-hidden="true" className={`environmental-type ${GeistPixelCircle.className}`}>
      {ENVIRONMENTAL_WORDS.map((word) => (
        <span key={word.id} className={`environmental-word ${word.positionClassName}`}>
          {word.text.split('').map((char, i) => (
            <span key={i} className={word.highlightedIndices.includes(i) ? 'environmental-char environmental-highlight' : 'environmental-char'}>
              {char}
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}
