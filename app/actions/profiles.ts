"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import type { ChartRow } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";

const COOKIE = "kx_owner";

async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

/**
 * Identity used to scope chart ownership. A signed-in user owns charts by
 * `userId`; an anonymous visitor owns charts by their `kx_owner` token. Both
 * are enforced server-side (RLS is off; the service key bypasses it).
 */
async function getOwnership(): Promise<{ userId: string | null; token: string | null }> {
  const [{ user }, token] = await Promise.all([getSession(), getToken()]);
  return { userId: user?.id ?? null, token };
}

/** True if the given chart row belongs to the current caller. */
function ownsRow(
  row: { ownerToken?: string | null; userId?: string | null },
  ownership: { userId: string | null; token: string | null },
): boolean {
  if (ownership.userId && row.userId === ownership.userId) return true;
  if (ownership.token && row.ownerToken === ownership.token) return true;
  return false;
}

export async function listMyProfiles(): Promise<ChartRow[]> {
  const { userId, token } = await getOwnership();
  if (!userId && !token) return [];

  const cols =
    "id, name, dob, lat, lon, tz, ayanamsha, data, createdAt, ownerToken, relation, interests, depth, intentNote";

  // Match charts owned either by the signed-in user or by the anon token.
  const orParts: string[] = [];
  if (userId) orParts.push(`userId.eq.${userId}`);
  if (token) orParts.push(`ownerToken.eq.${token}`);

  const { data, error } = await supabase
    .from("Chart")
    .select(cols)
    .or(orParts.join(","))
    .order("createdAt", { ascending: false });

  if (error) return [];
  return (data ?? []) as ChartRow[];
}

export async function renameProfile(id: string, name: string, relation: string) {
  const ownership = await getOwnership();
  if (!ownership.userId && !ownership.token) throw new Error("No session");

  const { data: row } = await supabase
    .from("Chart")
    .select("ownerToken, userId")
    .eq("id", id)
    .single();

  if (!row || !ownsRow(row, ownership)) throw new Error("Not authorized");

  const { error } = await supabase
    .from("Chart")
    .update({ name: name.trim(), relation: relation.trim() || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteProfile(id: string) {
  const ownership = await getOwnership();
  if (!ownership.userId && !ownership.token) throw new Error("No session");

  const { data: row } = await supabase
    .from("Chart")
    .select("ownerToken, userId")
    .eq("id", id)
    .single();

  if (!row || !ownsRow(row, ownership)) throw new Error("Not authorized");

  const { error } = await supabase
    .from("Chart")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
