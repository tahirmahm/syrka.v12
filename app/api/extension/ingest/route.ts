import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, country, data, studentId } = body;

    if (!type || !country || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, country, and data are required.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Handle CORS if needed (for extension origins)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const { data: insertedData, error } = await supabase
      .from('extension_ingests')
      .insert([
        {
          type,
          country,
          data,
          student_id: studentId || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        id: insertedData.id,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Ingest error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
