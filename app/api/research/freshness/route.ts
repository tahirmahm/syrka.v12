import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: programmes } = await supabase
      .from('programmes')
      .select('id, courses(id, name, skills(name))')

    const { data: cache } = await supabase
      .from('research_feed_cache')
      .select('module_code, field_velocity, last_updated')

    if (!programmes || !cache) {
      return NextResponse.json({ scores: {} })
    }

    const velocityByModule = new Map<string, number>()
    const recencyByModule = new Map<string, number>()
    const now = Date.now()

    for (const row of cache) {
      velocityByModule.set(row.module_code, row.field_velocity ?? 0)
      const updated = new Date(row.last_updated).getTime()
      const daysSinceUpdate = (now - updated) / (1000 * 60 * 60 * 24)
      recencyByModule.set(row.module_code, daysSinceUpdate)
    }

    const scores: Record<string, number> = {}

    for (const prog of programmes) {
      const courses = (prog.courses as { id: string; name: string }[]) ?? []
      if (courses.length === 0) {
        scores[prog.id] = 50
        continue
      }

      let totalVelocity = 0
      let totalRecency = 0
      let matched = 0

      for (const course of courses) {
        velocityByModule.forEach((velocity, code) => {
          if (course.name.toLowerCase().includes(code.toLowerCase())) {
            totalVelocity += velocity
            totalRecency += recencyByModule.get(code) ?? 30
            matched++
          }
        })
      }

      if (matched === 0) {
        scores[prog.id] = 50
        continue
      }

      const avgVelocity = totalVelocity / matched
      const avgRecency = totalRecency / matched
      const velocityScore = Math.min(50, avgVelocity * 5)
      const recencyScore = Math.max(0, 50 - avgRecency)
      scores[prog.id] = Math.round(velocityScore + recencyScore)
    }

    return NextResponse.json({ scores })
  } catch {
    return NextResponse.json({ scores: {} })
  }
}
