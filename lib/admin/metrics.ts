// Client-safe dashboard aggregations.

export interface DayCount {
  iso: string; // YYYY-MM-DD
  label: string; // "Sep 28"
  count: number;
}

function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Registrations bucketed by local day for the trailing `days` window. */
export function registrationsByDay(
  createdAts: number[],
  days = 14,
): DayCount[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, number>();
  const order: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    order.push(d);
    buckets.set(dayKey(d), 0);
  }

  for (const ms of createdAts) {
    if (!ms) continue;
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const key = dayKey(d);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return order.map((d) => ({
    iso: dayKey(d),
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: buckets.get(dayKey(d)) ?? 0,
  }));
}
