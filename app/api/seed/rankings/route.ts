import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * Parse a CSV string into an array of string arrays.
 * Handles quoted fields (including commas and newlines within quotes)
 * and doubled quotes for escaping.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current.trim())
        current = ''
      } else if (char === '\n') {
        row.push(current.trim())
        current = ''
        if (row.length > 1 || row[0] !== '') {
          rows.push(row)
        }
        row = []
      } else if (char === '\r') {
        // skip carriage return
      } else {
        current += char
      }
    }
  }

  // Push the last field and row
  if (current !== '' || row.length > 0) {
    row.push(current.trim())
    if (row.length > 1 || row[0] !== '') {
      rows.push(row)
    }
  }

  return rows
}

/**
 * Parse a score string to a number or null.
 * Empty strings and non-numeric values become null.
 */
function parseScore(value: string): number | null {
  if (value === '' || value === undefined || value === null) return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Parse year string to integer.
 */
function parseYear(value: string): number {
  return parseInt(value, 10)
}

// Column indices based on the CSV format specification.
// Duplicate columns (isd_score, isd_rank) at positions 33-34 are ignored;
// we use the first occurrence at positions 22-23.
const COL = {
  rank: 0,
  prev_rank: 1,
  institution: 2,
  location_code: 3,
  country: 4,
  size: 5,
  focus: 6,
  research: 7,
  status: 8,
  ar_score: 9,
  ar_rank: 10,
  er_score: 11,
  er_rank: 12,
  fsr_score: 13,
  fsr_rank: 14,
  cpf_score: 15,
  cpf_rank: 16,
  ifr_score: 17,
  ifr_rank: 18,
  isr_score: 19,
  isr_rank: 20,
  isd_score: 21,
  isd_rank: 22,
  irn_score: 23,
  irn_rank: 24,
  eo_score: 25,
  eo_rank: 26,
  sus_score: 27,
  sus_rank: 28,
  overall_score: 29,
  year: 30,
  index: 31,
  region: 32,
  // isd_score_dup: 33, -- ignored
  // isd_rank_dup: 34,  -- ignored
} as const

export async function POST(req: NextRequest) {
  try {
    const csvText = await req.text()

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Request body must contain CSV text' },
        { status: 400 }
      )
    }

    const rows = parseCSV(csvText)

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'CSV must contain a header row and at least one data row' },
        { status: 400 }
      )
    }

    // Skip header row
    const dataRows = rows.slice(1)

    const records = dataRows.map((row) => ({
      institution_name: row[COL.institution] || '',
      ranking_system: 'QS',
      year: parseYear(row[COL.year]),
      overall_rank: row[COL.rank] || null,
      overall_score: parseScore(row[COL.overall_score]),
      ar_score: parseScore(row[COL.ar_score]),
      ar_rank: row[COL.ar_rank] || null,
      er_score: parseScore(row[COL.er_score]),
      er_rank: row[COL.er_rank] || null,
      fsr_score: parseScore(row[COL.fsr_score]),
      fsr_rank: row[COL.fsr_rank] || null,
      cpf_score: parseScore(row[COL.cpf_score]),
      cpf_rank: row[COL.cpf_rank] || null,
      ifr_score: parseScore(row[COL.ifr_score]),
      ifr_rank: row[COL.ifr_rank] || null,
      isr_score: parseScore(row[COL.isr_score]),
      isr_rank: row[COL.isr_rank] || null,
      isd_score: parseScore(row[COL.isd_score]),
      isd_rank: row[COL.isd_rank] || null,
      irn_score: parseScore(row[COL.irn_score]),
      irn_rank: row[COL.irn_rank] || null,
      eo_score: parseScore(row[COL.eo_score]),
      eo_rank: row[COL.eo_rank] || null,
      sus_score: parseScore(row[COL.sus_score]),
      sus_rank: row[COL.sus_rank] || null,
      location_code: row[COL.location_code] || null,
      country: row[COL.country] || null,
      size: row[COL.size] || null,
      focus: row[COL.focus] || null,
      research: row[COL.research] || null,
      status: row[COL.status] || null,
      region: row[COL.region] || null,
    }))

    // Filter out any records with missing required fields
    const validRecords = records.filter(
      (r) => r.institution_name && r.year && !isNaN(r.year)
    )

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Batch upsert in chunks of 500 to avoid payload limits
    const BATCH_SIZE = 500
    let totalUpserted = 0

    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batch = validRecords.slice(i, i + BATCH_SIZE)

      const { error } = await supabase
        .from('university_rankings')
        .upsert(batch, {
          onConflict: 'institution_name,ranking_system,year',
        })

      if (error) {
        throw new Error(
          `Upsert error at batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
        )
      }

      totalUpserted += batch.length
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${totalUpserted} QS ranking records`,
      count: totalUpserted,
    })
  } catch (error) {
    console.error('Rankings seed error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
