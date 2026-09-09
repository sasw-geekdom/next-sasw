import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations, listSpeakerNames } from "@/lib/admin/queries";
import { CheckinPortal } from "@/components/admin/checkin-portal";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Check-in" };

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const [rows, speakers, { q }] = await Promise.all([
    listRegistrations(),
    listSpeakerNames(),
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Check-in"
        description="Search a name. Tap to check them in. Not on the list? Add them at the door."
      />
      <CheckinPortal rows={rows} speakers={speakers} initialQuery={q ?? ""} />
    </div>
  );
}
