import type { RegistrationRow } from "@/lib/admin/types";

/**
 * What "the current view" means, in one place.
 *
 * The table filters in the browser and the CSV route filters on the server, and
 * before this they did not agree at all: `/api/admin/registrations/export`
 * called `listRegistrations()` and returned every row, so narrowing to the 63
 * volunteers on screen and hitting Export handed back all 274. Filtering was
 * not worth doing, which is most of why the page felt like a list to scroll
 * rather than a tool to ask questions with.
 *
 * So the shape of a filter, how it is read off a URL, and what it does to a row
 * all live here, and both sides import them. The URL is the contract between
 * them — the export link is built from exactly the params the table put there.
 */
export interface RegistrationFilters {
  /** Free text across name, email, company, role and ZIP. */
  q: string;
  /**
   * The tag dimensions, independent rather than one exclusive "view".
   *
   * They were a three-way `view` — all / volunteers / consent — which was a
   * modelling artifact of the segmented control that displayed them. Nothing
   * about the data makes them exclusive: a registration can be both, and 41 of
   * them are. Now that each is a card you can press, picking one while the
   * other was on would have silently cleared it with nothing on screen to say
   * so, so they became what they always were.
   */
  volunteer: "" | "yes";
  consent: "" | "yes";
  /** Signed up in the last seven days. */
  recent: "" | "week";
  /** `describesYou`, matched whole. */
  segment: string;
  /** `saTenure`, matched whole. */
  tenure: string;
  first: "" | "yes" | "no";
  checkedIn: "" | "yes" | "no";
}

export const EMPTY_FILTERS: RegistrationFilters = {
  q: "",
  volunteer: "",
  consent: "",
  recent: "",
  segment: "",
  tenure: "",
  first: "",
  checkedIn: "",
};

/** Accepts both `URLSearchParams` and Next's `searchParams` prop shape. */
type ParamSource =
  URLSearchParams | Record<string, string | string[] | undefined>;

function read(src: ParamSource, key: string): string {
  const v = src instanceof URLSearchParams ? src.get(key) : src[key];
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function parseFilters(src: ParamSource): RegistrationFilters {
  return {
    q: read(src, "q"),
    volunteer: oneOf(read(src, "volunteer"), ["", "yes"] as const, ""),
    consent: oneOf(read(src, "consent"), ["", "yes"] as const, ""),
    recent: oneOf(read(src, "recent"), ["", "week"] as const, ""),
    segment: read(src, "segment"),
    tenure: read(src, "tenure"),
    first: oneOf(read(src, "first"), ["", "yes", "no"] as const, ""),
    checkedIn: oneOf(read(src, "checkedIn"), ["", "yes", "no"] as const, ""),
  };
}

/**
 * Only what is set, so a default view leaves the URL clean and the Export link
 * is a bare path — which is also what makes `isFiltered` a cheap check.
 */
export function toSearchParams(f: RegistrationFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.volunteer) p.set("volunteer", f.volunteer);
  if (f.consent) p.set("consent", f.consent);
  if (f.recent) p.set("recent", f.recent);
  if (f.segment) p.set("segment", f.segment);
  if (f.tenure) p.set("tenure", f.tenure);
  if (f.first) p.set("first", f.first);
  if (f.checkedIn) p.set("checkedIn", f.checkedIn);
  return p;
}

export function isFiltered(f: RegistrationFilters): boolean {
  return toSearchParams(f).toString().length > 0;
}

export function applyFilters(
  rows: RegistrationRow[],
  f: RegistrationFilters,
): RegistrationRow[] {
  let list = rows;
  if (f.volunteer) list = list.filter((r) => r.volunteerInterested);
  if (f.consent) list = list.filter((r) => r.sponsorConsent);
  if (f.recent) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    list = list.filter((r) => r.createdAt >= weekAgo);
  }
  if (f.segment) list = list.filter((r) => r.describesYou === f.segment);
  if (f.tenure) list = list.filter((r) => r.saTenure === f.tenure);
  if (f.first) list = list.filter((r) => !!r.firstTime === (f.first === "yes"));
  if (f.checkedIn)
    list = list.filter((r) => !!r.checkedIn === (f.checkedIn === "yes"));

  const q = f.q.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) =>
    [r.name, r.email, r.company, r.role, r.zip]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q)),
  );
}

/**
 * The values a facet offers, with counts, taken from the rows themselves rather
 * than from a hardcoded list — `describesYou` is a form field that has already
 * grown to fifteen values and will grow again, and a facet that has to be
 * edited when the form changes is a facet that goes stale.
 *
 * Counted against the rows left after *every other* filter, which is what makes
 * the numbers usable: with "Volunteers" on, the segment counts say how many
 * volunteers are students, not how many registrations are.
 */
export function facetCounts(
  rows: RegistrationRow[],
  f: RegistrationFilters,
  key: "segment" | "tenure",
): { value: string; count: number }[] {
  const others = applyFilters(rows, { ...f, [key]: "" });
  const field = key === "segment" ? "describesYou" : "saTenure";
  const map = new Map<string, number>();
  for (const r of others) {
    const v = r[field];
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
