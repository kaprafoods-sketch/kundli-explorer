"use client";

/**
 * LanguageProvider — app-wide active language + UI-string translator.
 *
 * State flow: the server layout reads the `kx_lang` cookie and passes
 * `initialLang` (so SSR renders the right language with no hydration flash).
 * setLang updates context immediately (no reload) AND writes the cookie so the
 * choice persists and is available to the next server render.
 *
 * Astrological NAMES do not come from here — use getName() from lib/kb.ts.
 */

import { createContext, useCallback, useContext, useState } from "react";
import type { Lang } from "@/lib/kb";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import { LANG_COOKIE, DEFAULT_LANG, htmlLang } from "@/lib/i18n/config";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey) => string;
}

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({
  initialLang = DEFAULT_LANG,
  children,
}: {
  initialLang?: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof document !== "undefined") {
      document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; samesite=lax`;
      document.documentElement.lang = htmlLang(l);
    }
  }, []);

  const t = useCallback((key: MessageKey) => translate(lang, key), [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

/** Active language + translator. Safe default (English, no-op) if used outside
 *  a provider, so partial adoption never crashes a component. */
export function useLang(): LanguageCtx {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  return {
    lang: DEFAULT_LANG,
    setLang: () => {},
    t: (key) => translate(DEFAULT_LANG, key),
  };
}
