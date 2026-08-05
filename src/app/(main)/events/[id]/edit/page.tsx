import { notFound } from "next/navigation";
import { getEvent } from "@/lib/data/events";
import { updateEvent } from "@/app/actions/events";
import { EventForm } from "@/components/EventForm";

export default async function EditEventPage({ params }: PageProps<"/events/[id]/edit">) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">予定を編集</h1>
      <EventForm
        action={updateEvent.bind(null, id)}
        defaultEvent={event}
        submitLabel="更新する"
      />
    </div>
  );
}
