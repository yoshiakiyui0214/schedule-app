"use client";

import { deleteEvent } from "@/app/actions/events";

export function DeleteEventButton({ id }: { id: string }) {
  return (
    <form
      action={deleteEvent.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("この予定を削除します。よろしいですか？")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        削除する
      </button>
    </form>
  );
}
