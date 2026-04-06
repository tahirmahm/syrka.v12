import { NextRequest, NextResponse } from 'next/server'

const VISION_CAREERS: Record<string, Array<{
  title: string
  sector: string
  vision_priority: 'high' | 'medium'
  gap_years: number
  median_salary_usd: number
  open_roles: number
}>> = {
  saudi: [
    { title: 'AI Engineer', sector: 'Technology', vision_priority: 'high', gap_years: 3, median_salary_usd: 78000, open_roles: 4200 },
    { title: 'Cybersecurity Analyst', sector: 'Technology', vision_priority: 'high', gap_years: 2, median_salary_usd: 65000, open_roles: 3800 },
    { title: 'Data Scientist', sector: 'Technology', vision_priority: 'high', gap_years: 3, median_salary_usd: 72000, open_roles: 5100 },
    { title: 'Cloud Architect', sector: 'Technology', vision_priority: 'high', gap_years: 4, median_salary_usd: 85000, open_roles: 2600 },
    { title: 'Fintech Developer', sector: 'Finance', vision_priority: 'medium', gap_years: 3, median_salary_usd: 68000, open_roles: 1900 },
    { title: 'Renewable Energy Engineer', sector: 'Energy', vision_priority: 'high', gap_years: 5, median_salary_usd: 75000, open_roles: 3200 },
    { title: 'Tourism Experience Designer', sector: 'Tourism', vision_priority: 'medium', gap_years: 2, median_salary_usd: 45000, open_roles: 1400 },
    { title: 'Health Informatics Specialist', sector: 'Health', vision_priority: 'medium', gap_years: 4, median_salary_usd: 62000, open_roles: 2100 },
  ],
  malta: [
    { title: 'Blockchain Developer', sector: 'Digital', vision_priority: 'high', gap_years: 3, median_salary_usd: 62000, open_roles: 340 },
    { title: 'AI/ML Engineer', sector: 'Digital', vision_priority: 'high', gap_years: 4, median_salary_usd: 58000, open_roles: 280 },
    { title: 'Digital Marketing Strategist', sector: 'Digital', vision_priority: 'medium', gap_years: 2, median_salary_usd: 42000, open_roles: 520 },
    { title: 'Cybersecurity Consultant', sector: 'Digital', vision_priority: 'high', gap_years: 3, median_salary_usd: 55000, open_roles: 190 },
    { title: 'iGaming Product Manager', sector: 'Gaming', vision_priority: 'high', gap_years: 2, median_salary_usd: 65000, open_roles: 680 },
    { title: 'Financial Technology Analyst', sector: 'Finance', vision_priority: 'high', gap_years: 3, median_salary_usd: 52000, open_roles: 310 },
    { title: 'Climate Data Analyst', sector: 'Green', vision_priority: 'medium', gap_years: 4, median_salary_usd: 48000, open_roles: 120 },
    { title: 'Maritime Logistics Coordinator', sector: 'Maritime', vision_priority: 'medium', gap_years: 2, median_salary_usd: 44000, open_roles: 250 },
  ],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params
  const careers = VISION_CAREERS[country.toLowerCase()] ?? VISION_CAREERS.saudi

  return NextResponse.json({ careers })
}
