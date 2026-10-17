import { GoogleGenAI } from "@google/genai";

// ← one-line swap point (2.5-flash was retired for new API users; Google directs to 3.8-flash)
export const GEMINI_MODEL = "gemini-3.8-flash";

export function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY?.trim()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}
