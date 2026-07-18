import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile } from '@/lib/types';

interface BriefRequest {
  profile: UserProfile;
  supportNeeded: string;
  successfulActivities: string[];
  unsuccessfulActivities: string[];
  recentPattern: string;
}

interface BriefResponse {
  brief: string;
}

export async function POST(request: Request) {
  try {
    const body: BriefRequest = await request.json();
    const { profile, supportNeeded, successfulActivities = [], unsuccessfulActivities = [], recentPattern = '' } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemInstruction = `You are a clinical coordinator intake assistant.
Create a highly professional, well-organized AI Consultation Brief to share with a human support coach.
The brief must summarize:
1. User profile and main goal
2. Habit details and frequency
3. Common triggers and emotions
4. What has worked (based on successful activities: ${successfulActivities.join(', ') || 'None registered'})
5. What has failed (based on unsuccessful activities: ${unsuccessfulActivities.join(', ') || 'None registered'})
6. Recent progress pattern: ${recentPattern || 'Consistent participation'}
7. Specific support needed: "${supportNeeded}"

Your output must be JSON:
{
  "brief": "A professional Markdown-formatted string containing headers, bullet points, and an objective intake summary."
}
Keep it objective, warm, and highly structured so the human coach can review it in 30 seconds. Do not wrap the JSON in markdown code blocks.`;

    const prompt = 'Generate the intake brief JSON:';

    const fallbackGenerator = (): BriefResponse => {
      // Local fallback builder for the markdown brief
      const brief = `### AI Intake Consultation Brief
**Client Name:** Reclaim AI Member
**Primary Concern:** ${profile.specificHabit} (Habit Type: ${profile.habitType})
**Preferred Tone:** ${profile.preferredCoachingTone}

#### 1. Clinical Summary
* **Habit Frequency:** ${profile.frequencyDuration}
* **Triggers Identified:** ${profile.triggers.join(', ') || 'General downtime'}
* **Emotional State associated:** ${profile.emotions.join(', ') || 'restlessness'}

#### 2. Progress & Interventions
* **Successful Activities:** ${successfulActivities.length > 0 ? successfulActivities.join(', ') : 'None documented yet'}
* **Unsuccessful/Avoided Activities:** ${unsuccessfulActivities.length > 0 ? unsuccessfulActivities.join(', ') : 'None documented yet'}
* **Recent Pattern:** ${recentPattern || 'Developing self-reflection habits'}

#### 3. Intake Focus Request
* **Specific Request:** "${supportNeeded}"
* **Desired Outcome:** ${profile.desiredOutcome}

---
*Reclaim AI Automated Intake Brief. Generated with member consent.*`;

      return { brief };
    };

    const result = await callGeminiJSON<BriefResponse>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Support Brief API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
