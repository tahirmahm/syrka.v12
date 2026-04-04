import { NextRequest, NextResponse } from 'next/server'
import { StateGraph, START, END, Annotation } from '@langchain/langgraph'
import { createClient } from '@/lib/supabase'
import { createDeepSeekClient } from '@/lib/deepseek'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WefSkillAlignment {
  aligned: boolean
  global_rank: number | null
  trend: string
}

interface RankingImpact {
  indicator: string
  projected_change: string
}

interface Prescription {
  title: string
  what_to_do: string
  why_closes_gap: string
  gap_closure_percent: number
  cost_estimate: string
  timeline: 'short' | 'medium' | 'long'
  key_risk: string
  esco_skill_codes: string[]
  wef_skill_alignment: WefSkillAlignment
  ranking_impact: RankingImpact | null
  confidence_score: number
  lever:
    | 'curriculum_reform'
    | 'immigration'
    | 'employer_training'
    | 'public_private_partnership'
    | 'regulatory_change'
  status: 'not_simulated'
}

interface EscoSkill {
  uri: string
  label: string
}

// ---------------------------------------------------------------------------
// Country-code mapping
// ---------------------------------------------------------------------------

const COUNTRY_CODE_MAP: Record<string, string> = {
  malta: 'MT',
  saudi: 'SA',
}

// ---------------------------------------------------------------------------
// LangGraph state annotation
// ---------------------------------------------------------------------------

const PrescriptionAnnotation = Annotation.Root({
  country: Annotation<string>,
  sector: Annotation<string>,
  sectorId: Annotation<string>,
  gapWorkers: Annotation<number>,
  targetYear: Annotation<number>,
  currentWorkforce: Annotation<number>,
  targetWorkforce: Annotation<number>,
  gapData: Annotation<Record<string, unknown> | null>,
  escoSkills: Annotation<EscoSkill[]>,
  wefDemandData: Annotation<Record<string, unknown> | null>,
  iloWageData: Annotation<Record<string, unknown> | null>,
  worldBankData: Annotation<Record<string, unknown> | null>,
  prescriptions: Annotation<Prescription[]>,
  validatedPrescriptions: Annotation<Prescription[]>,
  finalPrescriptions: Annotation<Prescription[]>,
})

type PrescriptionState = typeof PrescriptionAnnotation.State

// ---------------------------------------------------------------------------
// Node 1 – Pull gap data from Supabase skills table
// ---------------------------------------------------------------------------

