import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile } from '@/lib/types';

interface NudgeRequest {
  profile: UserProfile;
  successfulActivities: string[];
  unsuccessfulActivities: string[];
  recentTriggers: string[];
}

interface NudgeResponse {
  content: string;
}

export async function POST(request: Request) {
  try {
    const body: NudgeRequest = await request.json();
    const { profile, successfulActivities = [], unsuccessfulActivities = [], recentTriggers = [] } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemInstruction = `You are a micro-behavior nudger. 
Write a highly specific, single-paragraph personalized nudge (2-3 sentences max).
Do NOT write generic motivational quotes like "Believe in yourself!".
Instead, write a nudge that connects a known trigger to a specific off-screen action, mentioning previous success or preferences if applicable.

Habit: ${profile.specificHabit}
Triggers: ${profile.triggers.join(', ')}
Interests: ${profile.personalInterests.join(', ')}
Preferred tone: ${profile.preferredCoachingTone}
Recent active triggers: ${recentTriggers.join(', ') || 'None yet'}
Effective past activities: ${successfulActivities.join(', ') || 'None yet'}
Ineffective past activities: ${unsuccessfulActivities.join(', ') || 'None yet'}

Your response must be JSON:
{
  "content": "The text of the nudge."
}
Keep it short, helpful, and focused on stepping away from the device.`;

    const prompt = 'Generate the nudge JSON:';

    const fallbackGenerator = (): NudgeResponse => {
      // Local nudge generator fallback
      const activeTrigger = recentTriggers[0] || profile.triggers[0] || 'feeling tired or stressed';
      const habitWord = profile.habitType === 'phone-social' ? 'scrolling' : 'using screens';
      const interest = profile.personalInterests[0] || 'taking a walk';

      let content = `It's common to turn to ${habitWord} when you experience ${activeTrigger}. Before you unlock your device, try taking a 5-minute pause to do some light stretching. It helps break the automatic loop.`;

      if (successfulActivities.length > 0) {
        content = `You usually start ${habitWord} when triggered by ${activeTrigger}. Previously, "${successfulActivities[0]}" helped reduce your urge. Try doing that for 5 minutes right now before opening any apps!`;
      } else if (profile.personalInterests.length > 0) {
        content = `Feeling the urge to open ${profile.specificHabit.toLowerCase()}? Since you enjoy ${interest}, close the app right now and dedicate 10 minutes to it. Your mind will thank you.`;
      }

      return { content };
    };

    const result = await callGeminiJSON<NudgeResponse>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Nudge API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
