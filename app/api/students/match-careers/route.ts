import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface Certification {
  name: string
  url: string
  free: boolean
  duration: string
}

interface Career {
  title: string
  sector: string
  gap_years: number
  median_salary_sar?: number
  median_salary_eur?: number
  median_salary_gbp?: number
  open_roles: number
  vision_priority: string
  required_skills: string[]
  certifications: Certification[]
}

const VISION_CAREERS: Record<string, Career[]> = {
  saudi: [
    {
      title: 'AI Engineer', sector: 'Technology', gap_years: 2.5, median_salary_sar: 356000, open_roles: 8400, vision_priority: 'high',
      required_skills: ['Machine learning', 'Python', 'Data modelling', 'Algorithm design', 'Statistical analysis'],
      certifications: [
        { name: 'fast.ai Practical Deep Learning', url: 'https://course.fast.ai', free: true, duration: '7 weeks' },
        { name: 'DeepLearning.AI ML Specialization', url: 'https://www.coursera.org/specializations/machine-learning-introduction', free: false, duration: '2 months' },
        { name: 'Google Professional ML Engineer', url: 'https://cloud.google.com/certification/machine-learning-engineer', free: false, duration: '3-6 months' },
      ],
    },
    {
      title: 'Cybersecurity Analyst', sector: 'Technology', gap_years: 1.8, median_salary_sar: 292000, open_roles: 6200, vision_priority: 'high',
      required_skills: ['Network security', 'Threat analysis', 'Risk assessment', 'Security protocols', 'Incident response'],
      certifications: [
        { name: 'TryHackMe SOC Level 1', url: 'https://tryhackme.com/path/outline/soclevel1', free: true, duration: '4 weeks' },
        { name: 'Google Cybersecurity Certificate', url: 'https://grow.google/certificates/cybersecurity/', free: false, duration: '6 months' },
        { name: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', free: false, duration: '2-3 months' },
      ],
    },
    {
      title: 'Data Scientist', sector: 'Technology', gap_years: 2.1, median_salary_sar: 329000, open_roles: 7100, vision_priority: 'high',
      required_skills: ['Data analysis', 'Statistical modelling', 'Python', 'Data visualisation', 'Machine learning'],
      certifications: [
        { name: 'Kaggle Learn — Intro to ML', url: 'https://www.kaggle.com/learn', free: true, duration: '2 weeks' },
        { name: 'IBM Data Science Professional Certificate', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', free: false, duration: '3 months' },
        { name: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', free: false, duration: '6 months' },
      ],
    },
    {
      title: 'Cloud Solutions Architect', sector: 'Technology', gap_years: 3.2, median_salary_sar: 411000, open_roles: 4800, vision_priority: 'high',
      required_skills: ['Cloud computing', 'System architecture', 'Network infrastructure', 'Security protocols', 'Project management'],
      certifications: [
        { name: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google', free: true, duration: 'Self-paced' },
        { name: 'Microsoft Azure Fundamentals AZ-900', url: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', free: false, duration: '4 weeks' },
        { name: 'AWS Solutions Architect Associate', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'Fintech Product Manager', sector: 'Finance', gap_years: 1.5, median_salary_sar: 269000, open_roles: 3900, vision_priority: 'medium',
      required_skills: ['Product management', 'Financial systems', 'Data analysis', 'Stakeholder management', 'Agile methodology'],
      certifications: [
        { name: 'Coursera Agile with Atlassian Jira', url: 'https://www.coursera.org/learn/agile-atlassian-jira', free: true, duration: '2 weeks' },
        { name: 'Product Management Certificate — Reforge', url: 'https://www.reforge.com', free: false, duration: '6 weeks' },
        { name: 'Certified Fintech Professional', url: 'https://www.fi.edu/cftp', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'Renewable Energy Engineer', sector: 'Energy', gap_years: 2.8, median_salary_sar: 306000, open_roles: 5100, vision_priority: 'high',
      required_skills: ['Engineering principles', 'Energy systems', 'Project management', 'Technical analysis', 'Environmental assessment'],
      certifications: [
        { name: 'IRENA Renewable Energy Learning', url: 'https://www.irena.org/energytransition/Energy-Education-and-Training', free: true, duration: 'Self-paced' },
        { name: 'edX Renewable Energy Technology', url: 'https://www.edx.org/learn/renewable-energy', free: true, duration: '12 weeks' },
      ],
    },
    {
      title: 'Smart Cities Programme Manager', sector: 'Technology', gap_years: 2.0, median_salary_sar: 277000, open_roles: 3200, vision_priority: 'high',
      required_skills: ['Urban planning', 'IoT systems', 'Policy analysis', 'Data analysis', 'Stakeholder communication'],
      certifications: [
        { name: 'Coursera Smart Cities and Urban IoT', url: 'https://www.coursera.org/learn/smart-cities', free: true, duration: '4 weeks' },
        { name: 'MIT Professional Education — Smart Cities', url: 'https://professionalonline2.mit.edu/smart-cities', free: false, duration: '6 weeks' },
      ],
    },
    {
      title: 'Health Informatics Specialist', sector: 'Health', gap_years: 2.0, median_salary_sar: 258000, open_roles: 3400, vision_priority: 'medium',
      required_skills: ['Health data management', 'Database systems', 'Statistical analysis', 'Clinical knowledge', 'Project management'],
      certifications: [
        { name: 'Coursera Health Informatics Specialization', url: 'https://www.coursera.org/specializations/health-informatics', free: false, duration: '5 months' },
        { name: 'AHIMA Health Informatics Certification', url: 'https://www.ahima.org', free: false, duration: '6 months' },
      ],
    },
  ],
  malta: [
    {
      title: 'Blockchain Developer', sector: 'Digital', gap_years: 2.2, median_salary_eur: 62000, open_roles: 1200, vision_priority: 'high',
      required_skills: ['Blockchain development', 'Smart contracts', 'Solidity', 'Web3 protocols', 'Cryptography'],
      certifications: [
        { name: 'CryptoZombies — Solidity', url: 'https://cryptozombies.io', free: true, duration: '2 weeks' },
        { name: 'Alchemy University Web3 Development', url: 'https://university.alchemy.com', free: true, duration: '7 weeks' },
        { name: 'Certified Blockchain Developer', url: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'AI/ML Engineer', sector: 'Digital', gap_years: 2.8, median_salary_eur: 75000, open_roles: 1800, vision_priority: 'high',
      required_skills: ['Machine learning', 'Python', 'Data modelling', 'Deep learning', 'Statistical analysis'],
      certifications: [
        { name: 'fast.ai Practical Deep Learning', url: 'https://course.fast.ai', free: true, duration: '7 weeks' },
        { name: 'DeepLearning.AI Deep Learning Specialization', url: 'https://www.coursera.org/specializations/deep-learning', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'Cybersecurity Consultant', sector: 'Digital', gap_years: 1.6, median_salary_eur: 58000, open_roles: 1400, vision_priority: 'high',
      required_skills: ['Network security', 'Risk assessment', 'Security protocols', 'Compliance', 'Penetration testing'],
      certifications: [
        { name: 'TryHackMe SOC Level 1', url: 'https://tryhackme.com/path/outline/soclevel1', free: true, duration: '4 weeks' },
        { name: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', free: false, duration: '3 months' },
        { name: 'CISA — Certified Information Systems Auditor', url: 'https://www.isaca.org/credentialing/cisa', free: false, duration: '6 months' },
      ],
    },
    {
      title: 'iGaming Product Manager', sector: 'Gaming', gap_years: 1.2, median_salary_eur: 54000, open_roles: 900, vision_priority: 'high',
      required_skills: ['Product management', 'User experience', 'Data analysis', 'Regulatory compliance', 'Agile methodology'],
      certifications: [
        { name: 'Malta Gaming Authority Compliance Course', url: 'https://mga.org.mt', free: false, duration: '1 month' },
        { name: 'Product School PM Certificate', url: 'https://productschool.com', free: false, duration: '8 weeks' },
      ],
    },
    {
      title: 'Fintech Compliance Analyst', sector: 'Finance', gap_years: 1.8, median_salary_eur: 50000, open_roles: 1100, vision_priority: 'high',
      required_skills: ['Financial regulation', 'AML compliance', 'Risk assessment', 'Data analysis', 'Reporting'],
      certifications: [
        { name: 'ACAMS Anti-Money Laundering Certification', url: 'https://www.acams.org', free: false, duration: '3 months' },
        { name: 'Coursera Financial Engineering', url: 'https://www.coursera.org/specializations/financialengineering', free: false, duration: '4 months' },
      ],
    },
    {
      title: 'Climate Data Analyst', sector: 'Green', gap_years: 2.4, median_salary_eur: 48000, open_roles: 600, vision_priority: 'medium',
      required_skills: ['Data analysis', 'Environmental science', 'Statistical modelling', 'GIS systems', 'Report writing'],
      certifications: [
        { name: 'edX Climate Science — MIT', url: 'https://www.edx.org/school/mitx', free: true, duration: '12 weeks' },
        { name: 'ESRI ArcGIS Basics', url: 'https://www.esri.com/training', free: true, duration: '4 weeks' },
      ],
    },
    {
      title: 'Maritime Digital Operations Specialist', sector: 'Maritime', gap_years: 1.0, median_salary_eur: 42000, open_roles: 700, vision_priority: 'medium',
      required_skills: ['Maritime operations', 'Digital systems', 'Logistics management', 'Regulatory compliance', 'Communication'],
      certifications: [
        { name: 'Coursera Supply Chain Management', url: 'https://www.coursera.org/specializations/supply-chain-management', free: false, duration: '3 months' },
        { name: 'Malta Maritime Authority Training', url: 'https://transport.gov.mt/maritime', free: false, duration: '1-2 months' },
      ],
    },
    {
      title: 'Digital Health Product Specialist', sector: 'Health', gap_years: 2.0, median_salary_eur: 52000, open_roles: 800, vision_priority: 'medium',
      required_skills: ['Health data', 'Product management', 'UX design', 'Regulatory compliance', 'Stakeholder management'],
      certifications: [
        { name: 'Google UX Design Certificate', url: 'https://grow.google/certificates/ux-design/', free: false, duration: '6 months' },
        { name: 'Coursera Health Informatics Specialization', url: 'https://www.coursera.org/specializations/health-informatics', free: false, duration: '5 months' },
      ],
    },
  ],
  uk: [
    {
      title: 'AI/ML Engineer', sector: 'AI and Machine Learning', gap_years: 2.5, median_salary_gbp: 75000, open_roles: 12400, vision_priority: 'high',
      required_skills: ['Machine learning', 'Python', 'MLOps', 'Statistical modelling', 'Cloud deployment'],
      certifications: [
        { name: 'fast.ai Practical Deep Learning', url: 'https://course.fast.ai', free: true, duration: '7 weeks' },
        { name: 'Google Professional ML Engineer', url: 'https://cloud.google.com/certification/machine-learning-engineer', free: false, duration: '3-6 months' },
        { name: 'AWS Machine Learning Specialty', url: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'Cybersecurity Engineer', sector: 'Cybersecurity', gap_years: 1.5, median_salary_gbp: 62000, open_roles: 9800, vision_priority: 'high',
      required_skills: ['Network security', 'Threat analysis', 'Penetration testing', 'Security protocols', 'Incident response'],
      certifications: [
        { name: 'TryHackMe SOC Level 1', url: 'https://tryhackme.com', free: true, duration: '4 weeks' },
        { name: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', free: false, duration: '3 months' },
        { name: 'NCSC Certified Cyber Professional', url: 'https://www.ncsc.gov.uk/cyberessentials/overview', free: false, duration: '6 months' },
      ],
    },
    {
      title: 'Cloud Architect', sector: 'Cloud and Infrastructure', gap_years: 3.0, median_salary_gbp: 88000, open_roles: 7200, vision_priority: 'high',
      required_skills: ['Cloud computing', 'System architecture', 'DevOps', 'Security', 'Cost optimisation'],
      certifications: [
        { name: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google', free: true, duration: 'Self-paced' },
        { name: 'AWS Solutions Architect Professional', url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/', free: false, duration: '4 months' },
        { name: 'Microsoft Azure Expert', url: 'https://learn.microsoft.com/en-us/certifications/', free: false, duration: '3 months' },
      ],
    },
    {
      title: 'Data Scientist', sector: 'Data Science and Analytics', gap_years: 2.0, median_salary_gbp: 58000, open_roles: 11600, vision_priority: 'high',
      required_skills: ['Python', 'Statistical analysis', 'Data visualisation', 'Machine learning', 'SQL'],
      certifications: [
        { name: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', free: true, duration: '2 weeks' },
        { name: 'IBM Data Science Professional Certificate', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', free: false, duration: '3 months' },
        { name: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', free: false, duration: '6 months' },
      ],
    },
    {
      title: 'AI Product Manager', sector: 'AI and Machine Learning', gap_years: 1.5, median_salary_gbp: 72000, open_roles: 5400, vision_priority: 'high',
      required_skills: ['Product strategy', 'AI literacy', 'Stakeholder management', 'Data analysis', 'Agile'],
      certifications: [
        { name: 'DeepLearning.AI for Everyone', url: 'https://www.deeplearning.ai/courses/ai-for-everyone/', free: true, duration: '6 hours' },
        { name: 'Product School AI PM Certificate', url: 'https://productschool.com', free: false, duration: '8 weeks' },
        { name: 'Reforge AI Product Management', url: 'https://www.reforge.com', free: false, duration: '6 weeks' },
      ],
    },
    {
      title: 'Health Informatics Analyst', sector: 'Health and Public Sector AI', gap_years: 1.8, median_salary_gbp: 48000, open_roles: 4200, vision_priority: 'medium',
      required_skills: ['Health data', 'SQL', 'Statistical analysis', 'Clinical knowledge', 'NHS data standards'],
      certifications: [
        { name: 'NHS Digital Academy Programme', url: 'https://digital.nhs.uk', free: true, duration: '12 weeks' },
        { name: 'Coursera Health Informatics Specialization', url: 'https://www.coursera.org/specializations/health-informatics', free: false, duration: '5 months' },
      ],
    },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { profile, country } = await req.json()
    const careers = VISION_CAREERS[country] || VISION_CAREERS.saudi

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ matches: [] })
    }

    const allSkills = [
      ...((profile?.explicit_skills as string[]) || []),
      ...((profile?.inferred_skills as string[]) || []),
    ]

    const salaryKeys: Record<string, string> = { saudi: 'median_salary_sar', malta: 'median_salary_eur', uk: 'median_salary_gbp' }
    const currencySymbols: Record<string, string> = { saudi: 'SAR', malta: 'EUR', uk: 'GBP' }
    const salaryKey = salaryKeys[country] || 'median_salary_sar'
    const currencySymbol = currencySymbols[country] || 'SAR'

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const visionLabels: Record<string, string> = {
      saudi: "Saudi Arabia's Vision 2030",
      malta: "Malta's Vision 2050",
      uk: "the UK AI Opportunities Action Plan 2030",
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are a career matching specialist for ${visionLabels[country] || visionLabels.saudi}.

Student profile summary: ${profile?.summary || 'Not provided'}
Education field: ${profile?.education_field || 'Not specified'}
Career stage: ${profile?.career_stage || 'Not specified'}
All skills (explicit + inferred): ${allSkills.join(', ')}
Inferred interests: ${((profile?.inferred_interests as string[]) || []).join(', ')}
Suggested sectors from profile analysis: ${((profile?.suggested_sectors as string[]) || []).join(', ')}
Career trajectory: ${profile?.career_trajectory || 'Not specified'}

Available careers: ${JSON.stringify(careers.map((c) => ({ title: c.title, sector: c.sector, required_skills: c.required_skills, vision_priority: c.vision_priority })))}

For each career, calculate how well this student's profile matches — considering not just explicit skills but their inferred capabilities, their education background, their interests, and their trajectory.

Return the top 6 career matches ranked by fit. For each:
- A match percentage (0-100) based on genuine fit analysis
- A specific "why you fit" paragraph (3-4 sentences) referencing actual things from their profile — not generic statements
- Which specific skills they already have that apply
- The most important skill gaps to close
- How long realistically to close the gap given their current level

Return valid JSON array only:
[
  {
    "title": "AI Engineer",
    "match_percent": 72,
    "why_you_fit": "Your statistics coursework and Python project experience map directly to 3 of the 5 core skills this role requires. Your interest in algorithmic problem-solving, evident from your mathematics background, is exactly the aptitude Vision 2030 AI teams are hiring for.",
    "matching_skills": ["Data analysis", "Python programming", "Statistical thinking"],
    "skills_to_develop": ["Machine learning frameworks", "Cloud deployment"],
    "realistic_gap_months": 18
  }
]`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    let matches: Array<Record<string, unknown>> = []
    try {
      matches = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      matches = []
    }

    // Merge with static data
    matches = matches.map((m) => {
      const staticData = careers.find((c) => c.title === m.title)
      return {
        ...m,
        salary: staticData ? (staticData as unknown as Record<string, unknown>)[salaryKey] : null,
        currency: currencySymbol,
        open_roles: staticData?.open_roles,
        vision_priority: staticData?.vision_priority,
        gap_years: staticData?.gap_years,
        certifications: staticData?.certifications || [],
      }
    })

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('match-careers error:', err)
    return NextResponse.json({ matches: [] })
  }
}
