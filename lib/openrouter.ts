import OpenAI from "openai";

// Default model — swap to any model slug available on OpenRouter
export const OR_MODEL = "google/gemini-2.5-flash";

let _client: OpenAI | null = null;

export function getOpenRouter(): OpenAI | null {
  if (!process.env.OPENROUTER_API_KEY?.trim()) return null;
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://graha.app",
        "X-Title": "Graha — Vedic Astrology",
      },
    });
  }
  return _client;
}

export function hasOpenRouterKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim();
}
