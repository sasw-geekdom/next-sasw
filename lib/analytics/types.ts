/**
 * The analytics shapes, without `server-only`.
 *
 * `ga4.ts` reaches the Google API and is `server-only` for good reason, but the
 * dashboard component became a client component when its breakdowns gained
 * tabs — and a client component importing anything from that module drags the
 * whole server graph with it. The contract between them lives here instead;
 * `ga4.ts` re-exports it so callers need not know.
 */
export const RANGE_KEYS = ["7", "30", "90", "event"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export interface Metric {
  value: number;
  /** Percent change vs the prior equal-length period, or null if no prior data. */
  delta: number | null;
}

export interface WebAnalytics {
  /** What the window is and what the deltas compare against. */
  label: string;
  comparison: string;
  /** Epoch bounds of the window, so registrations can be counted over it. */
  startMs: number;
  endMs: number;
  sessions: Metric;
  users: Metric;
  pageViews: Metric;
  engagementRate: Metric; // value is 0–1
  avgSessionDuration: number; // seconds
  byDay: { iso: string; label: string; sessions: number }[];
  channels: { name: string; sessions: number; share: number }[];
  topPages: { path: string; views: number }[];
  /**
   * Source paired with its medium, because the same name can be two different
   * referrers: `google` at medium `organic` is the search engine, `google.com`
   * at medium `referral` is a link in someone's doc.
   */
  referrers: { name: string; medium: string; sessions: number }[];
  devices: { name: string; sessions: number }[];
}
