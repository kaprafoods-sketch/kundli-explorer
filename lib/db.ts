import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function makePrismaClient() {
  // DATABASE_URL = pooled PgBouncer URL (port 6543) — publicly reachable from Vercel.
  // DIRECT_URL (port 5432) is only accessible from Supabase's own network, not serverless.
  const connStr = process.env.DATABASE_URL!;
  const pool = new Pool({
    connectionString: connStr,
    ssl: connStr.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db =
  process.env.NODE_ENV === "production"
    ? makePrismaClient()
    : (global.__prisma ??= makePrismaClient());
