import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const countryName = decodeURIComponent(name)

    const query = `
      SELECT DISTINCT ?uni ?uniLabel ?students WHERE {
        ?uni wdt:P31 wd:Q3918.
        ?uni wdt:P17 ?country.
        ?country rdfs:label "${countryName}"@en.
        OPTIONAL { ?uni wdt:P2196 ?students. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      ORDER BY DESC(?students)
      LIMIT 8
    `

    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'Syrka/1.0 (https://syrka.co)' },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ institutions: [] })
    }

    const data = await res.json()
    const institutions = (data.results?.bindings || [])
      .map((b: Record<string, { value: string }>) => ({
        name: b.uniLabel?.value,
        students: parseInt(b.students?.value) || null,
        wikidata_id: b.uni?.value?.split('/').pop(),
      }))
      .filter((u: { name: string }) => u.name && !u.name.startsWith('Q'))

    return NextResponse.json({ institutions })
  } catch (err) {
    console.error('Wikidata search error:', err)
    return NextResponse.json({ institutions: [] })
  }
}
