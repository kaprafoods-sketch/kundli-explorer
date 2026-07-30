// ── OpenRouter LLM client ───────────────────────────────────────────────────
// OpenRouter (https://openrouter.ai) is an OpenAI-compatible gateway that fronts
// many models behind one API + key. We talk to it directly over fetch/SSE so no
// extra SDK dependency is needed and streaming works in the Node runtime.
//
// Config (see .env.example):
//   OPENROUTER_API_KEY   — required for the GRAHA AI tutor to work.
//   OPENROUTER_MODEL     — model slug, e.g. "openai/gpt-4o-mini". Overridable
//                          per deployment; falls back to a safe default below.
//   OPENROUTER_SITE_URL  — optional, sent as HTTP-Referer for OpenRouter's
//                          app-ranking attribution.

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Default model — override with OPENROUTER_MODEL. Kept as a widely-available,
// inexpensive default so the tutor works out of the box once a key is set.
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

export function hasOpenRouterKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim();
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

/**
 * Stream a chat completion from OpenRouter, yielding text deltas as they arrive.
 * Throws if the key is missing or the upstream returns a non-2xx response — the
 * caller is expected to translate that into a labeled HTTP error.
 */
export async function* streamChatTokens(
  messages: ChatMessage[],
  opts: StreamOptions = {},
): AsyncGenerator<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
      "X-Title": "GRAHA AI",
    },
    body: JSON.stringify({
      model: opts.model ?? OPENROUTER_MODEL,
      messages,
      stream: true,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are newline-delimited; keep the trailing partial line buffered.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      // OpenRouter emits ": ..." comment lines as keep-alives — skip anything
      // that isn't a data frame.
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        // Ignore unparseable/partial frames — the next chunk completes them.
      }
    }
  }
}