async function pullGapData(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('sector_id', state.sectorId)
    .order('gap_score', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[prescriptions] pullGapData error:', error.message)
    return { gapData: null }
  }

  return {
    gapData: {
      criticalSkills: data ?? [],
      count: data?.length ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Node 2 – Query ESCO API for skill URIs
// ---------------------------------------------------------------------------

async function queryEsco(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const skills =
    (
      state.gapData as {
        criticalSkills: Array<{ name: string }>
      } | null
    )?.criticalSkills ?? []

  const collected: EscoSkill[] = []

  for (const skill of skills) {
    try {
      const url = `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(
        skill.name
      )}&type=skill&language=en&limit=3`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

      if (!res.ok) continue

      const json = (await res.json()) as {
        _embedded?: {
          results?: Array<{ uri?: string; title?: string }>
        }
      }
      const results = json._embedded?.results ?? []

      for (const r of results) {
        if (r.uri && r.title) {
          collected.push({ uri: r.uri, label: r.title })
        }
      }
    } catch {
      // ESCO API failure is non-fatal
      console.warn(`[prescriptions] ESCO lookup failed for "${skill.name}"`)
    }
  }

  return { escoSkills: collected }
}

// ---------------------------------------------------------------------------
// Node 3 – Cross-reference WEF data
// ---------------------------------------------------------------------------

async function crossRefWef(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const supabase = createClient()
  const countryCode = COUNTRY_CODE_MAP[state.country] ?? state.country.toUpperCase()

  const { data, error } = await supabase
    .from('international_stats')
    .select('*')
    .eq('source', 'wef')
    .eq('country_code', countryCode)

  if (error) {
    console.error('[prescriptions] crossRefWef error:', error.message)
    return { wefDemandData: null }
  }

  return { wefDemandData: { records: data ?? [], count: data?.length ?? 0 } }
}

// ---------------------------------------------------------------------------
// Node 4 – Pull ILO wage/employment data
// ---------------------------------------------------------------------------

async function pullIloData(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const supabase = createClient()
  const countryCode = COUNTRY_CODE_MAP[state.country] ?? state.country.toUpperCase()

  const { data, error } = await supabase
    .from('international_stats')
    .select('*')
    .eq('source', 'ilo')
    .eq('country_code', countryCode)

  if (error) {
    console.error('[prescriptions] pullIloData error:', error.message)
    return { iloWageData: null }
  }

  return { iloWageData: { records: data ?? [], count: data?.length ?? 0 } }
}

// ---------------------------------------------------------------------------
// Node 5 – Pull World Bank HCI data
// ---------------------------------------------------------------------------

async function pullWorldBank(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const supabase = createClient()
  const countryCode = COUNTRY_CODE_MAP[state.country] ?? state.country.toUpperCase()

  const { data, error } = await supabase
    .from('international_stats')
    .select('*')
    .eq('source', 'worldbank')
    .eq('country_code', countryCode)

  if (error) {
    console.error('[prescriptions] pullWorldBank error:', error.message)
    return { worldBankData: null }
  }

  return { worldBankData: { records: data ?? [], count: data?.length ?? 0 } }
}

// ---------------------------------------------------------------------------
// Node 6 – Generate prescriptions via DeepSeek
// ---------------------------------------------------------------------------

async function generatePrescriptions(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const client = createDeepSeekClient()

  // Fetch uploaded document context from ChromaDB
  let documentContext = ''
  try {
    const chromaRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/chroma/search?query=${encodeURIComponent(state.sector)}&country=${state.country}`,
      { signal: AbortSignal.timeout(5000) }
    )
    const chromaData = await chromaRes.json()
    const passages = chromaData.results?.slice(0, 3)?.map((r: { text: string }) => r.text) ?? []
    if (passages.length > 0) {
      documentContext = `\n\nAdditional context from ministry's own documents:\n${passages.join('\n\n')}`
    }
  } catch {
    // ChromaDB not available — continue without document context
  }

  const systemPrompt = `You are a national human capital policy advisor with access to OECD, ILO, World Bank, and WEF data. Generate 5 genuinely different policy prescriptions to close ${state.country}'s ${state.sector} workforce gap of ${state.gapWorkers} workers by ${state.targetYear}. Each prescription must address a different lever: (1) curriculum reform, (2) immigration, (3) employer-led training, (4) public-private partnership, (5) regulatory change. Return valid JSON array only. No preamble.${documentContext}`

  const userMessage = `Current workforce: ${state.currentWorkforce}
Target workforce: ${state.targetWorkforce}
Gap: ${state.gapWorkers} workers

Top skills gap data:
${JSON.stringify(state.gapData, null, 2)}

ESCO skills found:
${JSON.stringify(state.escoSkills, null, 2)}

WEF demand data:
${JSON.stringify(state.wefDemandData, null, 2)}

ILO wage/employment data:
${JSON.stringify(state.iloWageData, null, 2)}

World Bank HCI data:
${JSON.stringify(state.worldBankData, null, 2)}

Return a JSON array of 5 prescription objects. Each must have:
- title (string)
- what_to_do (string)
- why_closes_gap (string)
- gap_closure_percent (number, the 5 should sum to roughly 100)
- cost_estimate (string)
- timeline ("short" | "medium" | "long")
- key_risk (string)
- esco_skill_codes (string[] - use URIs from the ESCO data above if available)
- wef_skill_alignment ({ aligned: boolean, global_rank: number | null, trend: string })
- ranking_impact (null for now)
- confidence_score (number 0-1)
- lever (one of: "curriculum_reform", "immigration", "employer_training", "public_private_partnership", "regulatory_change")
- status ("not_simulated")`

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
  })

  const raw = response.choices[0]?.message?.content ?? '[]'

  let prescriptions: Prescription[]
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    prescriptions = JSON.parse(cleaned) as Prescription[]
  } catch {
    console.error('[prescriptions] Failed to parse DeepSeek response')
    prescriptions = []
  }

  return { prescriptions }
}

