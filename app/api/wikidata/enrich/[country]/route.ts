import { NextRequest, NextResponse } from 'next/server'

const COUNTRY_QID: Record<string, string> = {
  MT: 'Q233',
  SA: 'Q851',
  CY: 'Q229',
  EE: 'Q191',
  SI: 'Q215',
  LU: 'Q32',
  AE: 'Q878',
  QA: 'Q846',
  BH: 'Q398',
  KW: 'Q817',
}

function buildSparqlQuery(qid: string): string {
  return `
SELECT ?population ?area ?gdp ?hdi ?gini ?capital ?capitalLabel WHERE {
  wd:${qid} wdt:P1082 ?population .
  OPTIONAL { wd:${qid} wdt:P2046 ?area }
  OPTIONAL { wd:${qid} wdt:P4010 ?gdp }
  OPTIONAL { wd:${qid} wdt:P1081 ?hdi }
  OPTIONAL { wd:${qid} wdt:P1125 ?gini }
  OPTIONAL { wd:${qid} wdt:P36 ?capital }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 1`.trim()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params
    const code = country.toUpperCase()
    const qid = COUNTRY_QID[code]

    if (!qid) {
      return NextResponse.json(
        { error: `Unknown country code: ${code}`, supported: Object.keys(COUNTRY_QID) },
        { status: 400 }
      )
    }

    const sparql = buildSparqlQuery(qid)
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}`

    const res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Wikidata SPARQL error: HTTP ${res.status}` },
        { status: 502 }
      )
    }

    const json = await res.json()
    const bindings = json?.results?.bindings ?? []

    if (bindings.length === 0) {
      return NextResponse.json(
        { error: `No Wikidata results for ${code}` },
        { status: 404 }
      )
    }

    const row = bindings[0]

    const enrichment = {
      country_code: code,
      wikidata_id: qid,
      population: row.population?.value ? Number(row.population.value) : null,
      area_km2: row.area?.value ? Number(row.area.value) : null,
      gdp_nominal: row.gdp?.value ? Number(row.gdp.value) : null,
      hdi: row.hdi?.value ? Number(row.hdi.value) : null,
      gini: row.gini?.value ? Number(row.gini.value) : null,
      capital: row.capitalLabel?.value ?? null,
      source: 'wikidata',
      fetched_at: new Date().toISOString(),
    }

    return NextResponse.json(enrichment)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
