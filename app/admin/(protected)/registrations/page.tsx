import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { RegistrationsTable } from "@/components/admin/registrations-table";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Registrations" };

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  await requireAdmin();
  const rows = await listRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registrations"
        description="Everyone on the list. Search and export."
      >
        <ButtonLink
          href="/api/admin/registrations/export"
          prefetch={false}
          variant="outline"
          size="sm"
        >
          Export CSV
        </ButtonLink>
      </PageHeader>
      <RegistrationsTable rows={rows} />
    </div>
  );
}
