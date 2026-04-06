import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const VISION_CAREERS: Record<string, Array<{
  title: string; sector: string; gap_years: number;
  median_salary_usd: number; open_roles: number;
  vision_priority: string; required_skills: string[];
  free_resource?: string;
}>> = {
  saudi: [
    { title: 'AI Engineer', sector: 'Technology', gap_years: 2.5, median_salary_usd: 95000, open_roles: 8400, vision_priority: 'high', required_skills: ['Machine learning', 'Python programming', 'Data modelling', 'Algorithm design', 'Statistical analysis'], free_resource: 'Google AI Essentials on Coursera (free)' },
    { title: 'Cybersecurity Analyst', sector: 'Technology', gap_years: 1.8, median_salary_usd: 78000, open_roles: 6200, vision_priority: 'high', required_skills: ['Network security', 'Threat analysis', 'Risk assessment', 'Security protocols', 'Incident response'], free_resource: 'CompTIA Security+ study guide (free trial)' },
    { title: 'Data Scientist', sector: 'Technology', gap_years: 2.1, median_salary_usd: 88000, open_roles: 7100, vision_priority: 'high', required_skills: ['Data analysis', 'Statistical modelling', 'Python programming', 'Data visualisation', 'Machine learning'], free_resource: 'IBM Data Science Professional Certificate on Coursera (free audit)' },
    { title: 'Cloud Architect', sector: 'Technology', gap_years: 3.2, median_salary_usd: 110000, open_roles: 4800, vision_priority: 'high', required_skills: ['Cloud computing', 'System architecture', 'Network infrastructure', 'Security protocols', 'Project management'], free_resource: 'AWS Cloud Practitioner Essentials (free)' },
    { title: 'Fintech Developer', sector: 'Finance', gap_years: 1.5, median_salary_usd: 72000, open_roles: 3900, vision_priority: 'medium', required_skills: ['Software development', 'Financial systems', 'API integration', 'Data security', 'Agile methodology'], free_resource: 'freeCodeCamp Full Stack Development (free)' },
    { title: 'Renewable Energy Engineer', sector: 'Energy', gap_years: 2.8, median_salary_usd: 82000, open_roles: 5100, vision_priority: 'high', required_skills: ['Engineering principles', 'Energy systems', 'Project management', 'Technical analysis', 'Environmental assessment'], free_resource: 'MIT OpenCourseWare: Introduction to Sustainable Energy (free)' },
    { title: 'Smart Cities Analyst', sector: 'Technology', gap_years: 2.0, median_salary_usd: 74000, open_roles: 3200, vision_priority: 'high', required_skills: ['Data analysis', 'Urban planning', 'IoT systems', 'Policy analysis', 'Stakeholder communication'], free_resource: 'Smart Cities MOOC on edX (free audit)' },
    { title: 'Health Informatics Specialist', sector: 'Health', gap_years: 2.0, median_salary_usd: 69000, open_roles: 3400, vision_priority: 'medium', required_skills: ['Health data management', 'Database systems', 'Statistical analysis', 'Clinical knowledge', 'Project management'], free_resource: 'Johns Hopkins Health Informatics on Coursera (free audit)' },
  ],
  malta: [
    { title: 'Blockchain Developer', sector: 'Digital', gap_years: 2.2, median_salary_usd: 72000, open_roles: 1200, vision_priority: 'high', required_skills: ['Blockchain development', 'Smart contracts', 'Cryptography', 'Software development', 'Web3 protocols'], free_resource: 'Ethereum.org Developer Tutorials (free)' },
    { title: 'AI/ML Engineer', sector: 'Digital', gap_years: 2.8, median_salary_usd: 85000, open_roles: 1800, vision_priority: 'high', required_skills: ['Machine learning', 'Python programming', 'Data modelling', 'Deep learning', 'Statistical analysis'], free_resource: 'fast.ai Practical Deep Learning (free)' },
    { title: 'Cybersecurity Consultant', sector: 'Digital', gap_years: 1.6, median_salary_usd: 68000, open_roles: 1400, vision_priority: 'high', required_skills: ['Network security', 'Risk assessment', 'Security protocols', 'Compliance', 'Threat analysis'], free_resource: 'Cisco Networking Academy Cybersecurity Essentials (free)' },
    { title: 'iGaming Product Manager', sector: 'Gaming', gap_years: 1.2, median_salary_usd: 62000, open_roles: 900, vision_priority: 'high', required_skills: ['Product management', 'User experience', 'Data analysis', 'Stakeholder management', 'Regulatory compliance'], free_resource: 'Google Project Management Certificate on Coursera (free audit)' },
    { title: 'Fintech Analyst', sector: 'Finance', gap_years: 1.8, median_salary_usd: 58000, open_roles: 1100, vision_priority: 'high', required_skills: ['Financial analysis', 'Data analysis', 'Regulatory compliance', 'Risk assessment', 'Software tools'], free_resource: 'Khan Academy Finance and Capital Markets (free)' },
    { title: 'Climate Data Analyst', sector: 'Green', gap_years: 2.4, median_salary_usd: 55000, open_roles: 600, vision_priority: 'medium', required_skills: ['Data analysis', 'Environmental science', 'Statistical modelling', 'Report writing', 'GIS systems'], free_resource: 'QGIS Tutorials and Tips (free)' },
    { title: 'Maritime Logistics Coordinator', sector: 'Maritime', gap_years: 1.0, median_salary_usd: 45000, open_roles: 700, vision_priority: 'medium', required_skills: ['Logistics management', 'Supply chain', 'Communication', 'Problem solving', 'Regulatory knowledge'], free_resource: 'MIT OpenCourseWare: Supply Chain Fundamentals (free)' },
    { title: 'Digital Marketing Strategist', sector: 'Digital', gap_years: 0.6, median_salary_usd: 42000, open_roles: 800, vision_priority: 'medium', required_skills: ['Marketing strategy', 'Data analysis', 'Content creation', 'SEO', 'Campaign management'], free_resource: 'Google Digital Marketing Certificate (free)' },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { skills, country, interests } = await req.json()
    const careers = VISION_CAREERS[country] || VISION_CAREERS.saudi

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ matches: [] })
    }

    const skillLabels = (skills || []).map((s: { skill: string }) => s.skill.toLowerCase())

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `Match these extracted student skills to Vision-aligned careers.

Student skills: ${skillLabels.join(', ')}
Student interests: ${(interests || []).join(', ')}
Country: ${country}

For each career below, calculate a match percentage based on how many required skills overlap with the student skills. Write a specific 2-sentence "why you might fit" that references the student's actual skills. Return the top 5 matches ranked by match percentage.

Careers: ${JSON.stringify(careers.map(c => ({ title: c.title, required_skills: c.required_skills })))}

Return valid JSON array only:
[
  {
    "title": "AI Engineer",
    "match_percent": 78,
    "why_you_fit": "Your data analysis background maps directly to 3 of the 5 core skills this role requires. Your interest in AI and Machine Learning aligns with the top priority sector.",
    "matching_skills": ["Data analysis", "Python programming"],
    "skills_to_develop": ["Machine learning", "Algorithm design"]
  }
]`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    let matches: Array<Record<string, unknown>> = []
    try {
      matches = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      matches = []
    }

    // Merge with static career data
    matches = matches.map((m) => {
      const career = careers.find((c) => c.title === m.title)
      return { ...m, ...(career || {}) }
    })

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('match-careers error:', err)
    return NextResponse.json({ matches: [] })
  }
}
