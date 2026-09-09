import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations, listGetInvolved } from "@/lib/admin/queries";
import {
  getWebAnalytics,
  parseRangeKey,
  resolveRange,
} from "@/lib/analytics/ga4";
import { PageHeader } from "@/components/admin/page-header";
import { WebAnalytics } from "@/components/admin/dashboard/web-analytics";
import { StatCard } from "@/components/admin/ui/stat-card";
import { DashboardNotes } from "@/components/admin/dashboard/notes";
import { summarizeRegistrations } from "@/lib/admin/registration-summary";
import {
  toSearchParams,
  EMPTY_FILTERS,
} from "@/lib/admin/registration-filters";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireAdmin();
  const { range } = await searchParams;
  const rangeKey = parseRangeKey(range);

  const [analytics, registrations, inbound] = await Promise.all([
    getWebAnalytics(rangeKey),
    listRegistrations(),
    listGetInvolved(),
  ]);

  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  // The same numbers the registrations page shows, from the same function —
  // this page used to compute "new this week" itself with a `Date.now()` in
  // render, which is both a duplicate definition and the impure-render error
  // the lint has been reporting.
  const { stats, attendance, visiting } = summarizeRegistrations(registrations);

  /**
   * Signups per day, on exactly the days GA reports.
   *
   * Two things were wrong with bucketing them independently. The series only
   * held days that had a signup, so a quiet day was not plotted as zero — it
   * was dropped, and the curve compressed the gaps into a shape the data never
   * had. And the axes did not line up: GA's window ran Aug 10 – Sep 8 while
   * this one ran Aug 11 – Sep 9, so two charts stacked to be compared were a
   * day out of step with each other.
   *
   * Built off `analytics.byDay` instead, the two share an axis by construction
   * and every day is present.
   */
  const window = resolveRange(rangeKey);
  const inWindow = registrations.filter(
    (r) => r.createdAt >= window.startMs && r.createdAt <= window.endMs,
  );
  const perDay = new Map<string, number>();
  for (const r of inWindow) {
    const iso = new Date(r.createdAt).toLocaleDateString("en-CA");
    perDay.set(iso, (perDay.get(iso) ?? 0) + 1);
  }
  const signups = {
    total: inWindow.length,
    byDay: (analytics?.byDay ?? []).map((d) => ({
      iso: d.iso,
      label: d.label,
      count: perDay.get(d.iso) ?? 0,
    })),
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Sept 28 – Oct 2 · Year 11. The current's live."
      />

      {/* Registrations first, traffic second.
          The page used to open on sessions and end on a bare row of
          registration numbers, which read as an afterthought — and it had the
          order backwards. Registrations are the outcome this site exists for;
          sessions are the input that produces them. Leading with the outcome
          also gives the page a natural end: the breakdowns, which are detail. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          Registrations
        </h2>
        {/* The registrations strip, as links rather than filters — the cards
            are the same component and the same counts, but there is no table
            on this page to narrow, so pressing one should take you to the rows
            it counts with that filter already on. */}
        <div className="flex flex-wrap gap-3">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              className="min-w-[9rem] flex-1"
              label={s.label}
              value={s.value}
              href={`/admin/registrations${
                s.patch
                  ? `?${toSearchParams({ ...EMPTY_FILTERS, ...s.patch })}`
                  : ""
              }`}
            />
          ))}
        </div>
        <DashboardNotes
          rows={inbound}
          registrations={registrations}
          attendance={attendance}
          visiting={visiting}
        />
      </section>
      <WebAnalytics data={analytics} range={rangeKey} registrations={signups} />
    </div>
  );
}
