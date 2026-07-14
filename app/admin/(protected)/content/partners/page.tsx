import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listPartners } from "@/lib/admin/cms-queries";
import { savePartner, deletePartner } from "@/lib/admin/cms-actions";
import { LogoEntityManager } from "@/components/admin/cms/logo-entity-manager";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireAdmin();
  const rows = await listPartners();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Partners" description="Logos, names, and links." />
      <LogoEntityManager
        noun="partner"
        rows={rows}
        saveAction={savePartner}
        deleteAction={deletePartner}
      />
    </div>
  );
}
