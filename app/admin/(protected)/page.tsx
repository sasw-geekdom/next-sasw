import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { getWebAnalytics, RANGE_OPTIONS, type RangeDays } from "@/lib/analytics/ga4";
import { PageHeader } from "@/components/admin/page-header";
import { WebAnalytics } from "@/components/admin/dashboard/web-analytics";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireAdmin();
  const { range } = await searchParams;
  const rangeDays: RangeDays = RANGE_OPTIONS.includes(Number(range) as RangeDays)
    ? (Number(range) as RangeDays)
    : 30;

  const [analytics, registrations] = await Promise.all([
    getWebAnalytics(rangeDays),
    listRegistrations(),
  ]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = registrations.filter((r) => r.createdAt >= weekAgo).length;
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Sept 28 – Oct 2 · Year 11. The current's live."
      />

      <WebAnalytics data={analytics} range={rangeDays} />

      <section>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide">
          Registrations
        </h2>
        <div className="grid max-w-md grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="font-display text-4xl font-bold tabular-nums">
              {registrations.length}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              Total registered
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="font-display text-4xl font-bold tabular-nums">
              {newThisWeek}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              New this week
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
