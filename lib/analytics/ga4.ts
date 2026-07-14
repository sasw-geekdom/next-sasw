import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

const WINDOW_DAYS = 28;

export interface WebAnalytics {
  sessions: number;
  users: number;
  pageViews: number;
  engagementRate: number; // 0–1
  avgSessionDuration: number; // seconds
  byDay: { iso: string; label: string; sessions: number }[];
  windowDays: number;
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

/**
 * Web analytics summary + a sessions-by-day trend over the last 28 days.
 * Returns null when GA4 isn't configured or the API call fails — the dashboard
 * renders a setup state instead of erroring.
 */
export async function getWebAnalytics(): Promise<WebAnalytics | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) return null;
  const analytics = getClient();
  if (!analytics) return null;

  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: `${WINDOW_DAYS - 1}daysAgo`, endDate: "today" }];

  try {
    const [[summary], [series]] = await Promise.all([
      analytics.runReport({
        property,
        dateRanges,
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
        ],
      }),
      analytics.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const m = summary.rows?.[0]?.metricValues ?? [];
    const num = (i: number) => Number(m[i]?.value ?? 0);

    const byDay = (series.rows ?? []).map((row) => {
      const { iso, label } = parseGaDate(row.dimensionValues?.[0]?.value ?? "");
      return { iso, label, sessions: Number(row.metricValues?.[0]?.value ?? 0) };
    });

    return {
      sessions: num(0),
      users: num(1),
      pageViews: num(2),
      engagementRate: num(3),
      avgSessionDuration: num(4),
      byDay,
      windowDays: WINDOW_DAYS,
    };
  } catch (err) {
    console.error("GA4 report failed:", err);
    return null;
  }
}
