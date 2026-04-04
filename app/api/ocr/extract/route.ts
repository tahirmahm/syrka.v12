import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const country = formData.get('country') as string | null

    if (!file || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: file, country' },
        { status: 400 }
      )
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = file.type

    // Send to DeepSeek for content extraction
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: 'text',
                text: `Extract all structured information from this government document. Return valid JSON only with these fields: { "vision_targets": [], "workforce_numbers": [], "sector_priorities": [], "institutional_names": [], "timelines": [], "key_metrics": [], "raw_text": "" }. No preamble.`,
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'

    let extracted: Record<string, unknown>
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extracted = JSON.parse(cleaned)
    } catch {
      extracted = { raw_text: content }
    }

    // Store in Supabase
    const supabase = createClient()
    const { data: doc, error: insertError } = await supabase
      .from('uploaded_documents')
      .insert({
        country,
        filename: file.name,
        extracted_text: (extracted as Record<string, string>).raw_text ?? '',
        structured_data: extracted,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[ocr/extract] Insert error:', insertError.message)
      return NextResponse.json(
        { error: `Failed to save document: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Optionally embed in ChromaDB via MiroFish
    if (process.env.MIROFISH_URL && doc) {
      fetch(`${process.env.MIROFISH_URL}/api/chroma/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: country,
          document_id: doc.id,
          text: (extracted as Record<string, string>).raw_text ?? '',
          metadata: { filename: file.name, country },
        }),
      }).catch(() => {
        // ChromaDB embed failure is non-fatal
      })
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Extract failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
