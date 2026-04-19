import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { maltaSeedData } from '@/lib/seed-data/malta'
import { saudiSeedData } from '@/lib/seed-data/saudi'
import { ukSeedData } from '@/lib/seed-data/uk'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const results: string[] = []

  try {
    // Clear existing data in reverse dependency order
    await supabase.from('student_skills').delete().neq('student_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('employer_skills').delete().neq('employer_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('course_skills').delete().neq('course_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('programme_skills').delete().neq('programme_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('programmes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('trajectory_points').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('ai_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('employers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('institutions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('sectors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('national_visions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    results.push('Cleared existing data')

    for (const seedData of [maltaSeedData, saudiSeedData, ukSeedData]) {
      // 1. Insert vision
      const { data: vision, error: visionError } = await supabase
        .from('national_visions')
        .insert(seedData.vision)
        .select()
        .single()

      if (visionError) throw new Error(`Vision insert error: ${visionError.message}`)
      results.push(`Inserted vision: ${vision.vision_name}`)

      // 2. Insert sectors
      const sectorsToInsert = seedData.sectors.map(s => ({
        ...s,
        vision_id: vision.id,
      }))
      const { data: sectors, error: sectorsError } = await supabase
        .from('sectors')
        .insert(sectorsToInsert)
        .select()

      if (sectorsError) throw new Error(`Sectors insert error: ${sectorsError.message}`)
      results.push(`Inserted ${sectors.length} sectors for ${vision.country}`)

      const sectorMap = new Map(sectors.map(s => [s.name, s.id]))

      // 3. Insert skills
      const skillsToInsert = seedData.skills.map(s => ({
        vision_id: vision.id,
        sector_id: sectorMap.get(s.sector),
        name: s.name,
        category: s.category,
        current_supply: s.current_supply,
        projected_demand_target_year: s.projected_demand,
        annual_growth_rate: s.annual_growth_rate,
        gap_score: s.gap_score,
        criticality: s.criticality,
      }))
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .insert(skillsToInsert)
        .select()

      if (skillsError) throw new Error(`Skills insert error: ${skillsError.message}`)
      results.push(`Inserted ${skills.length} skills for ${vision.country}`)

      // 4. Insert institutions
      const institutionsToInsert = seedData.institutions.map(i => ({
        ...i,
        vision_id: vision.id,
      }))
      const { data: institutions, error: instError } = await supabase
        .from('institutions')
        .insert(institutionsToInsert)
        .select()

      if (instError) throw new Error(`Institutions insert error: ${instError.message}`)
      results.push(`Inserted ${institutions.length} institutions for ${vision.country}`)

      // 5. Insert employers
      const employersToInsert = seedData.employers.map(e => ({
        vision_id: vision.id,
        sector_id: sectorMap.get(e.sector),
        name: e.name,
        size: e.size,
        open_roles: e.open_roles,
        graduate_satisfaction_score: e.graduate_satisfaction_score,
        avg_time_to_fill_days: e.avg_time_to_fill_days,
        is_vision_partner: e.is_vision_partner,
      }))
      const { data: employers, error: empError } = await supabase
        .from('employers')
        .insert(employersToInsert)
        .select()

      if (empError) throw new Error(`Employers insert error: ${empError.message}`)
      results.push(`Inserted ${employers.length} employers for ${vision.country}`)

      // 6. Generate programmes for each institution
      const programmeTemplates: Record<string, { name: string; level: string; duration: number; sector: string }[]> = {
        'university': [
          { name: 'BSc Computer Science', level: 'bachelor', duration: 3, sector: 'Digital Economy & ICT' },
          { name: 'BSc Finance & Economics', level: 'bachelor', duration: 3, sector: 'Financial Services' },
          { name: 'MSc Artificial Intelligence', level: 'master', duration: 1.5, sector: 'Digital Economy & ICT' },
          { name: 'BSc Nursing & Healthcare', level: 'bachelor', duration: 4, sector: 'Healthcare & Life Sciences' },
          { name: 'MSc Sustainable Energy', level: 'master', duration: 2, sector: 'Green Economy & Energy' },
        ],
        'polytechnic': [
          { name: 'Diploma in Software Development', level: 'diploma', duration: 2, sector: 'Digital Economy & ICT' },
          { name: 'Diploma in Digital Marketing', level: 'diploma', duration: 2, sector: 'Creative & Knowledge Industries' },
          { name: 'Certificate in Cybersecurity', level: 'certificate', duration: 1, sector: 'Digital Economy & ICT' },
          { name: 'Diploma in Electrical Engineering', level: 'diploma', duration: 2, sector: 'Green Economy & Energy' },
        ],
        'vocational': [
          { name: 'Certificate in IT Support', level: 'certificate', duration: 1, sector: 'Digital Economy & ICT' },
          { name: 'Certificate in Healthcare Assistant', level: 'certificate', duration: 1, sector: 'Healthcare & Life Sciences' },
          { name: 'Certificate in Hospitality Operations', level: 'certificate', duration: 1, sector: 'Tourism & Hospitality' },
        ],
      }

      const saudiProgrammeTemplates: Record<string, { name: string; level: string; duration: number; sector: string }[]> = {
        'university': [
          { name: 'BSc Computer Engineering', level: 'bachelor', duration: 4, sector: 'Technology & Digital Infrastructure' },
          { name: 'BSc Petroleum Engineering', level: 'bachelor', duration: 4, sector: 'Renewable Energy & Environment' },
          { name: 'MSc Cybersecurity', level: 'master', duration: 2, sector: 'Technology & Digital Infrastructure' },
          { name: 'BSc Finance & Banking', level: 'bachelor', duration: 4, sector: 'Financial Services & Fintech' },
          { name: 'MSc Data Science & AI', level: 'master', duration: 2, sector: 'Technology & Digital Infrastructure' },
        ],
        'vocational': [
          { name: 'Diploma in Industrial Technology', level: 'diploma', duration: 2, sector: 'Manufacturing & Industry 4.0' },
          { name: 'Diploma in Tourism & Hospitality', level: 'diploma', duration: 2, sector: 'Tourism & Hospitality' },
          { name: 'Certificate in Solar Panel Installation', level: 'certificate', duration: 1, sector: 'Renewable Energy & Environment' },
          { name: 'Diploma in Healthcare Technology', level: 'diploma', duration: 2, sector: 'Healthcare & Life Sciences' },
        ],
      }

      const ukProgrammeTemplates: Record<string, { name: string; level: string; duration: number; sector: string }[]> = {
        'university': [
          { name: 'BSc Computer Science with AI', level: 'bachelor', duration: 3, sector: 'AI and Machine Learning' },
          { name: 'MSc Machine Learning', level: 'master', duration: 1, sector: 'AI and Machine Learning' },
          { name: 'BSc Cybersecurity', level: 'bachelor', duration: 3, sector: 'Cybersecurity' },
          { name: 'MSc Data Science', level: 'master', duration: 1, sector: 'Data Science and Analytics' },
          { name: 'BSc Health Informatics', level: 'bachelor', duration: 3, sector: 'Health and Public Sector AI' },
        ],
        'vocational': [
          { name: 'AI Foundations Certificate', level: 'certificate', duration: 1, sector: 'Digital Foundations' },
          { name: 'Diploma in Cloud Engineering', level: 'diploma', duration: 2, sector: 'Cloud and Infrastructure' },
        ],
      }

      const templates = vision.slug === 'saudi' ? saudiProgrammeTemplates : vision.slug === 'uk' ? ukProgrammeTemplates : programmeTemplates

      let allProgrammes: { id: string; institution_id: string; name: string }[] = []

      for (const inst of institutions) {
        const instType = inst.type || 'university'
        const progTemplates = templates[instType] || templates['university'] || []
        const programmesToInsert = progTemplates.map((pt, idx) => ({
          institution_id: inst.id,
          name: pt.name,
          level: pt.level,
          duration_years: pt.duration,
          annual_intake: Math.floor((inst.annual_graduate_count || 500) / progTemplates.length * 1.2),
          annual_graduates: Math.floor((inst.annual_graduate_count || 500) / progTemplates.length),
          overall_alignment_score: 45 + Math.random() * 40,
          employment_rate_6months: 55 + Math.random() * 35,
          avg_starting_salary: vision.slug === 'saudi' ? 28000 + idx * 4000 : 22000 + idx * 3000,
        }))

        const { data: progs, error: progError } = await supabase
          .from('programmes')
          .insert(programmesToInsert)
          .select()

        if (progError) throw new Error(`Programme insert error: ${progError.message}`)
        allProgrammes = allProgrammes.concat(progs)
      }
      results.push(`Inserted ${allProgrammes.length} programmes for ${vision.country}`)

      // 7. Generate courses for each programme
      const courseTemplatesByLevel: Record<string, string[]> = {
        'bachelor': [
          'Introduction to Programming', 'Data Structures & Algorithms', 'Database Systems',
          'Statistics & Probability', 'Professional Ethics', 'Research Methods',
          'Industry Project', 'Capstone Project'
        ],
        'master': [
          'Advanced Research Methods', 'Seminar in Emerging Technologies',
          'Applied Machine Learning', 'Strategic Management', 'Thesis Research',
          'Industry Placement'
        ],
        'diploma': [
          'Foundations & Principles', 'Applied Techniques', 'Professional Practice',
          'Project Management', 'Industry Practicum', 'Portfolio Development'
        ],
        'certificate': [
          'Core Concepts', 'Practical Skills Workshop', 'Assessment & Certification',
          'Industry Readiness'
        ],
        'phd': [
          'Doctoral Seminar', 'Advanced Research Design', 'Publication Workshop',
          'Comprehensive Examination', 'Dissertation I', 'Dissertation II'
        ],
      }

      let courseCount = 0
      for (const prog of allProgrammes) {
        const level = (prog as unknown as { level: string }).level || 'bachelor'
        const templateCourses = courseTemplatesByLevel[level] || courseTemplatesByLevel['bachelor']
        const coursesToInsert = templateCourses.map((courseName, idx) => ({
          programme_id: prog.id,
          name: courseName,
          code: `${prog.name.substring(0, 3).toUpperCase()}${(idx + 1) * 100 + 1}`,
          credits: level === 'certificate' ? 10 : level === 'diploma' ? 15 : 20,
          year_of_study: Math.ceil((idx + 1) / (templateCourses.length / (level === 'bachelor' ? 3 : level === 'master' ? 2 : 1))),
          alignment_score: 30 + Math.random() * 60,
          last_updated: 2020 + Math.floor(Math.random() * 5),
          description: `${courseName} for ${prog.name}`,
        }))

        const { error: courseError } = await supabase
          .from('courses')
          .insert(coursesToInsert)

        if (courseError) throw new Error(`Course insert error: ${courseError.message}`)
        courseCount += coursesToInsert.length
      }
      results.push(`Inserted ${courseCount} courses for ${vision.country}`)

      // 8. Generate synthetic students
      let studentCount = 0
      for (const inst of institutions) {
        const instProgrammes = allProgrammes.filter(p => p.institution_id === inst.id)
        if (instProgrammes.length === 0) continue

        const studentsToInsert = Array.from({ length: 50 }, (_, i) => {
          const prog = instProgrammes[i % instProgrammes.length]
          return {
            institution_id: inst.id,
            programme_id: prog.id,
            year_of_study: (i % 4) + 1,
            vision_alignment_score: 35 + Math.random() * 55,
            employment_readiness_score: 40 + Math.random() * 50,
            nationality: vision.country,
            cohort_year: 2024 - (i % 4),
          }
        })

        const { error: studentError } = await supabase
          .from('students')
          .insert(studentsToInsert)

        if (studentError) throw new Error(`Student insert error: ${studentError.message}`)
        studentCount += studentsToInsert.length
      }
      results.push(`Inserted ${studentCount} students for ${vision.country}`)

      // 9. Insert trajectory points
      const trajectoryToInsert = seedData.trajectoryPoints.map(tp => ({
        vision_id: vision.id,
        sector_id: sectorMap.get(tp.sector),
        year: tp.year,
        current_trajectory: tp.current_trajectory,
        vision_target: tp.vision_target,
        with_intervention: tp.with_intervention,
        data_type: tp.data_type,
      }))

      const { error: trajError } = await supabase
        .from('trajectory_points')
        .insert(trajectoryToInsert)

      if (trajError) throw new Error(`Trajectory insert error: ${trajError.message}`)
      results.push(`Inserted ${trajectoryToInsert.length} trajectory points for ${vision.country}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      details: results,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: results,
      },
      { status: 500 }
    )
  }
}
