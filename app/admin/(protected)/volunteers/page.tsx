import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listVolunteers } from "@/lib/admin/queries";
import { VolunteersTable } from "@/components/admin/volunteers-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Volunteers" };
export const dynamic = "force-dynamic";

export default async function VolunteersPage() {
  await requireAdmin();
  const rows = await listVolunteers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Volunteers"
        description="Everyone who signed up to help through Plug In."
      />
      <VolunteersTable rows={rows} />
    </div>
  );
}
