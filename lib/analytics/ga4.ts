import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { EVENT_DAYS } from "@/lib/event";
import {
  RANGE_KEYS,
  type Metric,
  type RangeKey,
  type WebAnalytics,
} from "@/lib/analytics/types";

export * from "@/lib/analytics/types";

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

/**
 * The windows the dashboard offers.
 *
 * `event` is the reason this is a union rather than a day count. After the
 * first week of October, "the last 30 days" stops being the question anybody
 * asks — every report, recap and sponsor conversation is about the five days
 * of the week itself, and a rolling window cannot express a fixed one. It is
 * pinned to `EVENT_DAYS` so it cannot drift from the schedule.
 */
export function parseRangeKey(value: string | undefined): RangeKey {
  return (RANGE_KEYS as readonly string[]).includes(value ?? "")
    ? (value as RangeKey)
    : "30";
}

const EVENT_START = EVENT_DAYS[0].iso;
const EVENT_END = EVENT_DAYS[EVENT_DAYS.length - 1].iso;

interface ResolvedRange {
  current: { startDate: string; endDate: string };
  prior: { startDate: string; endDate: string };
  /** What the window is, for the card corner. */
  label: string;
  /** What the deltas are measured against, which nothing on screen said. */
  comparison: string;
  /** Epoch bounds, so registrations can be counted over the same window. */
  startMs: number;
  endMs: number;
}

