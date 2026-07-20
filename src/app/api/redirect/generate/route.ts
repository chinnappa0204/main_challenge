import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile, UrgeIntensity } from '@/lib/types';

interface RedirectRequest {
  profile: UserProfile;
  currentEmotion: string;
  urgeIntensity: UrgeIntensity;
  availableTime: number; // minutes
  context?: string;
  successfulActivities?: string[];
  unsuccessfulActivities?: string[];
}

interface MissionResponse {
  missionTitle: string;
  missionSteps: string[];
}

export async function POST(request: Request) {
  try {
    const body: RedirectRequest = await request.json();
    const {
      profile,
      currentEmotion,
      urgeIntensity,
      availableTime,
      context,
      successfulActivities = [],
      unsuccessfulActivities = [],
    } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemInstruction = `You are a compassionate, world-class behavioral coach. 
Generate one highly personalized, off-screen, real-world intervention (called a "mission") to help a user break a harmful urge.
The user is struggling with: ${profile.specificHabit} (Habit Type: ${profile.habitType}).
Current Emotion: ${currentEmotion}
Current Urge Intensity: ${urgeIntensity}/10
Available time: ${availableTime} minutes
User Interests: ${(profile.personalInterests ?? []).join(', ') || 'general hobbies'}
Optional User Context: ${context || 'None'}

Adapt based on feedback:
- Successful past activities: ${successfulActivities.join(', ') || 'None yet'}
- Unsuccessful/ignored past activities: ${unsuccessfulActivities.join(', ') || 'None yet'} (DO NOT RECOMMEND THESE!)

Your output must be a JSON object with:
{
  "missionTitle": "Short, catchy, encouraging title (e.g., 'Seven-minute reset', 'Spontaneous Sketch')",
  "missionSteps": [
    "Step 1: Physical off-screen action (e.g., put your phone face down)",
    "Step 2: Engaging sensory or motor instruction",
    "Step 3: ...",
    "Last Step: Final positive off-screen grounding step"
  ]
}

CRITICAL RULES:
- The mission MUST be completed within ${availableTime} minutes.
- The mission MUST NOT require using a screen (phone/computer) except for static utility like playing a song or setting a timer, after which they must put the phone face down.
- Make it physical, tactile, or outdoors if possible. Avoid recommending things the user has ignored in the past.
- The tone should match the user's preferred coaching tone: ${profile.preferredCoachingTone}.
- Do not return markdown, just raw JSON.`;

    const prompt = `Generate a mission matching the constraints. JSON:`;

    const fallbackGenerator = (): MissionResponse => {
      // Local heuristics for generating high quality missions if Gemini is unavailable
      const interests = profile.personalInterests.length > 0 ? profile.personalInterests : ['walking', 'reading', 'stretching'];
      const chosenInterest = interests[Math.floor(Math.random() * interests.length)];

      if (currentEmotion === 'stressed' || currentEmotion === 'restless') {
        return {
          missionTitle: `${availableTime}-Minute Calming Release`,
          missionSteps: [
            'Place your phone face down in another room.',
            'Sit in a comfortable chair with your back straight.',
            `Spend ${Math.floor(availableTime / 2)} minutes taking deep breaths: inhale for 4 seconds, hold for 4, exhale for 6.`,
            'Stand up, stretch your arms high above your head, and let out a deep sigh.',
            'Return with a clear mind and write down one thing you want to focus on next.',
          ],
        };
      }

      if (currentEmotion === 'lonely') {
        return {
          missionTitle: 'Connection Ripple',
          missionSteps: [
            'Lock your phone screen.',
            'Find a postcard, a piece of paper, or prepare to send a quick voice message.',
            'Think of a friend, relative, or old classmate you haven\'t spoken to in a while.',
            'Draft a short, specific message sharing a pleasant memory or asking how they are doing.',
            'Send it, put the phone down immediately, and enjoy the feeling of having reached out.',
          ],
        };
      }

      if (currentEmotion === 'bored' || currentEmotion === 'avoiding something') {
        return {
          missionTitle: `Micro-${chosenInterest.toUpperCase()}`,
          missionSteps: [
            'Put your phone in a drawer or face down on the table.',
            `Engage in ${chosenInterest} physically. For example: find a book, grab a notebook, or step outside.`,
            `Spend exactly ${Math.floor(availableTime * 0.8)} minutes enjoying this physical action, completely distraction-free.`,
            'Before picking up your phone, notice three details about your physical environment.',
            'Re-engage with your day with a refreshed focus.',
          ],
        };
      }

      // Default fallback
      return {
        missionTitle: 'The Seven-Minute Reset',
        missionSteps: [
          'Place the phone face down on a table.',
          'Walk outside or into another room away from screens.',
          'Listen to one complete acoustic or instrumental song.',
          'Notice three distinct sounds around you (birds, hum of the fridge, wind, etc.).',
          'Take a sip of water and return when the song finishes.',
        ],
      };
    };

    const result = await callGeminiJSON<MissionResponse>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Redirect API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
