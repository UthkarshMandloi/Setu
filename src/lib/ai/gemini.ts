import { GoogleGenerativeAI } from "@google/generative-ai";

// Tried in order. The fallback keeps AI features alive if the primary model is retired or rate-limited.
const MODELS = Array.from(new Set([process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-flash-latest"]));

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== "mock-key";
}

/**
 * Calls Gemini and parses a JSON object from the reply.
 * Returns null on any failure so callers can fall back to a labelled mock response.
 */
export async function generateJson<T>(systemInstruction: string, prompt: string): Promise<T | null> {
  if (!isGeminiConfigured()) return null;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      });
      const result = await model.generateContent(prompt);
      const json = result.response.text().match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json) as T;
    } catch (err) {
      console.error(`Gemini call failed on ${modelName}:`, err);
    }
  }
  return null;
}
