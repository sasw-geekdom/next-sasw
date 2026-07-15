import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSpeakerSubmissions } from "@/lib/admin/queries";
import { SpeakersTable } from "@/components/admin/speakers-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Speakers" };

// Always fresh — submissions arrive continuously.
export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  await requireAdmin();
  const rows = await listSpeakerSubmissions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Speaker pitches"
        description="Session pitches from Plug In. Move them through the queue."
      />
      <SpeakersTable rows={rows} />
    </div>
  );
}
