import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { UserProfile, HabitType, CoachingTone } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { transcript } = body;

    const {
      name: bodyName,
      habitType: bodyHabitType,
      specificHabit: bodySpecificHabit,
      triggers: bodyTriggers,
      riskPeriods: bodyRiskPeriods,
      interests: bodyInterests,
      desiredOutcome: bodyDesiredOutcome,
      preferredCoachingTone: bodyPreferredCoachingTone,
    } = body;

    if (!transcript) {
      if (bodyHabitType && bodySpecificHabit) {
        transcript = `
AI: What habit are you working on?
User: My habit category is ${bodyHabitType}. More specifically, ${bodySpecificHabit}.
AI: What usually triggers the urge?
User: Triggers: ${(bodyTriggers || []).join(', ')}.
AI: When are you most at risk?
User: Risk periods: ${(bodyRiskPeriods || []).join(', ')}.
AI: What do you genuinely enjoy?
User: My interests and activities I enjoy are: ${bodyInterests || ''}.
AI: What would change if this habit were gone?
User: Desired outcome: ${bodyDesiredOutcome || ''}.
AI: How would you like to be coached?
User: Preferred coaching tone: ${bodyPreferredCoachingTone || ''}.
`;
      } else {
        return NextResponse.json({ error: 'Transcript or structured habit profile fields are required' }, { status: 400 });
      }
    }

    const systemInstruction = `You are a professional behavioral change architect. 
Analyze the following conversational onboarding transcript between a user and an AI.
Extract their information into a structured JSON format exactly matching the following keys:
{
  "habitType": "phone-social" | "gaming" | "procrastination" | "junk-food" | "nicotine" | "alcohol-substance" | "custom",
  "specificHabit": "string describing the habit",
  "frequencyDuration": "string describing how often or long",
  "triggers": ["string trigger 1", "string trigger 2"],
  "emotions": ["stressed", "bored", "lonely", "low", "restless", "angry", "avoiding something", "automatic urge"],
  "riskPeriods": ["string representing times/days of high risk"],
  "personalInterests": ["interest 1", "interest 2"],
  "desiredOutcome": "string describing what they want to achieve or regain",
  "preferredCoachingTone": "gentle" | "direct" | "energetic",
  "previouslyAttemptedStrategies": ["strategy 1", "strategy 2"],
  "trustedSupportPreferences": "string describing preferred style of support/connections"
}

Ensure "habitType" is exactly one of the seven specified string literals.
Ensure "preferredCoachingTone" is exactly one of the three specified string literals.
Return only valid JSON. Do not include markdown codeblocks or text around it.`;

    const prompt = `Conversational Transcript:\n${transcript}\n\nAnalyze and output JSON:`;

    const fallbackGenerator = (): UserProfile => {
      // If direct fields are provided in the body, return them deterministically
      if (bodyHabitType && bodySpecificHabit) {
        let personalInterests: string[] = [];
        if (typeof bodyInterests === 'string') {
          personalInterests = bodyInterests.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (Array.isArray(bodyInterests)) {
          personalInterests = bodyInterests;
        }

        const fallbackEmotions: string[] = [];
        const inputTriggers: string[] = bodyTriggers || [];
        inputTriggers.forEach((t: string) => {
          const lower = t.toLowerCase();
          if (lower.includes('stress')) fallbackEmotions.push('stressed');
          if (lower.includes('bored')) fallbackEmotions.push('bored');
          if (lower.includes('lonel')) fallbackEmotions.push('lonely');
          if (lower.includes('fatigue') || lower.includes('tired')) fallbackEmotions.push('low');
        });
        if (fallbackEmotions.length === 0) {
          fallbackEmotions.push('automatic urge');
        }

        return {
          name: bodyName || undefined,
          habitType: bodyHabitType,
          specificHabit: bodySpecificHabit,
          frequencyDuration: '2 to 3 hours daily',
          triggers: inputTriggers,
          emotions: fallbackEmotions,
          riskPeriods: bodyRiskPeriods || [],
          personalInterests,
          desiredOutcome: bodyDesiredOutcome || '',
          preferredCoachingTone: bodyPreferredCoachingTone || 'gentle',
          previouslyAttemptedStrategies: ['putting phone in another room', 'app block timer'],
          trustedSupportPreferences: 'An accountability guide or close friend checking in weekly',
          onboardedAt: new Date().toISOString(),
        };
      }

      // Basic fallback parsing of transcript
      const text = transcript.toLowerCase();
      let habitType: HabitType = 'phone-social';
      let specificHabit = 'Excessive phone and social media use';
      let tone: CoachingTone = 'gentle';

      if (text.includes('gaming') || text.includes('game') || text.includes('play')) {
        habitType = 'gaming';
        specificHabit = 'Overusing video games';
      } else if (text.includes('procrastinat') || text.includes('delay') || text.includes('study')) {
        habitType = 'procrastination';
        specificHabit = 'Procrastinating on important tasks';
      } else if (text.includes('food') || text.includes('sugar') || text.includes('snack') || text.includes('eating')) {
        habitType = 'junk-food';
        specificHabit = 'Junk food cravings and snacking';
      } else if (text.includes('smoke') || text.includes('vape') || text.includes('nicotine') || text.includes('cigarette')) {
        habitType = 'nicotine';
        specificHabit = 'Smoking / nicotine dependency';
      } else if (text.includes('alcohol') || text.includes('drink') || text.includes('beer') || text.includes('substance')) {
        habitType = 'alcohol-substance';
        specificHabit = 'Alcohol or substance concerns';
      }

      if (text.includes('direct') || text.includes('straight') || text.includes('tough')) {
        tone = 'direct';
      } else if (text.includes('energ') || text.includes('motivat') || text.includes('active')) {
        tone = 'energetic';
      }

      // Simple extraction regex-like searches
      const triggers = [];
      if (text.includes('stress') || text.includes('work')) triggers.push('Work stress');
      if (text.includes('bore') || text.includes('nothing to do')) triggers.push('Boredom');
      if (text.includes('lonely') || text.includes('alone')) triggers.push('Loneliness');
      if (triggers.length === 0) triggers.push('Evening downtime');

      const emotions = [];
      if (text.includes('stress')) emotions.push('stressed');
      if (text.includes('bore')) emotions.push('bored');
      if (text.includes('lonel')) emotions.push('lonely');
      if (emotions.length === 0) emotions.push('automatic urge');

      return {
        habitType,
        specificHabit,
        frequencyDuration: '2 to 3 hours daily',
        triggers,
        emotions,
        riskPeriods: ['Late evenings after work', 'During study sessions'],
        personalInterests: ['reading', 'photography', 'playing acoustic guitar', 'walking outside'],
        desiredOutcome: 'Regain focused time, improve sleep quality, and connect more in real life',
        preferredCoachingTone: tone,
        previouslyAttemptedStrategies: ['putting phone in another room', 'app block timer'],
        trustedSupportPreferences: 'An accountability guide or close friend checking in weekly',
        onboardedAt: new Date().toISOString(),
      };
    };

    const result = await callGeminiJSON<UserProfile>(prompt, systemInstruction, fallbackGenerator);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in Onboarding Extract route:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
