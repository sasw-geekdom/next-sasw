import { Users, Eye, Gauge } from "lucide-react";
import type { WebAnalytics as WebAnalyticsData } from "@/lib/analytics/ga4";
import { formatCompact, formatPercent, formatDuration } from "@/lib/format";
import { MetricCard } from "@/components/admin/dashboard/metric-card";
import { SessionsTrend } from "@/components/admin/dashboard/sessions-trend";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide">
      {children}
    </h2>
  );
}

export function WebAnalytics({ data }: { data: WebAnalyticsData | null }) {
  return (
    <section>
      <SectionLabel>Web analytics</SectionLabel>

      {data === null ? (
        <Setup />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-white p-5 lg:col-span-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Sessions
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Last {data.windowDays} days
              </span>
            </div>
            <div className="mt-1 font-display text-4xl font-bold tabular-nums">
              {formatCompact(data.sessions)}
            </div>
            <div className="mt-4">
              <SessionsTrend data={data.byDay} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <MetricCard
              icon={Users}
              label="Users"
              value={formatCompact(data.users)}
            />
            <MetricCard
              icon={Eye}
              label="Page views"
              value={formatCompact(data.pageViews)}
            />
            <MetricCard
              icon={Gauge}
              label="Engagement rate"
              value={formatPercent(data.engagementRate)}
              sub={`Avg ${formatDuration(data.avgSessionDuration)} engaged`}
            />
          </div>
        </div>
      )}
    </section>
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
