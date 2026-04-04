import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const INDICATORS = [
  { code: 'SL.UEM.TOTL.ZS', name: 'Unemployment rate', unit: '%' },
  { code: 'SE.XPD.TOTL.GD.ZS', name: 'Education expenditure (% of GDP)', unit: '% of GDP' },
  { code: 'GB.XPD.RSDV.GD.ZS', name: 'R&D expenditure (% of GDP)', unit: '% of GDP' },
  { code: 'SL.TLF.CACT.ZS', name: 'Labor force participation rate', unit: '%' },
  { code: 'NY.GDP.PCAP.PP.CD', name: 'GDP per capita (PPP)', unit: 'current international $' },
]

const COUNTRY_CODES = 'MLT;SAU;CYP;EST;SVN;LUX;ARE;QAT;BHR;KWT'

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
      const url = `https://api.worldbank.org/v2/country/${COUNTRY_CODES}/indicator/${indicator.code}?format=json&date=2015:2025&per_page=500`
      const res = await fetch(url)

      if (!res.ok) {
        errors.push(`Failed to fetch ${indicator.code}: HTTP ${res.status}`)
        continue
      }

      const json = await res.json()

      // World Bank API returns [metadata, data] array
      if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
        errors.push(`No data returned for ${indicator.code}`)
        continue
      }

      const records = json[1]
        .filter((row: Record<string, unknown>) => row.value !== null && (row.countryiso3code as string) in ISO3_TO_ISO2)
        .map((row: Record<string, unknown>) => ({
          country_code: ISO3_TO_ISO2[row.countryiso3code as string],
          source: 'worldbank',
          indicator_code: indicator.code,
          indicator_name: indicator.name,
          year: parseInt(row.date as string, 10),
          value: row.value,
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
    source: 'worldbank',
    totalUpserted,
    errors: errors.length > 0 ? errors : undefined,
  })
}
