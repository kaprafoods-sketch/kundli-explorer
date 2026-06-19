"use client";

import type { ReactNode } from "react";

// ── Inline bold parser ────────────────────────────────────────────────────────

function parseBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} style={{ color: "var(--parchment)", fontWeight: 600 }}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

// ── Block-level parser ────────────────────────────────────────────────────────

interface Block {
  type: "h2" | "h3" | "ol" | "ul" | "p" | "blank";
  items?: string[];  // for ol / ul
  text?: string;     // for h2 / h3 / p
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4) });
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
      i++;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
    } else if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
    } else if (line.trim() === "") {
      blocks.push({ type: "blank" });
      i++;
    } else {
      blocks.push({ type: "p", text: line });
      i++;
    }
  }

  return blocks;
}

// ── Renderer ─────────────────────────────────────────────────────────────────

interface Props {
  text: string;
  className?: string;
}

export default function Markdown({ text, className }: Props) {
  const blocks = parseBlocks(text);

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((block, bi) => {
        if (block.type === "blank") return null;

        if (block.type === "h2") {
          return (
            <h3
              key={bi}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--brass)",
                margin: "6px 0 0",
              }}
            >
              {parseBold(block.text ?? "")}
            </h3>
          );
        }

        if (block.type === "h3") {
          return (
            <h4
              key={bi}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted)",
                margin: "4px 0 0",
              }}
            >
              {parseBold(block.text ?? "")}
            </h4>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={bi} style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
              {block.items?.map((item, ii) => (
                <li key={ii} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20, height: 20,
                      borderRadius: "50%",
                      background: "rgba(200,162,74,0.15)",
                      border: "1px solid rgba(200,162,74,0.35)",
                      color: "var(--brass)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {ii + 1}
                  </span>
                  <span style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--parchment)" }}>
                    {parseBold(item)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={bi} style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {block.items?.map((item, ii) => (
                <li key={ii} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--brass)", flexShrink: 0, marginTop: 2 }}>✦</span>
                  <span style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--parchment)" }}>
                    {parseBold(item)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // paragraph
        return (
          <p key={bi} style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--parchment)", margin: 0 }}>
            {parseBold(block.text ?? "")}
          </p>
        );
      })}
    </div>
  );
}