// ---------------------------------------------------------------------------
// Node 7 – Validate ESCO skill codes
// ---------------------------------------------------------------------------

async function validateEsco(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const knownUris = new Set(state.escoSkills.map((s) => s.uri))

  const dataSourcesPresent = [
    state.gapData !== null,
    state.escoSkills.length > 0,
    state.wefDemandData !== null,
    state.iloWageData !== null,
    state.worldBankData !== null,
  ]
  const dataCompleteness =
    dataSourcesPresent.filter(Boolean).length / dataSourcesPresent.length

  const validated = state.prescriptions.map((p) => {
    const verifiedCodes = p.esco_skill_codes.filter((code) => knownUris.has(code))
    return {
      ...p,
      esco_skill_codes: verifiedCodes,
      confidence_score: Math.round(dataCompleteness * 100) / 100,
    }
  })

  return { validatedPrescriptions: validated }
}

// ---------------------------------------------------------------------------
// Node 8 – Generate ranking impact via DeepSeek
// ---------------------------------------------------------------------------

async function generateRankingImpact(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const client = createDeepSeekClient()

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          'You are a university ranking analyst. For each policy prescription, project which QS/THE ranking indicator would be most affected and by how much. Return a JSON array of objects with "indicator" and "projected_change" fields. Example: {"indicator": "ISR", "projected_change": "+5.2 points"}. Return valid JSON array only. No preamble.',
      },
      {
        role: 'user',
        content: `Country: ${state.country}, Sector: ${state.sector}
Prescriptions:
${JSON.stringify(
  state.validatedPrescriptions.map((p) => ({
    title: p.title,
    lever: p.lever,
    gap_closure_percent: p.gap_closure_percent,
  })),
  null,
  2
)}

Return a JSON array with exactly ${state.validatedPrescriptions.length} objects, one per prescription.`,
      },
    ],
    temperature: 0.7,
  })

  const raw = response.choices[0]?.message?.content ?? '[]'

  let impacts: RankingImpact[]
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    impacts = JSON.parse(cleaned) as RankingImpact[]
  } catch {
    console.error('[prescriptions] Failed to parse ranking impact response')
    impacts = []
  }

  const updated = state.validatedPrescriptions.map((p, i) => ({
    ...p,
    ranking_impact: impacts[i] ?? null,
  }))

  return { validatedPrescriptions: updated }
}

// ---------------------------------------------------------------------------
// Node 9 – Final confidence scoring
// ---------------------------------------------------------------------------

async function scoreConfidence(
  state: PrescriptionState
): Promise<Partial<PrescriptionState>> {
  const dataSourcesPresent = [
    state.gapData !== null,
    state.escoSkills.length > 0,
    state.wefDemandData !== null,
    state.iloWageData !== null,
    state.worldBankData !== null,
  ]
  const dataCompleteness =
    dataSourcesPresent.filter(Boolean).length / dataSourcesPresent.length

  const knownUris = new Set(state.escoSkills.map((s) => s.uri))

  const finalPrescriptions = state.validatedPrescriptions.map((p) => {
    const totalCodes = p.esco_skill_codes.length
    const validCodes = p.esco_skill_codes.filter((c) => knownUris.has(c)).length
    const escoPassRate = totalCodes > 0 ? validCodes / totalCodes : 0.5

    const hasRankingImpact = p.ranking_impact !== null ? 1 : 0.8

    const score =
      dataCompleteness * 0.5 + escoPassRate * 0.3 + hasRankingImpact * 0.2

    return {
      ...p,
      confidence_score: Math.round(score * 100) / 100,
    }
  })

  return { finalPrescriptions }
}

