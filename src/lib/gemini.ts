import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const isPlaceholder = !apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '';

let ai: GoogleGenAI | null = null;
if (!isPlaceholder && apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI client:', error);
  }
}

export const isGeminiConfigured = (): boolean => {
  return ai !== null;
};

export async function callGeminiJSON<T>(
  prompt: string,
  systemInstruction: string,
  fallbackGenerator: () => T
): Promise<T> {
  if (!ai) {
    console.warn('Gemini API key is not configured. Running fallback generator.');
    return fallbackGenerator();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.error('Failed to parse Gemini JSON response:', text, e);
      throw e;
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.warn('Falling back to local simulation generator.');
    return fallbackGenerator();
  }
}

export async function callGeminiText(
  prompt: string,
  systemInstruction: string,
  fallbackGenerator: () => string
): Promise<string> {
  if (!ai) {
    console.warn('Gemini API key is not configured. Running fallback generator.');
    return fallbackGenerator();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const text = response.text;
    return text || fallbackGenerator();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.warn('Falling back to local simulation.');
    return fallbackGenerator();
  }
}
