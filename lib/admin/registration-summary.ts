import type { RegistrationRow } from "@/lib/admin/types";
import {
  applyFilters,
  EMPTY_FILTERS,
  type RegistrationFilters,
} from "@/lib/admin/registration-filters";

export interface SummaryStat {
  label: string;
  value: number;
  /**
   * What pressing this card turns on. `null` is the "everything" card, which
   * clears instead — it is the only one that is not a filter.
   */
  patch: Partial<RegistrationFilters> | null;
}

export interface RegistrationSummary {
  stats: SummaryStat[];
  /** The three largest `describesYou` values, with their share of the whole. */
  top: { label: string; share: number }[];
  /**
   * Registered vs actually attended. Null until somebody has checked in, which
   * is also the point at which it becomes the number every sponsor
   * conversation next year opens with.
   */
  attendance: number | null;
  /**
   * Out-of-town share, off `saTenure`. ZIP is collected on every registration
   * too, but tenure is the field that answers the question a venue or hotel
   * sponsor asks: how many of these people travelled.
   */
  visiting: number;
}

/**
 * The overview numbers — which are also the filters.
 *
 * These used to be a read-only strip sitting above a row of filter chips that
 * showed the same counts: `First-timers 189` was on a card and on a chip, two
 * surfaces publishing one fact, and the page paid for it with a permanent
 * second row of controls. The cards were already the right place — they carry
 * the count, they read as the overview, they are the first thing on the page —
 * so they became the control instead of duplicating one.
 *
 * Counts stay unfiltered on purpose. A card says how many of these exist, not
 * how many survive the current filter; that is what the count line beside the
 * search is for. A strip that moved as you filtered would stop being the thing
 * you filter *against*.
 *
 * Computed outside a component because `Date.now()` is impure and React's
 * purity rule is right to object to it during render.
 */
export function summarizeRegistrations(
  rows: RegistrationRow[],
): RegistrationSummary {
  const total = rows.length;
  const n = (f: Partial<RegistrationFilters>) =>
    applyFilters(rows, { ...EMPTY_FILTERS, ...f }).length;

  const stats: SummaryStat[] = [
    { label: "Registered", value: total, patch: null },
    {
      label: "New this week",
      value: n({ recent: "week" }),
      patch: { recent: "week" },
    },
    {
      label: "First-timers",
      value: n({ first: "yes" }),
      patch: { first: "yes" },
    },
    {
      label: "Volunteers",
      value: n({ volunteer: "yes" }),
      patch: { volunteer: "yes" },
    },
    {
      label: "Sponsor consent",
      value: n({ consent: "yes" }),
      patch: { consent: "yes" },
    },
  ];

  // Only once check-in has started. Before the 28th this is 0 on every card,
  // which is noise rather than a metric.
  const checkedIn = n({ checkedIn: "yes" });
  if (checkedIn > 0) {
    stats.push({
      label: "Checked in",
      value: checkedIn,
      patch: { checkedIn: "yes" },
    });
  }

  // The three biggest answers to "who is coming", which is the one aggregate
  // the table could never show: `describesYou` has fifteen values and none of
  // them was visible anywhere in the UI.
  const segments = new Map<string, number>();
  for (const r of rows) {
    if (!r.describesYou) continue;
    segments.set(r.describesYou, (segments.get(r.describesYou) ?? 0) + 1);
  }
  const top = [...segments.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({
      label,
      share: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  return {
    stats,
    top,
    attendance: checkedIn > 0 ? Math.round((checkedIn / total) * 100) : null,
    visiting: rows.filter((r) => r.saTenure === "Just visiting").length,
  };
}
