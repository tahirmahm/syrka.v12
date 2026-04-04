import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * WEF Global Competitiveness Index data is not available via a public API.
 * This route seeds static GCI 4.0 scores from the 2019 edition (the last published).
 * For future updates, data must be manually uploaded or scraped from WEF reports.
 */

const GCI_2019_SCORES: { country_code: string; value: number }[] = [
  { country_code: 'MT', value: 68.5 },
  { country_code: 'SA', value: 70.0 },
  { country_code: 'CY', value: 66.4 },
  { country_code: 'EE', value: 70.9 },
  { country_code: 'SI', value: 70.2 },
  { country_code: 'LU', value: 77.0 },
  { country_code: 'AE', value: 75.0 },
  { country_code: 'QA', value: 72.9 },
  { country_code: 'BH', value: 65.4 },
  { country_code: 'KW', value: 65.1 },
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const errors: string[] = []

  const records = GCI_2019_SCORES.map((entry) => ({
    country_code: entry.country_code,
    source: 'wef',
    indicator_code: 'GCI_4.0',
    indicator_name: 'Global Competitiveness Index 4.0',
    year: 2019,
    value: entry.value,
    unit: 'score (0-100)',
    fetched_at: new Date().toISOString(),
  }))

  let totalUpserted = 0

  try {
    const { error } = await supabase
      .from('international_stats')
      .upsert(records, {
        onConflict: 'country_code,source,indicator_code,year',
      })

    if (error) {
      errors.push(`Upsert error: ${error.message}`)
    } else {
      totalUpserted = records.length
    }
  } catch (err: unknown) {
    errors.push(`Exception: ${err instanceof Error ? err.message : String(err)}`)
  }

  return NextResponse.json({
    source: 'wef',
    totalUpserted,
    note: 'WEF Global Competitiveness data is not available via a public API. This route seeds static GCI 4.0 scores from the 2019 edition (the last published year). Future data requires manual upload.',
    errors: errors.length > 0 ? errors : undefined,
  })
}
