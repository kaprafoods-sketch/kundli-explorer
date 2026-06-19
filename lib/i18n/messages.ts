// lib/i18n/messages.ts
//
// UI-chrome translations (buttons, labels, headings) — kept SEPARATE from
// astrological terms, which resolve from the knowledge base via getName()
// (see lib/kb.ts). Add a key here, fill `en` + `hi`; `sa` is optional and
// falls back to English (see policy below).
//
// Sanskrit (sa) policy: provide a Roman-transliterated term ONLY where an
// established one genuinely exists (Kundali, Graha, Gochara…). For generic
// interface labels with no real Sanskrit equivalent, omit the key — t() falls
// back to English automatically. Do not fabricate pseudo-Sanskrit. Unfilled
// entries are marked `// TODO sa` so they are easy to find later.

import type { Lang } from "@/lib/kb";

export type MessageKey =
  | "nav.chart"
  | "nav.planets"
  | "nav.transits"
  | "ai.ask"
  | "ai.title"
  | "ai.astrologer"
  | "ai.astrologerSub"
  | "ai.guru"
  | "ai.guruSub"
  | "ai.inputPlaceholder"
  | "ai.send"
  | "common.close"
  | "common.back"
  | "explore.emptyTitle"
  | "explore.emptySub"
  | "explore.planetGuide"
  | "chart.lagnaUncertain"
  | "settings.language";

type Dict = Partial<Record<MessageKey, string>>;

const en: Record<MessageKey, string> = {
  "nav.chart": "Chart",
  "nav.planets": "Planets",
  "nav.transits": "Transits",
  "ai.ask": "Ask GRAHA AI",
  "ai.title": "GRAHA AI",
  "ai.astrologer": "AI Astrologer",
  "ai.astrologerSub": "Ask about your chart",
  "ai.guru": "Astro Guru",
  "ai.guruSub": "Learn the fundamentals",
  "ai.inputPlaceholder": "Ask about any placement in your chart…",
  "ai.send": "Ask",
  "common.close": "Close",
  "common.back": "Back",
  "explore.emptyTitle": "Tap a planet or house to learn",
  "explore.emptySub": "Each placement tells a story — select anything on the chart to see its reading.",
  "explore.planetGuide": "Planet guide",
  "chart.lagnaUncertain": "Lagna uncertain",
  "settings.language": "Language",
};

const hi: Dict = {
  "nav.chart": "कुंडली",
  "nav.planets": "ग्रह",
  "nav.transits": "गोचर",
  "ai.ask": "GRAHA AI से पूछें",
  "ai.title": "GRAHA AI",
  "ai.astrologer": "एआई ज्योतिषी",
  "ai.astrologerSub": "अपनी कुंडली के बारे में पूछें",
  "ai.guru": "ज्योतिष गुरु",
  "ai.guruSub": "मूल बातें सीखें",
  "ai.inputPlaceholder": "अपनी कुंडली की किसी भी स्थिति के बारे में पूछें…",
  "ai.send": "पूछें",
  "common.close": "बंद करें",
  "common.back": "वापस",
  "explore.emptyTitle": "सीखने के लिए किसी ग्रह या भाव पर टैप करें",
  "explore.emptySub": "हर स्थिति एक कहानी कहती है — पढ़ने के लिए चार्ट पर कुछ भी चुनें।",
  "explore.planetGuide": "ग्रह मार्गदर्शिका",
  "chart.lagnaUncertain": "लग्न अनिश्चित",
  "settings.language": "भाषा",
};

// Sanskrit chrome — only genuine, established terms (Roman transliteration to
// stay visibly distinct from Devanagari Hindi). Everything else → English.
const sa: Dict = {
  "nav.chart": "Kundali",
  "nav.planets": "Graha",
  "nav.transits": "Gochara",
  "ai.title": "GRAHA AI",
  "ai.send": "Prccha", // "ask"
  "chart.lagnaUncertain": "Lagna aniśchita",
  // TODO sa: ai.ask, ai.astrologer, ai.astrologerSub, ai.guru, ai.guruSub,
  // TODO sa: ai.inputPlaceholder, common.close, common.back,
  // TODO sa: explore.emptyTitle, explore.emptySub, explore.planetGuide,
  // TODO sa: settings.language  (no established Sanskrit UI term — fall back to English)
};

export const MESSAGES: Record<Lang, Dict> = { en, hi, sa };

/** Resolve a UI string for the active language, falling back en → key. */
export function translate(lang: Lang, key: MessageKey): string {
  return MESSAGES[lang]?.[key] ?? en[key] ?? key;
}
