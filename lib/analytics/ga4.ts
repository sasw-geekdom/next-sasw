import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface TopPage {
  path: string;
  title: string;
  views: number;
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

/**
 * Top pages by views over the last 28 days.
 * Returns null when GA4 isn't configured or the API call fails — the dashboard
 * renders a setup state instead of erroring.
 */
export async function getTopPages(limit = 4): Promise<TopPage[] | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) return null; // not configured — skip constructing a client
  const analytics = getClient();
  if (!analytics) return null;

  try {
    const [report] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });

    return (report.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      title: row.dimensionValues?.[1]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  } catch (err) {
    console.error("GA4 report failed:", err);
    return null;
  }
}
