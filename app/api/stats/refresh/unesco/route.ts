import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const INDICATORS = [
  { code: 'CR.1', name: 'Completion rate, primary education', unit: '%' },
  { code: 'GER.56T8', name: 'Gross enrolment ratio, tertiary education', unit: '%' },
  { code: 'XGDP.FSGOV', name: 'Government expenditure on education (% of GDP)', unit: '% of GDP' },
]

const COUNTRY_CODES = 'MT,SA,CY,EE,SI,LU,AE,QA,BH,KW'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  let totalUpserted = 0
  const errors: string[] = []

  for (const indicator of INDICATORS) {
    try {
      const url = `https://api.uis.unesco.org/api/public/data/indicators?indicator=${indicator.code}&locations=${COUNTRY_CODES}&start=2015&end=2025`
      const res = await fetch(url)

      if (!res.ok) {
        errors.push(`Failed to fetch ${indicator.code}: HTTP ${res.status}`)
        continue
      }

      const json = await res.json()

      // UNESCO API may return data in various structures.
      // Common structure: { records: [...] } or { data: { ... } } or array
      const rawRecords = extractRecords(json)

      if (rawRecords.length === 0) {
        errors.push(`No data returned for ${indicator.code}`)
        continue
      }

      const records = rawRecords.map((r) => ({
        country_code: r.countryCode,
        source: 'unesco',
        indicator_code: indicator.code,
        indicator_name: indicator.name,
        year: r.year,
        value: r.value,
        unit: indicator.unit,
        fetched_at: new Date().toISOString(),
      }))

      if (records.length > 0) {
        const { error } = await supabase
          .from('international_stats')
          .upsert(records, {
            onConflict: 'country_code,source,indicator_code,year',
          })

        if (error) {
          errors.push(`Upsert error for ${indicator.code}: ${error.message}`)
        } else {
          totalUpserted += records.length
        }
      }
    } catch (err: unknown) {
      errors.push(`Exception fetching ${indicator.code}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    source: 'unesco',
    totalUpserted,
    errors: errors.length > 0 ? errors : undefined,
  })
}

interface ParsedRecord {
  countryCode: string
  year: number
  value: number
}

/**
 * Extract records from the UNESCO API response, handling different response formats.
 */
function extractRecords(json: Record<string, unknown>): ParsedRecord[] {
  const results: ParsedRecord[] = []

  // Format 1: { records: [{ geoUnit: "MT", timePeriod: "2020", value: 95.3 }, ...] }
  if (Array.isArray((json as Record<string, unknown>)?.records)) {
    for (const row of (json as Record<string, unknown[]>).records as Record<string, unknown>[]) {
      const countryCode = String(row.geoUnit ?? row.country ?? row.location ?? '')
      const year = parseInt(String(row.timePeriod ?? row.year ?? row.time ?? ''), 10)
      const value = parseFloat(String(row.value ?? row.obs_value ?? ''))
      if (countryCode && !isNaN(year) && !isNaN(value)) {
        results.push({ countryCode, year, value })
      }
    }
    return results
  }

  // Format 2: { data: { "MT": { "2020": { value: 95.3 } } } }
  if (json?.data && typeof json.data === 'object') {
    for (const [countryCode, years] of Object.entries(json.data as Record<string, Record<string, unknown>>)) {
      if (typeof years !== 'object' || years === null) continue
      for (const [yearStr, entry] of Object.entries(years)) {
        const year = parseInt(yearStr, 10)
        const value = typeof entry === 'number' ? entry : parseFloat(String((entry as Record<string, unknown>)?.value ?? ''))
        if (!isNaN(year) && !isNaN(value)) {
          results.push({ countryCode, year, value })
        }
      }
    }
    return results
  }

  // Format 3: top-level array
  if (Array.isArray(json)) {
    for (const row of json as Record<string, unknown>[]) {
      const countryCode = String(row.geoUnit ?? row.country ?? row.location ?? row.ref_area ?? '')
      const year = parseInt(String(row.timePeriod ?? row.year ?? row.time ?? ''), 10)
      const value = parseFloat(String(row.value ?? row.obs_value ?? ''))
      if (countryCode && !isNaN(year) && !isNaN(value)) {
        results.push({ countryCode, year, value })
      }
    }
    return results
  }

  return results
}
