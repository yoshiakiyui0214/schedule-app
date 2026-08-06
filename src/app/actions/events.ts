"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { error?: string } | undefined;

type ParsedEvent = {
  title: string;
  description: string | null;
  start_at: string;
  notify_minutes_before: number;
};

type ParseResult = { ok: true; value: ParsedEvent } | { ok: false; error: string };

function parseEventForm(formData: FormData): ParseResult {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const notifyMinutesBefore = Number(formData.get("notify_minutes_before") ?? 30);

  if (!title) return { ok: false, error: "タイトルを入力してください。" };
  if (!date || !time) return { ok: false, error: "日時を入力してください。" };

  // The date/time inputs represent JST (Asia/Tokyo) wall-clock values regardless of
  // the server runtime's local timezone, so parse them with an explicit +09:00 offset.
  const startAt = new Date(`${date}T${time}:00+09:00`);
  if (Number.isNaN(startAt.getTime())) {
    return { ok: false, error: "日時の形式が正しくありません。" };
  }

  return {
    ok: true,
    value: {
      title,
      description: description || null,
      start_at: startAt.toISOString(),
      notify_minutes_before: Number.isFinite(notifyMinutesBefore) ? notifyMinutesBefore : 30,
    },
  };
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です。" };

  const { error } = await supabase.from("events").insert({
    ...parsed.value,
    user_id: user.id,
  });

  if (error) return { error: `保存に失敗しました: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/events");
  redirect("/events");
}

export async function updateEvent(
  id: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("events").update(parsed.value).eq("id", id);

  if (error) return { error: `更新に失敗しました: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/events");
  redirect("/events");
}
