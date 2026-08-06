"use client";

import { useActionState } from "react";
import type { EventFormState } from "@/app/actions/events";
import type { Event } from "@/lib/data/events";

const NOTIFY_OPTIONS = [
  { value: 0, label: "予定時刻ちょうど" },
  { value: 10, label: "10分前" },
  { value: 30, label: "30分前" },
  { value: 60, label: "1時間前" },
  { value: 1440, label: "1日前" },
];

function getJstParts(iso: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  ) as Record<"year" | "month" | "day" | "hour" | "minute", string>;
  // Some runtimes render midnight as "24" under hour12: false.
  if (parts.hour === "24") parts.hour = "00";
  return parts;
}

function toDateInputValue(iso: string) {
  const { year, month, day } = getJstParts(iso);
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(iso: string) {
  const { hour, minute } = getJstParts(iso);
  return `${hour}:${minute}`;
}

export function EventForm({
  action,
  defaultEvent,
  submitLabel,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  defaultEvent?: Event;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultEvent?.title}
          placeholder="例）歯医者の予約"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="date" className="mb-1 block text-sm font-medium">
            日付 <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultEvent ? toDateInputValue(defaultEvent.start_at) : undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="time" className="mb-1 block text-sm font-medium">
            時刻 <span className="text-red-500">*</span>
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            defaultValue={defaultEvent ? toTimeInputValue(defaultEvent.start_at) : undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notify_minutes_before" className="mb-1 block text-sm font-medium">
          通知タイミング
        </label>
        <select
          id="notify_minutes_before"
          name="notify_minutes_before"
          defaultValue={defaultEvent?.notify_minutes_before ?? 30}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
        >
          {NOTIFY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          メモ
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultEvent?.description ?? ""}
          placeholder="詳細があれば入力してください"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {pending ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
