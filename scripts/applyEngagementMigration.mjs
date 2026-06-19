/**
 * One-off DDL for the engagement engine (Phase 0).
 * Idempotent — safe to re-run. Applies columns the Prisma schema now declares.
 * Runtime uses supabase-js, and the live tables were created outside Prisma's
 * migration history, so we apply ADD COLUMN IF NOT EXISTS directly via DIRECT_URL.
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";

// Minimal .env loader (no dotenv dependency required).
function loadEnv() {
  const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const STATEMENTS = [
  `ALTER TABLE "Chart" ADD COLUMN IF NOT EXISTS "interests" text[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE "Chart" ADD COLUMN IF NOT EXISTS "depth" text NOT NULL DEFAULT 'deep'`,
  `ALTER TABLE "Chart" ADD COLUMN IF NOT EXISTS "intentNote" text`,
  `ALTER TABLE "TutorMessage" ADD COLUMN IF NOT EXISTS "rating" text`,
  `ALTER TABLE "TutorMessage" ADD COLUMN IF NOT EXISTS "ratingReason" text`,
  `ALTER TABLE "TutorMessage" ADD COLUMN IF NOT EXISTS "useful" boolean`,
];

async function main() {
  loadEnv();
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No DIRECT_URL/DATABASE_URL in .env");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
      console.log("✓", sql);
    }
    const { rows } = await client.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_name IN ('Chart','TutorMessage')
         AND column_name IN ('interests','depth','intentNote','rating','ratingReason','useful')
       ORDER BY table_name, column_name`
    );
    console.log("\nVerified columns:");
    for (const r of rows) console.log(`  ${r.table_name}.${r.column_name}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
