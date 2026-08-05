import Link from "next/link";
import { getEvents, type Event } from "@/lib/data/events";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function groupByDate(events: Event[]) {
  const groups = new Map<string, Event[]>();
  for (const event of events) {
    const key = formatDate(event.start_at);
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }
  return groups;
}

export default async function EventsPage() {
  const events = await getEvents();
  const groups = groupByDate(events);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">予定一覧</h1>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
          登録されている予定はありません
        </div>
      ) : (
        [...groups.entries()].map(([date, items]) => (
          <section key={date} className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {date}
            </h2>
            {items.map((event) => (
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
            ))}
          </section>
        ))
      )}
    </div>
  );
}