function dayBefore(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function resolveRange(key: RangeKey): ResolvedRange {
  if (key === "event") {
    const span = EVENT_DAYS.length;
    return {
      current: { startDate: EVENT_START, endDate: EVENT_END },
      prior: {
        startDate: dayBefore(EVENT_START, span),
        endDate: dayBefore(EVENT_START, 1),
      },
      label: "Event week",
      comparison: `vs. the ${span} days before`,
      startMs: new Date(`${EVENT_START}T00:00:00`).getTime(),
      endMs: new Date(`${EVENT_END}T23:59:59.999`).getTime(),
    };
  }
  const days = Number(key) as RangeDays;
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return {
    current: { startDate: `${days - 1}daysAgo`, endDate: "today" },
    prior: { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` },
    label: `Last ${days} days`,
    comparison: `vs. previous ${days} days`,
    startMs: new Date(start.toISOString().slice(0, 10) + "T00:00:00").getTime(),
    endMs: end.getTime(),
  };
}

function serviceAccount(): {
  client_email: string;
  private_key: string;
} | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
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
 * Sources that are machines wearing a newsletter's clothes.
 *
 * `Tffxebz` arrived as the sixth-largest referrer at 67 sessions, and it is not
 * a referrer at all — it is `Geekdom` with every character shifted. The same
 * cipher runs through the campaign name it carries: `FZBVY_DBZCBVTA` is
 * `EMAIL_CAMPAIGN`, and shifting its digits back by three gives
 * `2026_08_14_11_16` and `2026_07_06_02_25_COPY_01`, both of which are real
 * Geekdom Mailchimp campaigns present in this same property under the correct
 * source. Something between the newsletter and the browser — an email security
 * gateway rewriting links — is scrambling the UTM parameters on the way
 * through.
 *
 * Excluded rather than re-attributed to Geekdom, because the sessions are not
 * people. Every one of the 69 `session_start` events is accompanied by a
 * `first_visit`: a hundred per cent brand-new visitors, where the genuine
 * Geekdom traffic beside it is 58%. They last fourteen seconds, view one page,
 * never convert, are all Chrome, and come from Moses Lake, Des Moines, San Jose
 * and Phoenix — data-centre towns. That is a link scanner opening every URL in
 * the mail, and folding it into Geekdom would have overstated the newsletter by
 * nineteen per cent.
 *
 * Filtered here rather than in GA4 because a property data filter only applies
 * to hits collected after it is switched on, exactly like the `/admin`
 * exclusion below. Doing it in the query fixes the history too. Worth adding
 * the GA4-side filter as well, so the numbers agree with the GA interface.
 */
const BOT_SOURCES = ["Tffxebz"];

const BOT_FILTER = {
  notExpression: {
    filter: {
      fieldName: "sessionSource",
      inListFilter: { values: BOT_SOURCES },
    },
  },
};

/**
 * Web-analytics snapshot for the given window: topline metrics with prior-period
 * comparison, a sessions-by-day trend, and top channels + pages. Returns null
 * when GA4 isn't configured or the API call fails.
 */
export async function getWebAnalytics(
  rangeKey: RangeKey = "30",
): Promise<WebAnalytics | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) return null;
  const analytics = getClient();
  if (!analytics) return null;

  const property = `properties/${propertyId}`;
  const notBots = BOT_FILTER;
  const range = resolveRange(rangeKey);
  const { current, prior } = range;
  const metricNames = [
    { name: "sessions" },
    { name: "totalUsers" },
    { name: "screenPageViews" },
    { name: "engagementRate" },
    { name: "averageSessionDuration" },
  ];

  try {
    const [[summary], [series], [channelRes], [pageRes], [refRes], [devRes]] =
      await Promise.all([
        analytics.runReport({
          property,
          dateRanges: [current, prior],
          metrics: metricNames,
          dimensionFilter: notBots,
        }),
        analytics.runReport({
          property,
          dateRanges: [current],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          dimensionFilter: notBots,
        }),
        analytics.runReport({
          property,
          dateRanges: [current],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          // All of them. There are eight and they sum to every session, so a
          // top six was not a ranking, it was a composition with two slices
          // quietly missing — one of which is AI Assistant, the arrival of
          // which is exactly the sort of thing a 2026 recap wants to notice.
          limit: 25,
          dimensionFilter: notBots,
        }),
        analytics.runReport({
          property,
          dateRanges: [current],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          // The portal is not one of the site's pages. `<SiteAnalytics>` stopped
          // sending from `/admin`, but that only applies to hits made after it
          // deployed — GA keeps everything it already collected, and the team's
          // own build-week clicking sat near the top of this list at 195 views.
          // Excluding it here fixes the history too, and it has to be excluded
          // in the query rather than dropped from the rows afterwards, or the
          // limit below would come back one row short.
          dimensionFilter: {
            andGroup: {
              expressions: [
                notBots,
                {
                  notExpression: {
                    filter: {
                      fieldName: "pagePath",
                      stringFilter: {
                        matchType: "BEGINS_WITH",
                        value: "/admin",
                      },
                    },
                  },
                },
              ],
            },
          },
          // Every page, not a top six. The site is mostly slug pages — 32
          // session pages and 34 speaker pages against nine fixed routes — and
          // a top-six list cannot represent them: individually each session
          // page draws 25-76 views so none of them ever places, while together
          // they draw 620, more than the `/schedule` index they hang off. The
          // card groups them (see `PagesBreakdown`), which it can only do if it
          // is given the whole list. 87 paths today; 500 is the ceiling in one
          // request, and GA charges the same for a wide row set as a narrow one.
          limit: 500,
        }),
        // Two more dimensions, because a single tabbed card can hold them where
        // two side-by-side cards could not. Referrer answers "who sent them",
        // device answers "what were they on" — both are questions a recap gets
        // asked and neither was available anywhere.
        analytics.runReport({
          property,
          dateRanges: [current],
          dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          // Forty sources, and the raw dimension splits single referrers across
          // several of them — `Geekdom` and `geekdom.com` are one partner worth
          // 381 sessions, reported as 347 and 34 with the smaller half below
          // the fold. `groupSources` rejoins them, and can only do that if it
          // is handed the tail as well as the head.
          limit: 500,
          dimensionFilter: notBots,
        }),
        analytics.runReport({
          property,
          dateRanges: [current],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 10,
          dimensionFilter: notBots,
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
      return {
        iso,
        label,
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      };
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

    const simple = (rows: typeof channelRes.rows) =>
      (rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || "Unassigned",
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      }));

    return {
      label: range.label,
      comparison: range.comparison,
      startMs: range.startMs,
      endMs: range.endMs,
      sessions: metric(0),
      users: metric(1),
      pageViews: metric(2),
      engagementRate: metric(3),
      avgSessionDuration: n(cur, 4),
      byDay,
      channels,
      topPages,
      referrers: (refRes.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || "Unassigned",
        medium: row.dimensionValues?.[1]?.value || "",
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      })),
      devices: simple(devRes.rows),
    };
  } catch (err) {
    console.error("GA4 report failed:", err);
    return null;
  }
}
