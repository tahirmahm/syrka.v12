import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const WEF_MEDIAN_SKILLS = 12

export async function POST(req: NextRequest) {
  try {
    const { skills, country } = await req.json()

    if (!skills || skills.length === 0) {
      return NextResponse.json({
        skillCount: 0,
        cohortAverage: WEF_MEDIAN_SKILLS,
        percentileEstimate: 0,
        rareSkills: [],
        cohortGaps: [],
        positioning: 'Upload your CV to see your cohort position.',
        standoutFactor: '',
      })
    }

    const supabase = createClient()

    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('self_assessed_skills')
      .eq('country', country || 'saudi')

    const profileCount = profiles?.length || 0
    const studentSkills = skills as string[]
    const studentSkillCount = studentSkills.length

    // If fewer than 10 profiles, use WEF benchmark
    if (profileCount < 10) {
      const percentile = Math.min(
        99,
        Math.round((studentSkillCount / (WEF_MEDIAN_SKILLS * 2)) * 100)
      )
      return NextResponse.json({
        skillCount: studentSkillCount,
        cohortAverage: WEF_MEDIAN_SKILLS,
        percentileEstimate: percentile,
        rareSkills: studentSkills.slice(0, 5),
        cohortGaps: [],
        positioning: `Based on WEF benchmarks, your ${studentSkillCount} skills place you in the estimated top ${100 - percentile}% of graduates.`,
        standoutFactor: studentSkillCount > WEF_MEDIAN_SKILLS
          ? `You have ${studentSkillCount - WEF_MEDIAN_SKILLS} more skills than the global median graduate.`
          : `Building ${WEF_MEDIAN_SKILLS - studentSkillCount} more skills would bring you to the global median.`,
      })
    }

    // Compute cohort stats
    const skillFrequency: Record<string, number> = {}
    let totalSkillCount = 0

    for (const p of profiles || []) {
      const pSkills = (p.self_assessed_skills as Array<{ skill: string }>) || []
      totalSkillCount += pSkills.length
      for (const s of pSkills) {
        if (s.skill) skillFrequency[s.skill] = (skillFrequency[s.skill] || 0) + 1
      }
    }

    const cohortAverage = Math.round(totalSkillCount / profileCount)

    // Rare skills: student has them, <20% of cohort does
    const rareThreshold = profileCount * 0.2
    const rareSkills = studentSkills.filter(
      s => (skillFrequency[s] || 0) < rareThreshold
    )

    // High-demand skills the cohort mostly lacks
    const HIGH_DEMAND = [
      'Machine Learning', 'Data Analysis', 'Cloud Computing', 'Python',
      'AI Systems', 'Cybersecurity', 'Statistical Analysis', 'Automation',
      'Digital Transformation', 'Prompt Engineering',
    ]
    const cohortGaps = HIGH_DEMAND.filter(
      hd => (skillFrequency[hd] || 0) < profileCount * 0.3
    ).slice(0, 5)

    // Percentile estimate
    const skillCounts = (profiles || []).map(p => {
      const s = (p.self_assessed_skills as Array<{ skill: string }>) || []
      return s.length
    })
    const belowCount = skillCounts.filter(c => c < studentSkillCount).length
    const percentileEstimate = Math.round((belowCount / profileCount) * 100)

    return NextResponse.json({
      skillCount: studentSkillCount,
      cohortAverage,
      percentileEstimate,
      rareSkills: rareSkills.slice(0, 5),
      cohortGaps,
      positioning: `You are in the estimated top ${100 - percentileEstimate}% of ${country === 'saudi' ? 'Saudi' : country === 'uk' ? 'UK' : 'Maltese'} students in your skill category.`,
      standoutFactor: rareSkills.length > 0
        ? `You have ${rareSkills.length} rare skill${rareSkills.length > 1 ? 's' : ''} that fewer than 20% of your peers possess.`
        : `Your skill mix is well-rounded. Adding a niche specialisation would boost your differentiation.`,
    })
  } catch (err) {
    console.error('cohort-position error:', err)
    return NextResponse.json({
      skillCount: 0,
      cohortAverage: WEF_MEDIAN_SKILLS,
      percentileEstimate: 50,
      rareSkills: [],
      cohortGaps: [],
      positioning: 'Could not compute cohort position.',
      standoutFactor: '',
    })
  }
}
