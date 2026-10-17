/**
 * instrumentation.ts — runs once at Next.js server startup (Node runtime).
 *
 * Sets GEO_TZ_DATA_PATH programmatically so geo-tz finds its timezone data
 * in every environment (dev, `next start`, Vercel serverless). Without this,
 * Turbopack mangles geo-tz's `__dirname`-based lookup into a bogus
 * `/ROOT/node_modules/...` path and every chart render crashes with ENOENT.
 * An explicitly set GEO_TZ_DATA_PATH env var still takes precedence.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.GEO_TZ_DATA_PATH) return;

  try {
    const mod = await import("node:module");
    const path = await import("node:path");
    const { pathToFileURL } = await import("node:url");

    let base: string;
    if (typeof import.meta?.url === "string") {
      base = import.meta.url;
    } else if (typeof __filename === "string") {
      base = pathToFileURL(__filename).href;
    } else {
      return;
    }

    const require = mod.createRequire(base);
    // NOTE: resolve the package entry, not "geo-tz/package.json" — the
    // package's `exports` map does not expose ./package.json.
    const entry = require.resolve("geo-tz");
    process.env.GEO_TZ_DATA_PATH = path.join(path.dirname(entry), "..", "data");
  } catch {
    // Leave unset; geo-tz will raise its own descriptive error.
  }
}
