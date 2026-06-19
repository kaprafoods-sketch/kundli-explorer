"use client";

/**
 * LanguageSwitcher — segmented control for English / हिन्दी / संस्कृतम्.
 * Each option is shown in its own script. On change it updates the language
 * store (immediate, no reload) and persists via cookie (see LanguageProvider).
 */

import type { Lang } from "@/lib/kb";
import { useLang } from "./LanguageProvider";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "sa", label: "संस्कृतम्" },
];

interface Props {
  /** Show the "Language" field label above the control. */
  withLabel?: boolean;
  compact?: boolean;
}

export default function LanguageSwitcher({ withLabel = true, compact = false }: Props) {
  const { lang, setLang, t } = useLang();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {withLabel && (
        <span
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontFamily: "var(--font-ui), system-ui",
          }}
        >
          {t("settings.language")}
        </span>
      )}

      <div
        role="radiogroup"
        aria-label={t("settings.language")}
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: "var(--panel-2)",
          border: "1px solid var(--faint)",
          width: compact ? "auto" : "100%",
        }}
      >
        {OPTIONS.map((opt) => {
          const active = lang === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLang(opt.id)}
              className="press"
              style={{
                flex: compact ? "0 0 auto" : 1,
                minHeight: 40,
                padding: "8px 14px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: active ? 700 : 500,
                fontFamily: "var(--font-ui), system-ui",
                background: active ? "var(--brass)" : "transparent",
                color: active ? "var(--bg)" : "var(--muted)",
                transition: "background 0.18s var(--ease-out, ease-out), color 0.18s var(--ease-out, ease-out)",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
