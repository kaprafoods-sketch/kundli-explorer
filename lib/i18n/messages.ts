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
  | "explore.house"
  | "explore.retrograde"
  | "explore.neechaBhanga"
  | "explore.nakshatra"
  | "explore.pada"
  | "explore.signifies"
  | "explore.planetsInHouse"
  | "explore.houseSignifies"
  | "explore.ruledBy"
  | "explore.ascendant"
  | "explore.lagnaLord"
  | "explore.section.planet"
  | "explore.section.house"
  | "explore.section.sign"
  | "explore.section.dignity"
  | "explore.section.aspects"
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
  "explore.house": "House",
  "explore.retrograde": "Retrograde",
  "explore.neechaBhanga": "Neecha Bhanga?",
  "explore.nakshatra": "Nakshatra",
  "explore.pada": "Pada",
  "explore.signifies": "Signifies",
  "explore.planetsInHouse": "Planets in this house",
  "explore.houseSignifies": "House signifies",
  "explore.ruledBy": "ruled by",
  "explore.ascendant": "Ascendant",
  "explore.lagnaLord": "Lagna lord",
  "explore.section.planet": "The Planet — what it brings",
  "explore.section.house": "The House — where it acts",
  "explore.section.sign": "The Sign — how it expresses",
  "explore.section.dignity": "Dignity — strength dial",
  "explore.section.aspects": "Conjunctions & Aspects",
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
  "explore.house": "भाव",
  "explore.retrograde": "वक्री",
  "explore.neechaBhanga": "नीच भंग?",
  "explore.nakshatra": "नक्षत्र",
  "explore.pada": "पद",
  "explore.signifies": "कारकत्व",
  "explore.planetsInHouse": "इस भाव में ग्रह",
  "explore.houseSignifies": "भाव कारकत्व",
  "explore.ruledBy": "स्वामी",
  "explore.ascendant": "लग्न",
  "explore.lagnaLord": "लग्नेश",
  "explore.section.planet": "ग्रह — जो यह लाता है",
  "explore.section.house": "भाव — जहाँ यह कार्य करता है",
  "explore.section.sign": "राशि — जैसे यह व्यक्त होता है",
  "explore.section.dignity": "बल — शक्ति सूचक",
  "explore.section.aspects": "युति एवं दृष्टि",
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
  "explore.house": "Bhava",
  "explore.retrograde": "Vakri",
  "explore.nakshatra": "Nakshatra",
  "explore.pada": "Pada",
  "explore.ascendant": "Lagna",
  "explore.lagnaLord": "Lagnesha",
  // TODO sa: ai.ask, ai.astrologer, ai.astrologerSub, ai.guru, ai.guruSub,
  // TODO sa: ai.inputPlaceholder, common.close, common.back,
  // TODO sa: explore.emptyTitle, explore.emptySub, explore.planetGuide,
  // TODO sa: explore.neechaBhanga, explore.signifies, explore.planetsInHouse,
  // TODO sa: explore.houseSignifies, explore.ruledBy, explore.section.planet,
  // TODO sa: explore.section.house, explore.section.sign, explore.section.dignity,
  // TODO sa: explore.section.aspects, settings.language
  // (no established Sanskrit UI term for these — fall back to English)
};

export const MESSAGES: Record<Lang, Dict> = { en, hi, sa };

/** Resolve a UI string for the active language, falling back en → key. */
export function translate(lang: Lang, key: MessageKey): string {
  return MESSAGES[lang]?.[key] ?? en[key] ?? key;
}
