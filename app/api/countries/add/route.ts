import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, vision_name, vision_year, gap_number, sector, accent_colour, institutions } = await req.json()
    const supabase = createClient()

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Insert national vision
    const { data: vision, error: visionErr } = await supabase
      .from('national_visions')
      .insert({
        name: vision_name || `${name} Vision ${vision_year}`,
        slug,
        country_name: name,
        target_year: vision_year || 2030,
        accent_colour: accent_colour || '#1B6B5A',
      })
      .select()
      .single()

    if (visionErr) {
      // Try upsert or return error
      return NextResponse.json({ error: `Vision insert failed: ${visionErr.message}` }, { status: 400 })
    }

    // Insert primary sector
    if (sector && vision) {
      await supabase.from('sectors').insert({
        vision_id: vision.id,
        name: sector,
        current_workforce: 0,
        target_workforce: gap_number || 10000,
        target_year: vision_year || 2030,
        priority_score: 90,
        icon: '🏗️',
      })
    }

    // Insert institutions
    if (institutions && Array.isArray(institutions) && vision) {
      for (const inst of institutions) {
        await supabase.from('institutions').insert({
          vision_id: vision.id,
          name: inst.name,
          type: 'university',
          student_count: inst.students || null,
          wikidata_id: inst.wikidata_id || null,
        })
      }
    }

    // Try fetching World Bank HCI
    try {
      const codeMap: Record<string, string> = {
        'united arab emirates': 'ARE', 'uae': 'ARE', 'qatar': 'QAT', 'bahrain': 'BHR',
        'oman': 'OMN', 'kuwait': 'KWT', 'jordan': 'JOR', 'egypt': 'EGY',
        'morocco': 'MAR', 'tunisia': 'TUN', 'kenya': 'KEN', 'nigeria': 'NGA',
        'south africa': 'ZAF', 'india': 'IND', 'singapore': 'SGP',
      }
      const cc = codeMap[name.toLowerCase()]
      if (cc) {
        const hciRes = await fetch(
          `https://api.worldbank.org/v2/country/${cc}/indicator/HD.HCI.OVRL?format=json&mrv=1`
        )
        const hciData = await hciRes.json()
        const hciValue = hciData?.[1]?.[0]?.value
        if (hciValue) {
          await supabase.from('international_stats').insert({
            country_code: cc,
            source: 'WorldBank',
            indicator_code: 'HD.HCI.OVRL',
            indicator_name: 'Human Capital Index',
            year: 2024,
            value: hciValue,
          })
        }
      }
    } catch {
      // Non-critical — skip HCI fetch errors
    }

    return NextResponse.json({ success: true, slug })
  } catch (err) {
    console.error('add-country error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
