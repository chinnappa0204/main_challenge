import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile } from '@/lib/types';

interface PlanRequest {
  profile: UserProfile;
  recentReflections?: unknown[];
  interventions?: unknown[];
}

interface PlanResponse {
  focus: string;
  predictedRisk: string;
  purposeActionName: string;
  connectionActionName: string;
  protectionActionName: string;
}

export async function POST(request: Request) {
  try {
    const body: PlanRequest = await request.json();
    const { profile, recentReflections = [], interventions = [] } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemInstruction = `You are a clinical behavior change planner.
Based on the user's profile and habit triggers, generate a daily plan.
Habit: ${profile.specificHabit} (Type: ${profile.habitType})
Triggers: ${profile.triggers.join(', ')}
Interests: ${profile.personalInterests.join(', ')}
Coaching tone: ${profile.preferredCoachingTone}

Use recent outcomes to adapt:
- Recent Reflections: ${JSON.stringify(recentReflections.slice(0, 3))}
- Past Interventions: ${JSON.stringify(interventions.slice(0, 5))}

Your output must be raw JSON exactly like:
{
  "focus": "A short focus statement for today, e.g., 'Reduce bedtime scrolling by 15 minutes.'",
  "predictedRisk": "A predicted trigger condition, e.g., 'Stress after 6:00 PM leading to mindless browsing.'",
  "purposeActionName": "One short real-world action aligned with interests, e.g., 'Do a 10-minute watercolor sketch.'",
  "connectionActionName": "One short connection action, e.g., 'Send a text to a friend asking about their week.'",
  "protectionActionName": "One protective boundary action, e.g., 'Leave phone charging in the kitchen overnight.'"
}
Make the activities highly realistic, off-screen, and matching their preferred tone. Avoid markdown formatting.`;

    const prompt = 'Generate the daily plan JSON:';

    const fallbackGenerator = (): PlanResponse => {
      // Heuristic fallback daily plans
      const habit = profile.habitType;
      const interests = profile.personalInterests.length > 0 ? profile.personalInterests : ['walking', 'reading', 'nature'];
      const interest = interests[0];

      let focus = 'Reduce screen time by 20 minutes before sleeping.';
      let predictedRisk = 'Feeling restless or bored between 8:00 PM and 10:00 PM.';
      let purposeActionName = `Spend 10 minutes engaged in ${interest}.`;
      let connectionActionName = 'Send a short text to a close friend or family member.';
      let protectionActionName = 'Turn off notifications after 9:00 PM.';

      switch (habit) {
        case 'phone-social':
          focus = 'Replace social media checking with physical book reading.';
          predictedRisk = 'Boredom and scrolling during lunch break or late evening.';
          purposeActionName = `Walk outside for 15 minutes and observe details for ${interest}.`;
          connectionActionName = 'Call a loved one for a quick 5-minute catch-up.';
          protectionActionName = 'Charge your phone in the hallway instead of next to your bed.';
          break;
        case 'gaming':
          focus = 'Create a firm end-timer for gaming sessions.';
          predictedRisk = 'Getting caught in "just one more game" loops after dinner.';
          purposeActionName = `Do 10 minutes of physical stretching or exercise.`;
          connectionActionName = 'Tell an accountability partner about your gaming plans today.';
          protectionActionName = 'Log off the console and shut down the screen by 10:00 PM.';
          break;
        case 'procrastination':
          focus = 'Complete one 20-minute focused task block.';
          predictedRisk = 'Urge to click away to distracting websites when starting difficult work.';
          purposeActionName = `Clean and organize your physical desk space for 10 minutes.`;
          connectionActionName = 'Share your work goals with a colleague or study buddy.';
          protectionActionName = 'Close all unused tabs and put phone in another room during focus.';
          break;
        case 'junk-food':
          focus = 'Incorporate one healthy home-cooked meal.';
          predictedRisk = 'Stress cravings and quick food ordering apps around 4:00 PM.';
          purposeActionName = 'Prepare a physical list of healthy snacks you enjoy.';
          connectionActionName = 'Have a tea or glass of water with a family member or co-worker.';
          protectionActionName = 'Uninstall food delivery apps or turn off their notifications.';
          break;
        default:
          break;
      }

      return {
        focus,
        predictedRisk,
        purposeActionName,
        connectionActionName,
        protectionActionName,
      };
    };

    const result = await callGeminiJSON<PlanResponse>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Plan API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
