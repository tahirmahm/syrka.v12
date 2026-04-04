import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const INDICATORS = [
  { code: 'EMP_DWAP_SEX_AGE_RT', name: 'Employment-to-population ratio', unit: '%' },
  { code: 'UNE_DEAP_SEX_AGE_RT', name: 'Unemployment rate by age', unit: '%' },
]

const COUNTRIES = ['MLT', 'SAU', 'CYP', 'EST', 'SVN', 'LUX', 'ARE', 'QAT', 'BHR', 'KWT']

const ISO3_TO_ISO2: Record<string, string> = {
  MLT: 'MT',
  SAU: 'SA',
  CYP: 'CY',
  EST: 'EE',
  SVN: 'SI',
  LUX: 'LU',
  ARE: 'AE',
  QAT: 'QA',
  BHR: 'BH',
  KWT: 'KW',
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  let totalUpserted = 0
  const errors: string[] = []

  for (const indicator of INDICATORS) {
    for (const countryIso3 of COUNTRIES) {
      try {
        const url = `https://rplumber.ilo.org/data/indicator/?id=${indicator.code}&ref_area=${countryIso3}&timefrom=2015&timeto=2025&format=.csv`
        const res = await fetch(url)

        if (!res.ok) {
          if (res.status === 404) continue // No data for this country
          errors.push(`Failed to fetch ${indicator.code} for ${countryIso3}: HTTP ${res.status}`)
          continue
        }

        const text = await res.text()
        if (!text.trim()) continue

        const rows = parseCSV(text)
        const iso2 = ISO3_TO_ISO2[countryIso3]

        // ILO CSV typically has ref_area, indicator, sex, classif1, time, obs_value columns
        // We take the total (sex = SEX_T) aggregate rows
        const records = rows
          .filter((row) => {
            const sex = row.sex ?? row.SEX ?? ''
            const value = row.obs_value ?? row.OBS_VALUE ?? ''
            return (sex === 'SEX_T' || sex === 'T' || sex === '') && value !== ''
          })
          .map((row) => {
            const year = parseInt(row.time ?? row.TIME_PERIOD ?? '', 10)
            const value = parseFloat(row.obs_value ?? row.OBS_VALUE ?? '')
            return { year, value }
          })
          .filter((r) => !isNaN(r.year) && !isNaN(r.value) && r.year >= 2015 && r.year <= 2025)
          // Deduplicate by year — take the first value per year
          .reduce<{ year: number; value: number }[]>((acc, r) => {
            if (!acc.find((a) => a.year === r.year)) acc.push(r)
            return acc
          }, [])
          .map((r) => ({
            country_code: iso2,
            source: 'ilo',
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
            errors.push(`Upsert error for ${indicator.code}/${countryIso3}: ${error.message}`)
          } else {
            totalUpserted += records.length
          }
        }
      } catch (err: unknown) {
        errors.push(`Exception for ${indicator.code}/${countryIso3}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  return NextResponse.json({
    source: 'ilo',
    totalUpserted,
    errors: errors.length > 0 ? errors : undefined,
  })
}
