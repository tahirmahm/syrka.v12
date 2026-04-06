import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { country } = await req.json()
    const supabase = createClient()

    const { data: vision } = await supabase
      .from('national_visions')
      .select('id')
      .eq('slug', country)
      .single()

    if (!vision) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    const [sectorsRes, prescriptionsRes, simulationsRes] = await Promise.all([
      supabase.from('sectors').select('*').eq('vision_id', vision.id).order('priority_score', { ascending: false }),
      supabase.from('prescriptions').select('*').eq('country', country).order('confidence_score', { ascending: false }),
      supabase.from('simulation_jobs').select('*').eq('country', country).eq('status', 'complete').order('created_at', { ascending: false }).limit(3),
    ])

    // Fetch Syrka Score inline
    const { data: programmes } = await supabase
      .from('programmes')
      .select('overall_alignment_score')
      .not('overall_alignment_score', 'is', null)

    const sectorList = sectorsRes.data || []
    const currentYear = new Date().getFullYear()
    const onTrack = sectorList.filter((s) => {
      const gap = (s.target_workforce || 0) - (s.current_workforce || 0)
      const yearsLeft = Math.max(1, (s.target_year || 2030) - currentYear)
      return gap / yearsLeft < (s.current_workforce || 1) * 0.05
    }).length
    const trajectoryScore = sectorList.length > 0 ? Math.round((onTrack / sectorList.length) * 100) : 0
    const progList = programmes || []
    const alignmentScore = progList.length > 0
      ? Math.round(progList.reduce((sum, p) => sum + (p.overall_alignment_score || 0), 0) / progList.length)
      : null
    const prescriptionCoverage = (prescriptionsRes.data || []).reduce((sum, p) => sum + (p.gap_closure_percent || 0), 0)

    const dims = [
      { name: 'Gap trajectory', score: trajectoryScore, weight: 0.30 },
      { name: 'Curriculum alignment', score: alignmentScore || 0, weight: 0.25 },
      { name: 'Intervention coverage', score: Math.min(100, Math.round(prescriptionCoverage)), weight: 0.10 },
    ]
    const totalW = dims.reduce((s, d) => s + d.weight, 0)
    const syrkaScore = Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0) / totalW)
    const grade = syrkaScore >= 75 ? 'Strong' : syrkaScore >= 50 ? 'Developing' : 'Critical'

    return NextResponse.json({
      country,
      generated_at: new Date().toISOString(),
      sectors: sectorsRes.data || [],
      prescriptions: prescriptionsRes.data || [],
      simulations: simulationsRes.data || [],
      syrka_score: { score: syrkaScore, grade },
    })
  } catch (err) {
    console.error('policy-brief error:', err)
    return NextResponse.json({ error: 'Failed to generate brief data' }, { status: 500 })
  }
}
