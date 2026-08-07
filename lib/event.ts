// San Antonio Startup + Tech Week — event dates. Single source of truth for the
// five-day window (Sept 28 – Oct 2, 2026). Shared by check-in and (later) the
// public schedule.

/**
 * The canonical origin, with no trailing slash.
 *
 * One constant because this was hardcoded in seven files — canonical tags,
 * OG urls, robots, the sitemap, the .ics feed and two email templates — and
 * every one of them said `https://sasw.co` while Vercel serves `www` as the
 * primary domain. So every canonical, every sitemap entry and every link in
 * an outgoing email pointed at a URL that immediately 308s. Search engines
 * follow it, but it asks them to index an address that redirects.
 *
 * `www` because that's what production actually answers on today. If the
 * apex is preferred instead, flip Vercel's primary domain and change this one
 * line — the point is that the two agree, not which one wins.
 */
export const SITE_URL = "https://www.sasw.co";

export interface EventDay {
  iso: string; // YYYY-MM-DD (local)
  label: string; // "Sep 28"
}

export const EVENT_DAYS: EventDay[] = [
  { iso: "2026-09-28", label: "Sep 28" },
  { iso: "2026-09-29", label: "Sep 29" },
  { iso: "2026-09-30", label: "Sep 30" },
  { iso: "2026-10-01", label: "Oct 1" },
  { iso: "2026-10-02", label: "Oct 2" },
];

/** Local YYYY-MM-DD for an epoch-ms timestamp. */
export function localDayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
