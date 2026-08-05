import Link from "next/link";
import { getTodayEvents } from "@/lib/data/events";
import { PushNotificationManager } from "@/components/PushNotificationManager";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function formatToday() {
  return new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

export default async function HomePage() {
  const events = await getTodayEvents();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-bold">今日の予定</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatToday()}</p>
      </section>

      <PushNotificationManager />

      <section className="space-y-2">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
            今日の予定はありません
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="w-14 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatTime(event.start_at)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.title}</p>
                {event.description && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {event.description}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </section>

      <Link
        href="/events/new"
        className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        ＋ 新しい予定を登録
      </Link>
    </div>
  );
}
