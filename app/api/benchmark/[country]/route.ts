import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const SLUG_TO_CODE: Record<string, string> = {
  malta: 'MT',
  saudi: 'SA',
  cyprus: 'CY',
  estonia: 'EE',
  slovenia: 'SI',
  luxembourg: 'LU',
  uae: 'AE',
  qatar: 'QA',
  bahrain: 'BH',
  kuwait: 'KW',
}

const CODE_TO_NAME: Record<string, string> = {
  MT: 'Malta', SA: 'Saudi Arabia', CY: 'Cyprus', EE: 'Estonia',
  SI: 'Slovenia', LU: 'Luxembourg', AE: 'UAE', QA: 'Qatar',
  BH: 'Bahrain', KW: 'Kuwait',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params
    const countryCode = SLUG_TO_CODE[country.toLowerCase()]

    if (!countryCode) {
      return NextResponse.json(
        { error: `Unknown country slug: ${country}`, supported: Object.keys(SLUG_TO_CODE) },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Fetch peer group for this country (limit 1 in case of duplicates)
    const { data: peerGroups, error: peerError } = await supabase
      .from('peer_groups')
      .select('peer_country_codes')
      .eq('country_code', countryCode)
      .limit(1)

    if (peerError) {
      return NextResponse.json(
        { error: `Peer group not found: ${peerError.message}` },
        { status: 404 }
      )
    }

    // Fallback peer groups in case the table is empty or RLS blocks reads
    const FALLBACK_PEERS: Record<string, string[]> = {
      MT: ['CY', 'EE', 'SI', 'LU'],
      SA: ['AE', 'QA', 'BH', 'KW'],
    }

    const peerGroup = peerGroups?.[0]
    const peerCodes: string[] = peerGroup?.peer_country_codes ?? FALLBACK_PEERS[countryCode] ?? []

    if (peerCodes.length === 0) {
      return NextResponse.json(
        { error: `No peer group configured for ${countryCode}` },
        { status: 404 }
      )
    }
    const allCodes = [countryCode, ...peerCodes]

    // Fetch international stats for country and all peers
    const { data: stats, error: statsError } = await supabase
      .from('international_stats')
      .select('*')
      .in('country_code', allCodes)

    if (statsError) {
      return NextResponse.json(
        { error: `Stats fetch error: ${statsError.message}` },
        { status: 500 }
      )
    }

    // Group by indicator and compute peer averages
    const byIndicator: Record<string, {
      indicator_name: string
      indicator_code: string
      unit: string
      country_value: number | null
      peer_values: { country_code: string; value: number }[]
      peer_average: number | null
    }> = {}

    for (const row of stats ?? []) {
      const key = `${row.indicator_code}_${row.year}`

      if (!byIndicator[key]) {
        byIndicator[key] = {
          indicator_name: row.indicator_name,
          indicator_code: row.indicator_code,
          unit: row.unit,
          country_value: null,
          peer_values: [],
          peer_average: null,
        }
      }

      const entry = byIndicator[key]

      if (row.country_code === countryCode) {
        entry.country_value = row.value
      } else {
        entry.peer_values.push({
          country_code: row.country_code,
          value: row.value,
        })
      }
    }

    // Compute peer averages
    const benchmarks = Object.entries(byIndicator).map(([key, entry]) => {
      const peerSum = entry.peer_values.reduce((sum, p) => sum + p.value, 0)
      const peerAvg = entry.peer_values.length > 0
        ? parseFloat((peerSum / entry.peer_values.length).toFixed(4))
        : null

      const [indicatorCode, yearStr] = key.split('_')

      return {
        indicator_code: indicatorCode,
        indicator_name: entry.indicator_name,
        unit: entry.unit,
        year: parseInt(yearStr, 10),
        country_value: entry.country_value,
        peer_average: peerAvg,
        peer_count: entry.peer_values.length,
        delta: entry.country_value !== null && peerAvg !== null
          ? parseFloat((entry.country_value - peerAvg).toFixed(4))
          : null,
      }
    })

    // Sort by indicator then year
    benchmarks.sort((a, b) =>
      a.indicator_code.localeCompare(b.indicator_code) || a.year - b.year
    )

    // Build the response format expected by the frontend
    // Group stats by country_code -> indicator_code -> [{year, value}]
    const countryIndicators: Record<string, { year: number; value: number }[]> = {}
    const peerIndicatorMap: Record<string, Record<string, { year: number; value: number }[]>> = {}

    for (const row of stats ?? []) {
      if (row.country_code === countryCode) {
        if (!countryIndicators[row.indicator_code]) countryIndicators[row.indicator_code] = []
        countryIndicators[row.indicator_code].push({ year: row.year, value: row.value })
      } else {
        if (!peerIndicatorMap[row.country_code]) peerIndicatorMap[row.country_code] = {}
        if (!peerIndicatorMap[row.country_code][row.indicator_code]) peerIndicatorMap[row.country_code][row.indicator_code] = []
        peerIndicatorMap[row.country_code][row.indicator_code].push({ year: row.year, value: row.value })
      }
    }

    // Compute latest country values and peer averages per indicator
    const latestCountryValues: Record<string, number> = {}
    const peerAverage: Record<string, number> = {}

    for (const b of benchmarks) {
      if (b.country_value !== null && !latestCountryValues[b.indicator_code]) {
        latestCountryValues[b.indicator_code] = b.country_value
      }
      if (b.peer_average !== null && !peerAverage[b.indicator_code]) {
        peerAverage[b.indicator_code] = b.peer_average
      }
    }

    // Use latest year values
    for (const [code, years] of Object.entries(countryIndicators)) {
      const sorted = years.sort((a, b) => b.year - a.year)
      if (sorted.length > 0) latestCountryValues[code] = sorted[0].value
    }

    return NextResponse.json({
      country: {
        code: countryCode,
        name: CODE_TO_NAME[countryCode] || countryCode,
        indicators: countryIndicators,
      },
      peers: peerCodes.map(pc => ({
        code: pc,
        name: CODE_TO_NAME[pc] || pc,
        indicators: peerIndicatorMap[pc] || {},
      })),
      peerAverage,
      latestCountryValues,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
