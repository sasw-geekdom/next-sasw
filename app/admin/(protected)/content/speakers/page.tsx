import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSpeakers } from "@/lib/admin/cms-queries";
import { SpeakerManager } from "@/components/admin/cms/speaker-manager";
import { SectionHeader } from "@/components/admin/cms/section-header";

export const metadata: Metadata = { title: "Speakers" };
export const dynamic = "force-dynamic";

export default async function SpeakersContentPage() {
  await requireAdmin();
  const rows = await listSpeakers();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Speakers" subtitle="The people on stage." />
      <SpeakerManager rows={rows} />
    </div>
  );
}
