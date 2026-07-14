import Link from "next/link";
import { Users, Eye, Gauge } from "lucide-react";
import type { WebAnalytics as WebAnalyticsData } from "@/lib/analytics/ga4";
import { RANGE_OPTIONS } from "@/lib/analytics/ga4";
import { formatCompact, formatPercent, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MetricCard, DeltaBadge } from "@/components/admin/dashboard/metric-card";
import { SessionsTrend } from "@/components/admin/dashboard/sessions-trend";

export function WebAnalytics({
  data,
  range,
}: {
  data: WebAnalyticsData | null;
  range: number;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          Web analytics
        </h2>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {RANGE_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`/admin?range=${d}`}
              scroll={false}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                range === d
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {data === null ? (
        <Setup />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-5 lg:col-span-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sessions
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Last {data.rangeDays} days
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-4xl font-bold tabular-nums">
                  {formatCompact(data.sessions.value)}
                </span>
                <DeltaBadge delta={data.sessions.delta} />
              </div>
              <div className="mt-4">
                <SessionsTrend data={data.byDay} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-4">
              <MetricCard
                icon={Users}
                label="Users"
                value={formatCompact(data.users.value)}
                delta={data.users.delta}
              />
              <MetricCard
                icon={Eye}
                label="Page views"
                value={formatCompact(data.pageViews.value)}
                delta={data.pageViews.delta}
              />
              <MetricCard
                icon={Gauge}
                label="Engagement rate"
                value={formatPercent(data.engagementRate.value)}
                delta={data.engagementRate.delta}
                sub={`Avg ${formatDuration(data.avgSessionDuration)} engaged`}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Traffic channels"
              rows={data.channels.map((c) => ({
                label: c.name,
                value: c.sessions,
              }))}
              barClass="bg-space-blue"
              emptyLabel="No sessions yet."
            />
            <Breakdown
              title="Top pages"
              rows={data.topPages.map((p) => ({
                label: p.path,
                value: p.views,
                mono: true,
              }))}
              barClass="bg-magenta"
              emptyLabel="No page views yet."
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Breakdown({
  title,
  rows,
  barClass,
  emptyLabel,
}: {
  title: string;
  rows: { label: string; value: number; mono?: boolean }[];
  barClass: string;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide">
        {title}
      </h3>
      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={r.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "truncate text-sm",
                      r.mono && "font-mono text-xs",
                    )}
                  >
                    {r.label}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {r.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", barClass)}
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Setup() {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Connect Google Analytics</p>
      <p className="mt-1 max-w-prose">
        Set <code className="font-mono text-xs">GA4_PROPERTY_ID</code>, grant the
        service account Viewer access to the property, and enable the Analytics
        Data API to see sessions, users, page views, and engagement here.
      </p>
    </div>
  );
}
