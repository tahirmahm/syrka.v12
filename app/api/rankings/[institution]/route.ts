import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * Parse a rank text value to a numeric value for comparison/sorting.
 * Examples:
 *   "851-900" -> 851
 *   "=593"    -> 593
 *   "1001-1200" -> 1001
 *   "42"      -> 42
 * Returns null if the value cannot be parsed.
 */
function parseRankToNumeric(rank: string | null | undefined): number | null {
  if (!rank) return null
  const cleaned = rank.replace(/^=/, '').trim()
  const rangeMatch = cleaned.match(/^(\d+)\s*-\s*\d+$/)
  if (rangeMatch) {
    return parseInt(rangeMatch[1], 10)
  }
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? null : num
}

/**
 * Calculate the trend between two rank values.
 * A negative result means improvement (lower rank number = better).
 * A positive result means decline.
 * Returns null if either value is not parseable.
 */
function calculateRankTrend(
  currentRank: string | null,
  previousRank: string | null
): number | null {
  const current = parseRankToNumeric(currentRank)
  const previous = parseRankToNumeric(previousRank)
  if (current === null || previous === null) return null
  return current - previous
}

function getPeerInstitutions(name: string): string[] {
  const peerGroups: Record<string, string[]> = {
    Malta: [
      'University of Cyprus', 'University of Ljubljana',
      'Tallinn University of Technology', 'University of Luxembourg',
    ],
    Saudi: [
      'King Fahd University of Petroleum and Minerals',
      'King Saud University', 'King Abdulaziz University',
      'United Arab Emirates University', 'Qatar University',
    ],
  }
  if (name.toLowerCase().includes('malta')) return peerGroups.Malta
  return peerGroups.Saudi
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ institution: string }> }
) {
  try {
    const { institution } = await params
    const institutionName = decodeURIComponent(institution)

    if (!institutionName) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Strip parenthesized abbreviations like "(KFUPM)" for fuzzy matching
    const searchName = institutionName.replace(/\s*\([^)]*\)\s*$/, '').trim()

    const { data: rankings, error } = await supabase
      .from('university_rankings')
      .select('*')
      .ilike('institution_name', `%${searchName}%`)
      .order('year', { ascending: false })

    if (error) {
      throw new Error(`Query error: ${error.message}`)
    }

    // Fetch peer institutions
    const peerNames = getPeerInstitutions(searchName)
    const { data: peers } = await supabase
      .from('university_rankings')
      .select('*')
      .in('institution_name', peerNames)
      .order('year', { ascending: true })

    if (!rankings || rankings.length === 0) {
      return NextResponse.json(
        { error: `No rankings found for institution: ${institutionName}` },
        { status: 404 }
      )
    }

    // Calculate year-over-year trends
    const rankingsWithTrends = rankings.map((ranking, index) => {
      const previousYear = index < rankings.length - 1 ? rankings[index + 1] : null

      return {
        ...ranking,
        trends: previousYear
          ? {
              overall_rank_change: calculateRankTrend(
                ranking.overall_rank,
                previousYear.overall_rank
              ),
              overall_score_change:
                ranking.overall_score !== null && previousYear.overall_score !== null
                  ? parseFloat(
                      (ranking.overall_score - previousYear.overall_score).toFixed(2)
                    )
                  : null,
              ar_score_change:
                ranking.ar_score !== null && previousYear.ar_score !== null
                  ? parseFloat((ranking.ar_score - previousYear.ar_score).toFixed(2))
                  : null,
              er_score_change:
                ranking.er_score !== null && previousYear.er_score !== null
                  ? parseFloat((ranking.er_score - previousYear.er_score).toFixed(2))
                  : null,
              fsr_score_change:
                ranking.fsr_score !== null && previousYear.fsr_score !== null
                  ? parseFloat((ranking.fsr_score - previousYear.fsr_score).toFixed(2))
                  : null,
              sus_score_change:
                ranking.sus_score !== null && previousYear.sus_score !== null
                  ? parseFloat((ranking.sus_score - previousYear.sus_score).toFixed(2))
                  : null,
            }
          : null,
      }
    })

    return NextResponse.json({
      institution: rankings[0].institution_name,
      country: rankings[0].country,
      rankings: rankingsWithTrends,
      peers: peers ?? [],
    })
  } catch (error) {
    console.error('Rankings fetch error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