// ---------------------------------------------------------------------------
// Build the LangGraph workflow
// ---------------------------------------------------------------------------

function buildGraph() {
  const graph = new StateGraph(PrescriptionAnnotation)
    .addNode('pullGapData', pullGapData)
    .addNode('queryEsco', queryEsco)
    .addNode('crossRefWef', crossRefWef)
    .addNode('pullIloData', pullIloData)
    .addNode('pullWorldBank', pullWorldBank)
    .addNode('generatePrescriptions', generatePrescriptions)
    .addNode('validateEsco', validateEsco)
    .addNode('generateRankingImpact', generateRankingImpact)
    .addNode('scoreConfidence', scoreConfidence)
    .addEdge(START, 'pullGapData')
    .addEdge('pullGapData', 'queryEsco')
    .addEdge('queryEsco', 'crossRefWef')
    .addEdge('crossRefWef', 'pullIloData')
    .addEdge('pullIloData', 'pullWorldBank')
    .addEdge('pullWorldBank', 'generatePrescriptions')
    .addEdge('generatePrescriptions', 'validateEsco')
    .addEdge('validateEsco', 'generateRankingImpact')
    .addEdge('generateRankingImpact', 'scoreConfidence')
    .addEdge('scoreConfidence', END)

  return graph.compile()
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      country?: string
      sector?: string
      sector_id?: string
      gap_workers?: number
      target_year?: number
      current_workforce?: number
      target_workforce?: number
    }

    const {
      country,
      sector,
      sector_id,
      gap_workers,
      target_year,
      current_workforce,
      target_workforce,
    } = body

    if (
      !country ||
      !sector ||
      !sector_id ||
      gap_workers == null ||
      target_year == null ||
      current_workforce == null ||
      target_workforce == null
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: country, sector, sector_id, gap_workers, target_year, current_workforce, target_workforce',
        },
        { status: 400 }
      )
    }

    console.log(
      `[prescriptions] Starting generation for ${country}/${sector} — gap: ${gap_workers}`
    )

    const app = buildGraph()

    const initialState: PrescriptionState = {
      country,
      sector,
      sectorId: sector_id,
      gapWorkers: gap_workers,
      targetYear: target_year,
      currentWorkforce: current_workforce,
      targetWorkforce: target_workforce,
      gapData: null,
      escoSkills: [],
      wefDemandData: null,
      iloWageData: null,
      worldBankData: null,
      prescriptions: [],
      validatedPrescriptions: [],
      finalPrescriptions: [],
    }

    const result = await app.invoke(initialState)
    const finalPrescriptions: Prescription[] = result.finalPrescriptions

    // Persist to Supabase
    const supabase = createClient()

    if (finalPrescriptions.length > 0) {
      const rows = finalPrescriptions.map((p) => ({
        sector_id,
        country,
        title: p.title,
        what_to_do: p.what_to_do,
        why_closes_gap: p.why_closes_gap,
        gap_closure_percent: p.gap_closure_percent,
        cost_estimate: p.cost_estimate,
        timeline: p.timeline,
        key_risk: p.key_risk,
        esco_skill_codes: p.esco_skill_codes,
        wef_skill_alignment: p.wef_skill_alignment,
        ranking_impact: p.ranking_impact,
        confidence_score: p.confidence_score,
        lever: p.lever,
        status: p.status,
      }))

      const { error: insertError } = await supabase
        .from('prescriptions')
        .insert(rows)

      if (insertError) {
        console.error(
          '[prescriptions] Failed to save to Supabase:',
          insertError.message
        )
      }
    }

    console.log(
      `[prescriptions] Done — ${finalPrescriptions.length} prescriptions generated`
    )

    return NextResponse.json({ prescriptions: finalPrescriptions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[prescriptions] Error:', message)
    return NextResponse.json(
      { error: `Prescription generation failed: ${message}` },
      { status: 500 }
    )
  }
}
