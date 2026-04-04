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

    // Fetch peer group for this country
    const { data: peerGroup, error: peerError } = await supabase
      .from('peer_groups')
      .select('peer_country_codes')
      .eq('country_code', countryCode)
      .single()

    if (peerError) {
      return NextResponse.json(
        { error: `Peer group not found: ${peerError.message}` },
        { status: 404 }
      )
    }

    const peerCodes: string[] = peerGroup.peer_country_codes ?? []
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

    return NextResponse.json({
      country_code: countryCode,
      peer_codes: peerCodes,
      benchmarks,
      count: benchmarks.length,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
