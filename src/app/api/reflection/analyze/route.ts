import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile } from '@/lib/types';

interface ReflectionRequest {
  profile: UserProfile;
  habitDurationMinutes: number;
  strongestTrigger: string;
  emotionalState: string;
  replacementActivityAttempted: string;
  helped: boolean;
  reclaimedTimeMinutes: number;
  notes?: string;
}

interface ReflectionAnalysis {
  aiSummary: string;
  aiWhatWorked: string;
  aiWhatDidNotWork: string;
  aiPattern: string;
  aiAdjustment: string;
  aiEncouragement: string;
  aiNextAction: string;
}

export async function POST(request: Request) {
  try {
    const body: ReflectionRequest = await request.json();
    const {
      profile,
      habitDurationMinutes,
      strongestTrigger,
      emotionalState,
      replacementActivityAttempted,
      helped,
      reclaimedTimeMinutes,
      notes,
    } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemInstruction = `You are a clinical psychologist and behavior change expert.
Analyze the user's daily reflection and output a supportive, structured feedback analysis.
Under no circumstances should you criticize, blame, or shame the user. If they spent a lot of time on their habit, validate their feelings and focus on the effort they put in or the lessons learned.

Habit Goal: ${profile.specificHabit}
Tone: ${profile.preferredCoachingTone}

Today's Reflection data:
- Habit Duration/Frequency today: ${habitDurationMinutes} minutes
- Strongest Trigger: ${strongestTrigger}
- Emotional State: ${emotionalState}
- Replacement Activity Attempted: ${replacementActivityAttempted || 'None'} (Helped: ${helped ? 'Yes' : 'No'})
- Reclaimed Time: ${reclaimedTimeMinutes} minutes
- User Notes: "${notes || 'None'}"

You must return a JSON object with:
{
  "aiSummary": "A short, warm, compassionate summary of the day.",
  "aiWhatWorked": "What went well today (e.g. attempting a replacement activity or recognizing triggers).",
  "aiWhatDidNotWork": "A supportive analysis of why things got hard, without judgment.",
  "aiPattern": "The relationship between their trigger ('${strongestTrigger}'), mood ('${emotionalState}'), and habit.",
  "aiAdjustment": "A small, actionable change to make tomorrow easier.",
  "aiEncouragement": "An encouraging validation of their courage to self-reflect.",
  "aiNextAction": "A simple physical activity to do now before sleeping (e.g. read one physical book page, deep breathing)."
}
Do not use markdown in your response.`;

    const prompt = 'Analyze this reflection and output JSON:';

    const fallbackGenerator = (): ReflectionAnalysis => {
      // Local fallback heuristics for reflection summary
      const activityWord = replacementActivityAttempted || 'taking a pause';

      const worked = helped
        ? `You successfully tried "${activityWord}" when triggered by ${strongestTrigger}, and it helped reduce your urge.`
        : `You recognized your trigger (${strongestTrigger}) and attempted "${activityWord}", which is a great step.`;

      const notWorked = helped
        ? `No major setbacks. You managed the urge well.`
        : `When feeling ${emotionalState}, the urge to return to ${profile.specificHabit.toLowerCase()} was very strong. The chosen activity didn't fully resolve it, which is completely normal.`;

      return {
        aiSummary: `Thank you for completing today's reflection. You reclaimed ${reclaimedTimeMinutes} minutes today, which is time you redirected towards your life.`,
        aiWhatWorked: worked,
        aiWhatDidNotWork: notWorked,
        aiPattern: `It seems that when you feel ${emotionalState}, you are highly susceptible to your trigger: "${strongestTrigger}".`,
        aiAdjustment: `Tomorrow, let's make the protection action slightly easier or prepare a different interest-based activity earlier in the day.`,
        aiEncouragement: `Self-awareness is the foundation of change. Every day is a fresh starting point, and there is no shame in facing difficulties.`,
        aiNextAction: `Shut down your screens now. Take three deep breaths, drink a glass of water, and get some restful sleep.`,
      };
    };

    const result = await callGeminiJSON<ReflectionAnalysis>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Reflection API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
