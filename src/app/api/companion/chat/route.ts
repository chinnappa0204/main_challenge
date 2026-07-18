import { NextResponse } from 'next/server';
import { callGeminiText } from '@/lib/gemini';
import { UserProfile } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  profile: UserProfile | null;
  messages: Message[];
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { profile, messages } = body;

    const userMessage = messages[messages.length - 1]?.content || '';

    // Safety routing layer for severe concerns
    const safetyKeywords = [
      'suicid',
      'self-harm',
      'kill myself',
      'end my life',
      'die',
      'withdrawal danger',
      'severe withdrawal',
      'overdose',
      'poison',
      'detox',
      'emergency',
    ];
    const isHighRisk = safetyKeywords.some((keyword) => userMessage.toLowerCase().includes(keyword));

    if (isHighRisk) {
      return NextResponse.json({
        content: `I hear how much pain or distress you are in, but I am an AI and cannot provide medical or emergency care. If you are in immediate danger, please call your local emergency services (like 911 or 999) or contact a crisis line immediately. Reclaim AI is a habit support companion and is not equipped for crisis intervention. Please stay safe and reach out to a trusted professional.`,
        isHighRisk: true,
      });
    }

    const systemInstruction = `You are a calm, friendly, non-judgmental, and action-oriented AI Companion for Reclaim AI.
Your role is to help users manage cravings, triggers, or habits.
CRITICAL RULES:
1. Keep responses extremely concise (maximum 2-3 short sentences).
2. DO NOT encourage endless chatting. The goal is to get the user off the screen!
3. If they describe a craving or stress, recommend a quick 3-to-5 minute real-world grounding task (e.g. stretching, looking out a window, drinking water).
4. End suitable statements with a direct nudge to close the app, such as: "Close the app now and complete a 5-minute breathing reset. Return afterward and tell me how you feel."
5. If they mention severe issues, redirect to qualified support.

User profile info (if available):
- Habit: ${profile?.specificHabit || 'Harmful screen habit'}
- Triggers: ${profile?.triggers.join(', ') || 'triggers'}
- Interests: ${profile?.personalInterests.join(', ') || 'physical activity'}
- Coaching style: ${profile?.preferredCoachingTone || 'gentle'}`;

    const prompt = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Companion'}: ${msg.content}`)
      .join('\n') + '\nCompanion:';

    const fallbackGenerator = (): string => {
      // Local fallback builder for conversational replies
      const text = userMessage.toLowerCase();
      if (text.includes('urge') || text.includes('crave') || text.includes('scroll') || text.includes('opening')) {
        return `I understand that urge is strong right now. Let's do a quick physical reset: stand up, roll your shoulders back, and drink a glass of water. Close the app now and try this for 3 minutes. I'll be here when you return.`;
      }
      if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        return `Hello! I'm here to support you in stepping away from the screen. Are you feeling an urge right now, or reflecting on your progress? Let's keep it short so you can return to real life.`;
      }
      return `That's an important observation. To help center yourself, I recommend taking a short 5-minute break outside or looking away from all screens. Close the app now and return when you're ready to check in.`;
    };

    const content = await callGeminiText(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json({ content, isHighRisk: false });
  } catch (error: unknown) {
    console.error('Error in Companion API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
