import type { ExtractedPageResult, ExtractionWarning, PageExtractionQualityState, PageQualityEvaluation, PageQualitySignal } from '@/lib/campus-types'

const REPLACEMENT_CHAR = '�'
const CONTROL_CHAR_PATTERN = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`, 'g')
const SUSPICIOUS_RUN_PATTERN = /([^\s])\1{9,}/

const LOW_TEXT_VOLUME_THRESHOLD = 15
const BROKEN_CHARACTER_RATIO_THRESHOLD = 0.05
const READING_ORDER_FRAGMENTATION_THRESHOLD = 0.5
const HEADER_FOOTER_REPETITION_RATIO = 0.5
const HEADER_FOOTER_MIN_PAGES = 3

function firstAndLastLine(text: string): [string | undefined, string | undefined] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  return [lines[0], lines[lines.length - 1]]
}

/** Cross-page repeated-line detection — a line repeated as the first/last line of most pages is treated as a running header/footer, not content. */
function detectRepeatedHeaderFooterLines(pages: ExtractedPageResult[]): Set<string> {
  if (pages.length < HEADER_FOOTER_MIN_PAGES) return new Set()
  const counts = new Map<string, number>()
  for (const page of pages) {
    const [first, last] = firstAndLastLine(page.rawText)
    for (const line of [first, last]) {
      if (!line) continue
      counts.set(line, (counts.get(line) ?? 0) + 1)
    }
  }
  const threshold = pages.length * HEADER_FOOTER_REPETITION_RATIO
  return new Set(Array.from(counts.entries()).filter(([, count]) => count >= threshold).map(([line]) => line))
}

export interface PageQualityOptions {
  /** Only checked when supplied — deterministic, never a fuzzy "expected structure" guess. */
  expectedHeadingPattern?: RegExp
  repeatedHeaderFooterLines?: Set<string>
}

function collectSignals(page: ExtractedPageResult, opts: PageQualityOptions): PageQualitySignal[] {
  const signals: PageQualitySignal[] = []
  const trimmed = page.rawText.trim()

  if (page.imageOnly) {
    // An image-only page is expected to have no text — that is what makes it OCR-eligible rather than a bare extraction failure.
    signals.push('image_only_page')
    return signals
  }
  if (trimmed.length === 0) {
    signals.push('no_extracted_text')
    return signals
  }
  if (page.textItemCount > 0 && page.textItemCount < LOW_TEXT_VOLUME_THRESHOLD) signals.push('low_text_volume')

  const controlMatches = page.rawText.match(CONTROL_CHAR_PATTERN)
  if (controlMatches && controlMatches.length / page.rawText.length > BROKEN_CHARACTER_RATIO_THRESHOLD) signals.push('broken_character_ratio')

  if (page.rawText.includes(REPLACEMENT_CHAR)) signals.push('replacement_character_frequency')

  if (!page.imageOnly && page.readingOrderConfidence < READING_ORDER_FRAGMENTATION_THRESHOLD) signals.push('reading_order_fragmentation')

  if (opts.repeatedHeaderFooterLines?.size) {
    const [first, last] = firstAndLastLine(page.rawText)
    if ((first && opts.repeatedHeaderFooterLines.has(first)) || (last && opts.repeatedHeaderFooterLines.has(last))) {
      signals.push('header_footer_dominance')
    }
  }

  if (SUSPICIOUS_RUN_PATTERN.test(page.rawText)) signals.push('suspicious_character_runs')

  if (opts.expectedHeadingPattern && !opts.expectedHeadingPattern.test(page.rawText)) signals.push('missing_expected_heading')

  return signals
}

function stateForSignals(signals: PageQualitySignal[]): PageExtractionQualityState {
  if (signals.includes('no_extracted_text')) return 'failed'
  if (signals.includes('image_only_page')) return 'ocr_required'
  if (signals.includes('broken_character_ratio') || signals.includes('replacement_character_frequency') || signals.includes('reading_order_fragmentation')) {
    return 'manual_correction_required'
  }
  if (signals.length > 0) return 'review_recommended'
  return 'reliable'
}

/**
 * Deterministic, single-page evaluation. Never claims semantic/curriculum
 * correctness merely because text extraction succeeded — extraction
 * confidence and curriculum correctness are separate concepts.
 */
export function evaluatePageQuality(pageId: string, page: ExtractedPageResult, opts: PageQualityOptions = {}): PageQualityEvaluation {
  const signals = collectSignals(page, opts)
  return {
    pageId,
    state: stateForSignals(signals),
    signals,
    extractionConfidence: page.imageOnly ? 0 : Math.max(0, 1 - signals.length * 0.15),
  }
}

/** Evaluates every page in a document, sharing one cross-page header/footer detection pass. */
export function evaluateDocumentPageQuality(pageIds: string[], pages: ExtractedPageResult[], expectedHeadingPatternByPage?: Map<number, RegExp>): PageQualityEvaluation[] {
  const repeatedHeaderFooterLines = detectRepeatedHeaderFooterLines(pages)
  return pages.map((page, index) =>
    evaluatePageQuality(pageIds[index], page, {
      repeatedHeaderFooterLines,
      expectedHeadingPattern: expectedHeadingPatternByPage?.get(page.pageNumber),
    })
  )
}

const SIGNAL_SEVERITY: Record<PageQualitySignal, ExtractionWarning['severity']> = {
  no_extracted_text: 'high',
  image_only_page: 'high',
  broken_character_ratio: 'high',
  replacement_character_frequency: 'high',
  reading_order_fragmentation: 'medium',
  header_footer_dominance: 'medium',
  suspicious_character_runs: 'medium',
  low_text_volume: 'low',
  missing_expected_heading: 'low',
}

const SIGNAL_DESCRIPTION: Record<PageQualitySignal, string> = {
  no_extracted_text: 'No text could be extracted from this page.',
  image_only_page: 'This page appears to be a scanned image with no embedded text.',
  broken_character_ratio: 'This page contains an unusually high proportion of unreadable control characters.',
  replacement_character_frequency: 'This page contains replacement characters, indicating a font-decoding failure.',
  reading_order_fragmentation: 'The reading order on this page could not be reliably determined.',
  header_footer_dominance: 'This page is dominated by a repeated running header or footer.',
  suspicious_character_runs: 'This page contains a suspicious run of repeated characters.',
  low_text_volume: 'This page has an unusually low amount of extracted text.',
  missing_expected_heading: 'This page is missing an expected heading.',
}

/** Produces one ExtractionWarning per signal — never a single collapsed warning that hides which specific signal triggered it. */
export function createExtractionWarningsForPage(idPrefix: string, evaluation: PageQualityEvaluation): ExtractionWarning[] {
  return evaluation.signals.map((signal, index) => ({
    id: `${idPrefix}-${signal}-${index}`,
    pageId: evaluation.pageId,
    severity: SIGNAL_SEVERITY[signal],
    description: SIGNAL_DESCRIPTION[signal],
    resolved: false,
    signal,
  }))
}
