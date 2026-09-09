import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listGetInvolved } from "@/lib/admin/queries";
import { GetInvolvedTable } from "@/components/admin/get-involved-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Get Involved" };

export const dynamic = "force-dynamic";

export default async function GetInvolvedAdminPage() {
  await requireAdmin();
  const rows = await listGetInvolved();

  return (
    <div className="flex flex-col gap-6">
      {/* Export moved into the table, which is the only thing that knows what
          is currently filtered — same arrangement as the registrations page. */}
      <PageHeader
        title="Get Involved"
        description="Sponsor inquiries, event hosting proposals, and general questions."
      />
      <GetInvolvedTable rows={rows} />
    </div>
  );
}
