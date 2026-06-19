"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import type { ChartRow } from "@/lib/supabase";

const COOKIE = "kx_owner";

async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function listMyProfiles(): Promise<ChartRow[]> {
  const token = await getToken();
  if (!token) return [];

  const { data, error } = await supabase
    .from("Chart")
    .select("id, name, dob, lat, lon, tz, ayanamsha, data, createdAt, ownerToken, relation")
    .eq("ownerToken", token)
    .order("createdAt", { ascending: false });

  if (error) return [];
  return (data ?? []) as ChartRow[];
}

export async function renameProfile(id: string, name: string, relation: string) {
  const token = await getToken();
  if (!token) throw new Error("No session");

  const { data: row } = await supabase
    .from("Chart")
    .select("ownerToken")
    .eq("id", id)
    .single();

  if (!row || row.ownerToken !== token) throw new Error("Not authorized");

  const { error } = await supabase
    .from("Chart")
    .update({ name: name.trim(), relation: relation.trim() || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteProfile(id: string) {
  const token = await getToken();
  if (!token) throw new Error("No session");

  const { data: row } = await supabase
    .from("Chart")
    .select("ownerToken")
    .eq("id", id)
    .single();

  if (!row || row.ownerToken !== token) throw new Error("Not authorized");

  const { error } = await supabase
    .from("Chart")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
