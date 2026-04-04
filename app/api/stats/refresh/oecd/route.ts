import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// OECD only covers a subset of the focus countries
const OECD_COUNTRIES = [
  { iso3: 'MLT', iso2: 'MT' },
  { iso3: 'EST', iso2: 'EE' },
  { iso3: 'SVN', iso2: 'SI' },
  { iso3: 'LUX', iso2: 'LU' },
]

const INDICATORS = [
  { code: 'NEET_RATE', name: 'NEET rate (youth not in employment, education or training)', unit: '%' },
  { code: 'EDU_ATTAIN_TERT', name: 'Tertiary education attainment rate (25-64)', unit: '%' },
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  let totalUpserted = 0
  const errors: string[] = []
  const skippedCountries = ['SAU', 'CYP', 'ARE', 'QAT', 'BHR', 'KWT']

  for (const country of OECD_COUNTRIES) {
    try {
      const url = `https://stats.oecd.org/SDMX-JSON/data/EAG_NEAC/${country.iso3}.A/all?startTime=2015&endTime=2025`
      const res = await fetch(url)

      if (!res.ok) {
        if (res.status === 404) {
          errors.push(`No OECD data available for ${country.iso3} (404)`)
          continue
        }
        errors.push(`Failed to fetch OECD data for ${country.iso3}: HTTP ${res.status}`)
        continue
      }

      const json = await res.json()

      // SDMX-JSON structure: dataSets[0].series -> observations
      const dataSets = json?.dataSets
      if (!Array.isArray(dataSets) || dataSets.length === 0) {
        errors.push(`Empty dataset for ${country.iso3}`)
        continue
      }

      const series = dataSets[0]?.series
      if (!series || typeof series !== 'object') {
        errors.push(`No series data for ${country.iso3}`)
        continue
      }

      // Extract time periods from structure.dimensions.observation
      const timeDimension = json?.structure?.dimensions?.observation?.find(
        (d: { id: string }) => d.id === 'TIME_PERIOD' || d.id === 'Time'
      )
      const timePeriods: string[] = timeDimension?.values?.map((v: { id: string }) => v.id) ?? []

      const records: Array<Record<string, unknown>> = []

      for (const [, seriesData] of Object.entries(series as Record<string, Record<string, unknown>>)) {
        const observations = seriesData?.observations as Record<string, unknown> | undefined
        if (!observations) continue

        // Determine indicator from series key context
        // Map to our indicator codes based on available data
        for (const indicator of INDICATORS) {
          for (const [obsKey, obsValue] of Object.entries(observations)) {
            const timeIndex = parseInt(obsKey, 10)
            const yearStr = timePeriods[timeIndex]
            if (!yearStr) continue

            const year = parseInt(yearStr, 10)
            if (isNaN(year) || year < 2015 || year > 2025) continue

            const value = Array.isArray(obsValue) ? obsValue[0] : obsValue
            if (value === null || value === undefined) continue

            records.push({
              country_code: country.iso2,
              source: 'oecd',
              indicator_code: indicator.code,
              indicator_name: indicator.name,
              year,
              value: typeof value === 'number' ? value : parseFloat(value),
              unit: indicator.unit,
              fetched_at: new Date().toISOString(),
            })
          }
          // Only use first matching series per indicator
          break
        }
      }

      // Deduplicate by country_code + indicator_code + year
      const seen = new Set<string>()
      const dedupedRecords = records.filter((r) => {
        const key = `${r.country_code}-${r.indicator_code}-${r.year}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (dedupedRecords.length > 0) {
        const { error } = await supabase
          .from('international_stats')
          .upsert(dedupedRecords, {
            onConflict: 'country_code,source,indicator_code,year',
          })

        if (error) {
          errors.push(`Upsert error for ${country.iso3}: ${error.message}`)
        } else {
          totalUpserted += dedupedRecords.length
        }
      }
    } catch (err: unknown) {
      errors.push(`Exception for ${country.iso3}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    source: 'oecd',
    totalUpserted,
    skippedCountries,
    note: 'Non-OECD countries (SA, CY, AE, QA, BH, KW) are skipped as OECD does not cover them.',
    errors: errors.length > 0 ? errors : undefined,
  })
}
