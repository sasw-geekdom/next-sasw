import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { RegistrationsTable } from "@/components/admin/registrations-table";

export const metadata: Metadata = { title: "Registrations" };

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  await requireAdmin();
  const rows = await listRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading font-bold">Registrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone on the list. Search, count, export.
        </p>
      </div>
      <RegistrationsTable rows={rows} />
    </div>
  );
}
