import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listSessions, listSpeakers } from "@/lib/admin/cms-queries";
import { SessionManager } from "@/components/admin/cms/session-manager";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  await requireAdmin();
  const [rows, speakers] = await Promise.all([listSessions(), listSpeakers()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sessions"
        description="The schedule. Assign speakers and moderators to each."
      />
      <SessionManager rows={rows} speakers={speakers} />
    </div>
  );
}
