import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSpeakerSubmissions } from "@/lib/admin/queries";
import { SpeakersTable } from "@/components/admin/speakers-table";

export const metadata: Metadata = { title: "Speakers" };

// Always fresh — submissions arrive continuously.
export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  await requireAdmin();
  const rows = await listSpeakerSubmissions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading font-bold">Call for Speakers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submissions. Move them through the queue.
        </p>
      </div>
      <SpeakersTable rows={rows} />
    </div>
  );
}
