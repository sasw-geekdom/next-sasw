import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { RegistrationsTable } from "@/components/admin/registrations-table";
import { PageHeader } from "@/components/admin/page-header";
import { parseFilters } from "@/lib/admin/registration-filters";

export const metadata: Metadata = { title: "Registrations" };

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [rows, params, store] = await Promise.all([
    listRegistrations(),
    searchParams,
    cookies(),
  ]);

  // Filters come off the URL so a view is linkable and survives a refresh —
  // and so the Export route can parse the same params. The table takes it from
  // here with `history.replaceState`, which keeps filtering instant instead of
  // refetching 274 rows per keystroke.
  const filters = parseFilters(params);

  // Compact by default, and opt *out* rather than in — this is a console, and
  // the comfortable row spends 61px on a line most of whose second row is in
  // the drawer anyway. Only an explicit "comfortable" turns it off, so a first
  // visit lands on the dense view.
  const dense = store.get("admin_reg_density")?.value !== "comfortable";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registrations"
        description="Everyone on the list. Search, filter and export."
      />
      <RegistrationsTable
        rows={rows}
        initialFilters={filters}
        initialDense={dense}
      />
    </div>
  );
}
