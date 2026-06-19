import { GoogleGenAI } from "@google/genai";

// ← one-line swap point
export const GEMINI_MODEL = "gemini-2.5-flash";

export function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY?.trim()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}
