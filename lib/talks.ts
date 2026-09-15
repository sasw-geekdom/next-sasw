import "server-only";

import { listSessions } from "@/lib/admin/cms-queries";
import type { SessionRow } from "@/lib/admin/cms-types";
import { ROOMS, roomSlugFromLegacy, type Room } from "@/lib/locations";

/**
 * A CMS session that stands on its own in the week, with its room resolved.
 *
 * "Talk" rather than "session" throughout, because that is what these are and
 * because `session` is already taken twice over — by `SessionRow`, the CMS
 * row, and by the activation programme entries in lib/schedule. The public
 * URL says talk too.
 */
export interface Talk {
  row: SessionRow;
  room: Room | null;
}

/**
 * Every session in the CMS, with its room resolved.
 *
 * The superset. `listTalks` below is the standalone subset, and the split is
 * the whole point: a talk *page* and a talk *block on the grid* want different
 * answers to "which sessions are there?".
 */
export async function allTalks(): Promise<Talk[]> {
  const rows = await listSessions();
  return rows.map((row) => ({
    row,
    // Rows saved before the venue picker hold free text; the same best-guess
    // the grid and the admin table already make.
    room:
      ROOMS.find((r) => r.slug === row.location) ??
      ROOMS.find((r) => r.slug === roomSlugFromLegacy(row.location)) ??
      null,
  }));
}

/**
 * The sessions that stand on their own in the week — no activation behind
 * them.
 *
 * ─── What this is for now ───────────────────────────────────────────────────
 *
 * The grid, and the structured data that describes the grid. /schedule and the
 * day views publish one `ItemList` holding every activation and every talk as
 * siblings. An activation's own sessions do not belong in that list: the
 * activation is already there, and its programme underneath it as six more
 * top-level events would describe the same afternoon twice.
 *
 * ─── What it used to also be for ────────────────────────────────────────────
 *
 * This filter used to gate /schedule/talk as well, on the reasoning that a
 * session inside an activation already has a home and a second URL would split
 * content that page deliberately collects.
 *
 * That was right when an activation page printed its whole programme —
 * abstracts and all — in the open. It stopped being right when the abstracts
 * got long: six of them on PySanAntonio run to 3,000 characters together, one
 * alone to 1,352, and a running order that prints them in full cannot be
 * scanned for what a reader came for, which is what is on and who is giving
 * it. The list now truncates, and truncated content needs somewhere to
 * finish — so every session gets a page, and the activation page links to it.
 *
 * The original worry stands and is answered rather than ignored: the talk page
 * names its activation and links back, so the two are read as a whole and a
 * parent, not as two copies competing for the same search.
 */
export async function listTalks(): Promise<Talk[]> {
  return (await allTalks()).filter((t) => t.row.activation === null);
}

export type TalkMatch =
  { talk: Talk; canonical: true } | { talk: Talk; canonical: false };

/**
 * Resolve a URL segment. A hit on `previousSlugs` comes back non-canonical so
 * the route can redirect to the current URL rather than serving one talk at
 * two addresses — the same contract `resolveSlug` gives a renamed speaker.
 */
export async function resolveTalk(slug: string): Promise<TalkMatch | null> {
  const talks = await allTalks();

  const exact = talks.find((t) => t.row.slug === slug);
  if (exact) return { talk: exact, canonical: true };

  const renamed = talks.find((t) => t.row.previousSlugs.includes(slug));
  if (renamed) return { talk: renamed, canonical: false };

  return null;
}
