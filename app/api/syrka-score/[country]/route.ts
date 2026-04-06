import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params
    const supabase = createClient()

    // Get vision
    const { data: vision } = await supabase
      .from('national_visions')
      .select('id')
      .eq('slug', country)
      .single()

    if (!vision) {
      return NextResponse.json({ score: 0, grade: 'No data', dimensions: [], availableDimensions: 0 })
    }

    // Fetch sectors
    const { data: sectors } = await supabase
      .from('sectors')
      .select('*')
      .eq('vision_id', vision.id)

    // Fetch curriculum alignment scores
    const { data: programmes } = await supabase
      .from('programmes')
      .select('overall_alignment_score')
      .not('overall_alignment_score', 'is', null)

    // Fetch QS employer reputation scores
    const { data: rankings } = await supabase
      .from('university_rankings')
      .select('er_score')
      .eq('ranking_system', 'QS')
      .eq('year', 2026)
      .not('er_score', 'is', null)

    // Fetch prescriptions
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('gap_closure_percent')
      .eq('country', country)

    // Fetch HCI
    const countryCode = country === 'saudi' ? 'SAU' : 'MLT'
    const { data: hciData } = await supabase
      .from('international_stats')
      .select('value')
      .eq('country_code', countryCode)
      .eq('indicator_code', 'HD.HCI.OVRL')
      .order('year', { ascending: false })
      .limit(1)

    // Calculate dimensions
    const sectorList = sectors || []
    const currentYear = new Date().getFullYear()
    const onTrackSectors = sectorList.filter((s) => {
      const gap = (s.target_workforce || 0) - (s.current_workforce || 0)
      const yearsLeft = Math.max(1, (s.target_year || 2030) - currentYear)
      const annualGapRate = gap / yearsLeft
      return annualGapRate < (s.current_workforce || 1) * 0.05
    }).length
    const trajectoryScore = sectorList.length > 0
      ? Math.round((onTrackSectors / sectorList.length) * 100)
      : 0

    const progList = programmes || []
    const alignmentScore = progList.length > 0
      ? Math.round(progList.reduce((sum, p) => sum + (p.overall_alignment_score || 0), 0) / progList.length)
      : null

    const rankList = rankings || []
    const employerScore = rankList.length > 0
      ? Math.min(100, Math.round(rankList.reduce((sum, r) => sum + (r.er_score || 0), 0) / rankList.length * 2.5))
      : null

    const hciValue = hciData?.[0]?.value
    const benchmarkScore = hciValue ? Math.round(Number(hciValue) * 100) : null

    const prescriptionList = prescriptions || []
    const prescriptionCoverage = prescriptionList.reduce((sum, p) => sum + (p.gap_closure_percent || 0), 0)
    const coverageScore = Math.min(100, Math.round(prescriptionCoverage))

    const dimensions = [
      { name: 'Gap trajectory', score: trajectoryScore, weight: 0.30, available: true, description: 'Percentage of sectors on track to meet Vision workforce targets' },
      { name: 'Curriculum alignment', score: alignmentScore, weight: 0.25, available: alignmentScore !== null, description: 'Average programme alignment score against ESCO skills taxonomy' },
      { name: 'Employer readiness', score: employerScore, weight: 0.20, available: employerScore !== null, description: 'QS Employer Reputation score across ranked institutions' },
      { name: 'International benchmarking', score: benchmarkScore, weight: 0.15, available: benchmarkScore !== null, description: 'World Bank Human Capital Index (scaled 0-100)' },
      { name: 'Intervention coverage', score: coverageScore, weight: 0.10, available: true, description: 'Cumulative gap closure from active policy prescriptions' },
    ]

    const available = dimensions.filter((d) => d.available)
    const totalWeight = available.reduce((sum, d) => sum + d.weight, 0)
    const syrkaScore = totalWeight > 0
      ? Math.round(available.reduce((sum, d) => sum + ((d.score || 0) * d.weight), 0) / totalWeight)
      : 0

    const grade = syrkaScore >= 75 ? 'Strong' : syrkaScore >= 50 ? 'Developing' : 'Critical'

    return NextResponse.json({
      score: syrkaScore,
      grade,
      dimensions,
      availableDimensions: available.length,
    })
  } catch (err) {
    console.error('syrka-score error:', err)
    return NextResponse.json({ score: 0, grade: 'Error', dimensions: [], availableDimensions: 0 })
  }
}
