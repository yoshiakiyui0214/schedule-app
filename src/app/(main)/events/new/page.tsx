import { EventForm } from "@/components/EventForm";
import { createEvent } from "@/app/actions/events";

export default function NewEventPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">予定を登録</h1>
      <EventForm action={createEvent} submitLabel="登録する" />
    </div>
  );
}
