import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

const OWNER_COOKIE = "kx_owner";

/**
 * Upsert the Prisma `User` row keyed by Supabase auth uid. Idempotent — safe
 * to call on every authenticated request. Keeps email in sync.
 */
export async function upsertUser(user: SessionUser): Promise<void> {
  await db.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email },
    update: { email: user.email },
  });
}

/**
 * One-time chart claiming: attach every Chart carrying `ownerToken` to this
 * user's `userId`, then signal the caller to clear the cookie.
 *
 * Ownership is enforced entirely in server code (RLS is off; the service key
 * bypasses it), so this UPDATE is the authoritative claim. Returns the number
 * of charts claimed.
 */
export async function claimChartsForToken(
  userId: string,
  ownerToken: string,
): Promise<number> {
  if (!ownerToken) return 0;
  const { count } = await db.chart.updateMany({
    where: { ownerToken, userId: null },
    data: { userId },
  });
  return count;
}

export { OWNER_COOKIE };
