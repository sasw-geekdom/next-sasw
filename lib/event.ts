// San Antonio Startup + Tech Week — event dates. Single source of truth for the
// five-day window (Sept 28 – Oct 2, 2026). Shared by check-in and (later) the
// public schedule.

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
