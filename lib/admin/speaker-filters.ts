import type { SpeakerSubmissionRow } from "@/lib/admin/types";

/**
 * What "the current view" means for speaker pitches, in one place — the same
 * contract the registrations and Get Involved tables use.
 *
 * The filter that matters here is not status. A pitch has a lifecycle that runs
 * past `accepted`: it is reviewed, decided, and then — if accepted — promoted
 * into the Speakers CMS, which is what puts a page on the public site. Only
 * after that is anyone finished with it.
 *
 * The table did not model that, so every row looked like work. A pitch accepted
 * in July and live on the site for weeks sat in the queue looking exactly like
 * one that arrived this morning, and the only place the difference showed was
 * inside the drawer. With a season's submissions in one undifferentiated list,
 * "busy and confusing" is the correct reading of it.
 *
 * So the axis is work remaining, not status.
 */
export type SpeakerStage = "open" | "done" | "all";

export interface SpeakerFilters {
  /** Free text across name, email, company and session title. */
  q: string;
  /** One track, or "" for all of them. */
  track: string;
  stage: SpeakerStage;
}

/**
 * Still undecided.
 *
 * Status only, deliberately. This first read `accepted && !promotedSpeakerId`
 * as "accepted but not yet on the site", which was wrong: `promotedSpeakerId`
 * records that a speaker document was *created from this pitch* by the Add to
 * Speakers button, and that button has never been used — it is null on all 29
 * submissions, while all 36 speakers were entered by hand in the CMS. So the
 * field is provenance, not state, and reading it as state made every accepted
 * pitch look outstanding, including people who have had a page on the site for
 * weeks.
 *
 * Whether a speaker page exists is not knowable from this collection, and the
 * names do not reliably join: `Jen Fite` is `Jennifer Fite, Ph.D.` on the site,
 * `Dirce E. Hernandez` is `Dirce Hernandez`, `Yossil Eliaz` is `Yossi Eliaz`.
 * Any matching rule tight enough to avoid a false claim misses those three, and
 * one loose enough to catch them will eventually merge two different people. A
 * queue should not guess, so it no longer says anything about the site.
 */
export function isOpen(r: SpeakerSubmissionRow): boolean {
  return r.status === "new" || r.status === "reviewing";
}

export const EMPTY_SPEAKER_FILTERS: SpeakerFilters = {
  q: "",
  track: "",
  stage: "open",
};

interface ParamSource {
  get(key: string): string | null;
}

export function parseSpeakerFilters(src: ParamSource): SpeakerFilters {
  const stage = src.get("stage");
  return {
    q: src.get("q") ?? "",
    track: src.get("track") ?? "",
    // `open` is the default rather than `all`, so a bare `/admin/speakers` is
    // the work list. The export route parses the same way, which is what keeps
    // a no-params export agreeing with a no-params table.
    stage: stage === "done" || stage === "all" ? stage : "open",
  };
}

export function speakerSearchParams(f: SpeakerFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.track) p.set("track", f.track);
  if (f.stage !== "open") p.set("stage", f.stage);
  return p;
}

export function isSpeakerFiltered(f: SpeakerFilters): boolean {
  return f.q !== "" || f.track !== "" || f.stage !== "all";
}

export function applySpeakerFilters(
  rows: SpeakerSubmissionRow[],
  f: SpeakerFilters,
): SpeakerSubmissionRow[] {
  let list = rows;
  if (f.stage === "open") list = list.filter(isOpen);
  else if (f.stage === "done") list = list.filter((r) => !isOpen(r));
  if (f.track) list = list.filter((r) => r.track === f.track);

  const q = f.q.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) =>
    [r.name, r.email, r.company, r.sessionTitle]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q)),
  );
}

/** Counts for the stage chips — of the whole set, not the current view. */
export function stageCounts(rows: SpeakerSubmissionRow[]) {
  const open = rows.filter(isOpen).length;
  return { open, done: rows.length - open, all: rows.length };
}
