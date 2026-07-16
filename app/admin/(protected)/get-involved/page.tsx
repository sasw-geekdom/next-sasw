import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listGetInvolved } from "@/lib/admin/queries";
import { GetInvolvedTable } from "@/components/admin/get-involved-table";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Get Involved" };

export const dynamic = "force-dynamic";

export default async function GetInvolvedAdminPage() {
  await requireAdmin();
  const rows = await listGetInvolved();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Get Involved"
        description="Sponsor inquiries, event hosting proposals, and general questions."
      >
        <ButtonLink
          href="/api/admin/get-involved/export"
          prefetch={false}
          variant="outline"
          size="sm"
        >
          Export CSV
        </ButtonLink>
      </PageHeader>
      <GetInvolvedTable rows={rows} />
    </div>
  );
}
