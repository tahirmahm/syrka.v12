import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const AI_ADJACENT_SKILLS = [
  'python', 'data analysis', 'machine learning', 'ai', 'automation',
  'data science', 'deep learning', 'statistical analysis', 'nlp',
  'prompt engineering', 'tensorflow', 'pytorch', 'neural networks',
  'computer vision', 'natural language processing', 'data modelling',
  'algorithm design', 'cloud computing', 'devops', 'mlops',
]

const SKILL_DOMAINS: Record<string, string[]> = {
  technical: ['python', 'javascript', 'java', 'sql', 'cloud', 'devops', 'docker', 'kubernetes', 'aws', 'azure'],
  data: ['data analysis', 'statistical analysis', 'machine learning', 'data science', 'data modelling', 'tableau', 'power bi'],
  business: ['project management', 'stakeholder management', 'strategy', 'consulting', 'operations', 'finance', 'marketing'],
  creative: ['design', 'ux', 'figma', 'communication', 'writing', 'presentation'],
  research: ['research', 'policy', 'economics', 'analysis', 'critical thinking'],
}

function getLevel(score: number): string {
  if (score >= 81) return 'Orchestrator'
  if (score >= 61) return 'Proficient'
  if (score >= 41) return 'Capable'
  if (score >= 21) return 'Developing'
  return 'Emerging'
}

function getNextMilestone(score: number): string {
  if (score >= 81) return 'You are at the highest level. Mentor others and push boundaries.'
  if (score >= 61) return `${81 - score} points to Orchestrator — add cross-domain AI projects.`
  if (score >= 41) return `${61 - score} points to Proficient — deepen AI tool integration.`
  if (score >= 21) return `${41 - score} points to Capable — start an AI-adjacent certification.`
  return `${21 - score} points to Developing — learn Python or a data analysis tool.`
}

export async function POST(req: NextRequest) {
  try {
    const { skills, aiAssessmentScore } = await req.json()

    const startTime = Date.now()
    const studentSkills = (skills || []) as string[]
    const lowerSkills = studentSkills.map((s: string) => s.toLowerCase())

    // 1. AI-adjacent skills (30%)
    const aiSkillCount = lowerSkills.filter(s =>
      AI_ADJACENT_SKILLS.some(ai => s.includes(ai))
    ).length
    const aiSkillScore = Math.min(100, Math.round((aiSkillCount / 5) * 100))

    // 2. Cross-domain breadth (25%)
    const domainsCovered = new Set<string>()
    for (const skill of lowerSkills) {
      for (const [domain, keywords] of Object.entries(SKILL_DOMAINS)) {
        if (keywords.some(k => skill.includes(k))) {
          domainsCovered.add(domain)
        }
      }
    }
    const breadthScore = Math.min(100, Math.round((domainsCovered.size / 3) * 100))

    // 3. AI assessment score (30%)
    const assessmentScore = typeof aiAssessmentScore === 'number' ? aiAssessmentScore : 0

    // 4. Vision-aligned role match (15%)
    const VISION_ROLES = ['ai', 'data', 'cloud', 'cyber', 'digital', 'automation', 'machine learning']
    const hasVisionAlignment = lowerSkills.some(s =>
      VISION_ROLES.some(v => s.includes(v))
    )
    const visionScore = hasVisionAlignment ? 80 : 30

    const weightedScore = Math.round(
      (aiSkillScore * 0.30) +
      (breadthScore * 0.25) +
      (assessmentScore * 0.30) +
      (visionScore * 0.15)
    )

    const finalScore = Math.min(100, Math.max(0, weightedScore))

    logAudit({
      endpoint: '/api/students/orchestration-score',
      request_payload: { skillCount: studentSkills.length },
      response_payload: { score: finalScore, level: getLevel(finalScore) },
      model_used: 'local-calculation', latency_ms: Date.now() - startTime,
      track: 'student',
    })

    return NextResponse.json({
      score: finalScore,
      breakdown: {
        ai_adjacent_skills: { score: aiSkillScore, weight: 30, detail: `${aiSkillCount} AI-adjacent skills detected` },
        cross_domain_breadth: { score: breadthScore, weight: 25, detail: `${domainsCovered.size} domains covered` },
        ai_assessment: { score: assessmentScore, weight: 30, detail: assessmentScore > 0 ? 'From AI usage assessment' : 'Complete an AI assessment to boost this' },
        vision_alignment: { score: visionScore, weight: 15, detail: hasVisionAlignment ? 'Aligned with vision priorities' : 'Add AI/data skills for alignment' },
      },
      level: getLevel(finalScore),
      nextMilestone: getNextMilestone(finalScore),
    })
  } catch (err) {
    console.error('orchestration-score error:', err)
    return NextResponse.json({ score: 0, breakdown: {}, level: 'Emerging', nextMilestone: '' })
  }
}
