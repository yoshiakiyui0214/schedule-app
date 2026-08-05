import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendPushNotification } from "@/lib/push";

export const maxDuration = 60;

// 遅延起動などで通知タイミングを大きく過ぎたイベントは通知しない猶予期間
const MAX_STALE_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  const fetchWindowStart = new Date(now.getTime() - MAX_STALE_MS).toISOString();
  const fetchWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabase
    .from("events")
    .select("*")
    .is("notified_at", null)
    .eq("is_completed", false)
    .gte("start_at", fetchWindowStart)
    .lte("start_at", fetchWindowEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueEvents = (candidates ?? []).filter((event) => {
    const notifyAt = new Date(event.start_at).getTime() - event.notify_minutes_before * 60_000;
    return notifyAt <= now.getTime();
  });

  let notified = 0;
  let removedSubscriptions = 0;

  for (const event of dueEvents) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", event.user_id);

    if (subscriptions && subscriptions.length > 0) {
      const results = await Promise.all(
        subscriptions.map((sub) =>
          sendPushNotification(sub, {
            title: `リマインド: ${event.title}`,
            body: `${formatDateTime(event.start_at)} の予定です`,
            url: `/events/${event.id}`,
          })
        )
      );

      const expiredEndpoints = results.filter((r) => r.expired).map((r) => r.endpoint);
      if (expiredEndpoints.length > 0) {
        await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
        removedSubscriptions += expiredEndpoints.length;
      }
    }

    await supabase
      .from("events")
      .update({ notified_at: now.toISOString() })
      .eq("id", event.id);
    notified += 1;
  }

  return NextResponse.json({ checked: dueEvents.length, notified, removedSubscriptions });
}
