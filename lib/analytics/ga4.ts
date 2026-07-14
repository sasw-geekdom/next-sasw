import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

export interface Metric {
  value: number;
  /** Percent change vs the prior equal-length period, or null if no prior data. */
  delta: number | null;
}

export interface WebAnalytics {
  rangeDays: number;
  sessions: Metric;
  users: Metric;
  pageViews: Metric;
  engagementRate: Metric; // value is 0–1
  avgSessionDuration: number; // seconds
  byDay: { iso: string; label: string; sessions: number }[];
  channels: { name: string; sessions: number; share: number }[];
  topPages: { path: string; views: number }[];
}

function serviceAccount(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

let client: BetaAnalyticsDataClient | null = null;
function getClient(): BetaAnalyticsDataClient | null {
  if (client) return client;
  const creds = serviceAccount();
  if (!creds) return null;
  client = new BetaAnalyticsDataClient({ credentials: creds });
  return client;
}

function parseGaDate(yyyymmdd: string): { iso: string; label: string } {
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return {
    iso: `${y}-${m}-${d}`,
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

function pctDelta(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return ((current - prior) / prior) * 100;
}

/**
 * Web-analytics snapshot for the given window: topline metrics with prior-period
 * comparison, a sessions-by-day trend, and top channels + pages. Returns null
 * when GA4 isn't configured or the API call fails.
 */
export async function getWebAnalytics(
  rangeDays: RangeDays = 30,
): Promise<WebAnalytics | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) return null;
  const analytics = getClient();
  if (!analytics) return null;

  const property = `properties/${propertyId}`;
  const current = { startDate: `${rangeDays - 1}daysAgo`, endDate: "today" };
  const prior = {
    startDate: `${rangeDays * 2 - 1}daysAgo`,
    endDate: `${rangeDays}daysAgo`,
  };
  const metricNames = [
    { name: "sessions" },
    { name: "totalUsers" },
    { name: "screenPageViews" },
    { name: "engagementRate" },
    { name: "averageSessionDuration" },
  ];

  try {
    const [[summary], [series], [channelRes], [pageRes]] = await Promise.all([
      analytics.runReport({
        property,
        dateRanges: [current, prior],
        metrics: metricNames,
      }),
      analytics.runReport({
        property,
        dateRanges: [current],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      analytics.runReport({
        property,
        dateRanges: [current],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }),
      analytics.runReport({
        property,
        dateRanges: [current],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 6,
      }),
    ]);

    // Two date ranges → GA4 tags each row with date_range_0 / date_range_1.
    const rows = summary.rows ?? [];
    const rangeRow = (i: number) =>
      rows.find((r) => r.dimensionValues?.[0]?.value === `date_range_${i}`) ??
      rows[i];
    const cur = rangeRow(0)?.metricValues ?? [];
    const prev = rangeRow(1)?.metricValues ?? [];
    const n = (m: typeof cur, i: number) => Number(m[i]?.value ?? 0);
    const metric = (i: number): Metric => ({
      value: n(cur, i),
      delta: pctDelta(n(cur, i), n(prev, i)),
    });

    const byDay = (series.rows ?? []).map((row) => {
      const { iso, label } = parseGaDate(row.dimensionValues?.[0]?.value ?? "");
      return { iso, label, sessions: Number(row.metricValues?.[0]?.value ?? 0) };
    });

    const channelRows = (channelRes.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "Unassigned",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }));
    const channelTotal = channelRows.reduce((a, c) => a + c.sessions, 0) || 1;
    const channels = channelRows.map((c) => ({
      ...c,
      share: c.sessions / channelTotal,
    }));

    const topPages = (pageRes.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    return {
      rangeDays,
      sessions: metric(0),
      users: metric(1),
      pageViews: metric(2),
      engagementRate: metric(3),
      avgSessionDuration: n(cur, 4),
      byDay,
      channels,
      topPages,
    };
  } catch (err) {
    console.error("GA4 report failed:", err);
    return null;
  }
}
