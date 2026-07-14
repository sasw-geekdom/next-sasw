import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { getWebAnalytics } from "@/lib/analytics/ga4";
import { registrationsByDay } from "@/lib/admin/metrics";
import { PageHeader } from "@/components/admin/page-header";
import { WebAnalytics } from "@/components/admin/dashboard/web-analytics";
import { RegistrationsChart } from "@/components/admin/dashboard/registrations-chart";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  const [analytics, registrations] = await Promise.all([
    getWebAnalytics(),
    listRegistrations(),
  ]);

  const byDay = registrationsByDay(
    registrations.map((r) => r.createdAt),
    14,
  );
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Sept 28 – Oct 2 · Year 11. The current's live."
      />

      <WebAnalytics data={analytics} />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            Registrations
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {registrations.length} total
          </span>
        </div>
        <RegistrationsChart data={byDay} />
      </section>
    </div>
  );
}
