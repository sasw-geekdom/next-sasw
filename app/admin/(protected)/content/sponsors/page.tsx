import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSponsors } from "@/lib/admin/cms-queries";
import { saveSponsor, deleteSponsor } from "@/lib/admin/cms-actions";
import { LogoEntityManager } from "@/components/admin/cms/logo-entity-manager";
import { SectionHeader } from "@/components/admin/cms/section-header";

export const metadata: Metadata = { title: "Sponsors" };
export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  await requireAdmin();
  const rows = await listSponsors();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Sponsors" subtitle="Who's powering the current." />
      <LogoEntityManager
        noun="sponsor"
        rows={rows}
        saveAction={saveSponsor}
        deleteAction={deleteSponsor}
      />
    </div>
  );
}
