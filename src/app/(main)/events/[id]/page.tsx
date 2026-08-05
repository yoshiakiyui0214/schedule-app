import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/data/events";
import { DeleteEventButton } from "@/components/DeleteEventButton";

const NOTIFY_LABELS: Record<number, string> = {
  0: "予定時刻ちょうど",
  10: "10分前",
  30: "30分前",
  60: "1時間前",
  1440: "1日前",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/events" className="text-xs text-slate-500 hover:underline dark:text-slate-400">
          ← 予定一覧に戻る
        </Link>
        <h1 className="mt-2 text-xl font-bold">{event.title}</h1>
      </div>

      <dl className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">日時</dt>
          <dd className="text-right font-medium">{formatDateTime(event.start_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">通知</dt>
          <dd className="text-right font-medium">
            {NOTIFY_LABELS[event.notify_minutes_before] ?? `${event.notify_minutes_before}分前`}
          </dd>
        </div>
        {event.description && (
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
            <dt className="text-slate-500 dark:text-slate-400">メモ</dt>
            <dd className="whitespace-pre-wrap">{event.description}</dd>
          </div>
        )}
      </dl>

      <div className="space-y-2">
        <Link
          href={`/events/${event.id}/edit`}
          className="block w-full rounded-lg bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          編集する
        </Link>
        <DeleteEventButton id={event.id} />
      </div>
    </div>
  );
}
