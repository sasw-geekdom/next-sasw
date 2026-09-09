import type { GetInvolvedRow } from "@/lib/admin/types";
import type { GetInvolvedPath } from "@/lib/get-involved";

/**
 * What "the current view" means for inbound submissions, in one place.
 *
 * The same contract [registration-filters](./registration-filters.ts) sets up,
 * and for the same two reasons. The table filtered in the browser while
 * `/api/admin/get-involved/export` called `listGetInvolved()` and returned
 * everything, so narrowing to the sponsor inquiries and hitting Export handed
 * back all three paths — a divergence the team would now walk into expecting
 * otherwise, having learned the opposite on the registrations page. And the
 * filter lived in component state, so a view could not be linked to.
 *
 * Deliberately much smaller than the registrations version. There are three
 * paths and nineteen rows; a facet model built for 274 rows and eight
 * dimensions would be machinery with nothing to do.
 */
export interface GetInvolvedFilters {
  /** Free text across name, email, company, role, concept and question. */
  q: string;
  /** One path, or "" for all of them. */
  path: "" | GetInvolvedPath;
  /**
   * Still needing attention — status `new` or `reviewing`.
   *
   * One toggle rather than a chip per status. Four of them would rebuild the
   * stacked filter bar the registrations page was cut back from, to answer a
   * question nobody asks: with nineteen rows and a Status column you can see
   * which are accepted by looking. What you cannot scan for is what is left,
   * and that is the number that grows as the pipeline is worked.
   */
  open: "" | "yes";
}

export const EMPTY_GET_INVOLVED_FILTERS: GetInvolvedFilters = {
  q: "",
  path: "",
  open: "",
};

/** Statuses that mean "not dealt with yet". */
export const OPEN_STATUSES = new Set(["new", "reviewing"]);

const PATHS = new Set<string>(["sponsor", "host", "general"]);

interface ParamSource {
  get(key: string): string | null;
}

export function parseGetInvolvedFilters(src: ParamSource): GetInvolvedFilters {
  const path = src.get("path") ?? "";
  return {
    q: src.get("q") ?? "",
    path: PATHS.has(path) ? (path as GetInvolvedPath) : "",
    open: src.get("open") === "yes" ? "yes" : "",
  };
}

export function getInvolvedSearchParams(
  f: GetInvolvedFilters,
): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.path) p.set("path", f.path);
  if (f.open) p.set("open", f.open);
  return p;
}

export function isGetInvolvedFiltered(f: GetInvolvedFilters): boolean {
  return f.q !== "" || f.path !== "" || f.open !== "";
}

export function applyGetInvolvedFilters(
  rows: GetInvolvedRow[],
  f: GetInvolvedFilters,
): GetInvolvedRow[] {
  let list = rows;
  if (f.path) list = list.filter((r) => r.path === f.path);
  if (f.open) list = list.filter((r) => OPEN_STATUSES.has(r.status));

  const q = f.q.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) =>
    [r.name, r.email, r.company, r.role, r.eventConcept, r.question]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q)),
  );
}
