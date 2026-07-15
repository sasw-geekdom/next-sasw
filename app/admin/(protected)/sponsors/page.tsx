import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSponsorLeads } from "@/lib/admin/queries";
import { SponsorsTable } from "@/components/admin/sponsors-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Sponsors" };
export const dynamic = "force-dynamic";

export default async function SponsorLeadsPage() {
  await requireAdmin();
  const rows = await listSponsorLeads();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sponsors"
        description="Sponsor inquiries from Plug In. The team follows up to close the fit."
      />
      <SponsorsTable rows={rows} />
    </div>
  );
}
