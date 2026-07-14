import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { RegistrationsTable } from "@/components/admin/registrations-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Registrations" };

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  await requireAdmin();
  const rows = await listRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registrations"
        description="Everyone on the list. Search, count, export."
      />
      <RegistrationsTable rows={rows} />
    </div>
  );
}
