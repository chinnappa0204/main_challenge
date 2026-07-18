import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

interface EnhanceRequest {
  rawLetter: string;
  habitType: string;
  desiredOutcome: string;
}

interface EnhanceResponse {
  enhanced: string;
}

export async function POST(request: Request) {
  try {
    const body: EnhanceRequest = await request.json();
    const { rawLetter, habitType, desiredOutcome } = body;

    if (!rawLetter?.trim()) {
      return NextResponse.json({ error: 'Letter content is required' }, { status: 400 });
    }

    const systemInstruction = `You are a compassionate life coach.
A user has written a personal letter to their future self about breaking a harmful habit.
Gently polish the letter so it is warm, empowering, and deeply personal — keeping the exact meaning and all original details intact.
Do not add generic advice. Do not remove anything personal. Just make the language flow naturally and feel emotionally resonant.
Return only the enhanced letter text — no headers, no meta commentary.`;

    const prompt = `Habit they are working on: ${habitType}
Desired outcome: ${desiredOutcome}

Original letter:
${rawLetter}

Return as JSON: { "enhanced": "...the polished letter text..." }`;

    const fallback = (): EnhanceResponse => ({
      enhanced: rawLetter.trim(),
    });

    const result = await callGeminiJSON<EnhanceResponse>(prompt, systemInstruction, fallback);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
