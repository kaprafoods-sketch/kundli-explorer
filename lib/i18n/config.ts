// lib/i18n/config.ts — language constants shared by server + client.
import type { Lang } from "@/lib/kb";

export const LANG_COOKIE = "kx_lang";
export const DEFAULT_LANG: Lang = "en";
export const LANGS: readonly Lang[] = ["en", "hi", "sa"] as const;

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "hi" || v === "sa";
}

/** Map our app language to a valid html[lang] attribute value. */
export function htmlLang(lang: Lang): string {
  return lang === "hi" ? "hi" : lang === "sa" ? "sa" : "en";
}
