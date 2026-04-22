import { NextRequest, NextResponse } from 'next/server';
import { createDeepSeekClient } from '@/lib/deepseek';

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
    const { courseName, modules } = await request.json();

    if (!courseName) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    const deepseek = createDeepSeekClient();

    const prompt = `
      You are an AI Curriculum Architect for an AI-Native University (a16z vision).
      Course Name: ${courseName}
      Current Modules: ${modules.join(', ')}

      Task: Evolve this course into an AI-native version.
      Provide:
      1. "Live Reading List": 3 emerging research topics or tools related to this course that didn't exist 6 months ago.
      2. "AI-Orchestration Assignment": One assignment that grades students on how they use AI to solve a complex problem, not just the output.
      3. "Adaptive Path": How this course should shift in real-time based on student progress.

      Respond in JSON format:
      {
        "readingList": ["topic1", "topic2", "topic3"],
        "assignment": "description",
        "adaptivePath": "description"
      }
    `;

    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const evolution = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(
      { success: true, evolution },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Evolution error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
