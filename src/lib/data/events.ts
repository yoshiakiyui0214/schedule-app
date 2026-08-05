import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Event = Tables<"events">;

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTodayEvents(): Promise<Event[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", startOfDay.toISOString())
    .lt("start_at", endOfDay.toISOString())
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
