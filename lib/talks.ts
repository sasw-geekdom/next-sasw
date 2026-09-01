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
 * Every standalone session, newest programme order first.
 *
 * ─── Why only `activation === null` ─────────────────────────────────────────
 *
 * A session inside an activation already has a home: the activation page
 * gathers its whole programme, in an order its organisers chose, next to the
 * copy that frames it. Giving those a second URL would split content that page
 * deliberately collects, and would compete with it for the same search.
 *
 * A standalone session has no such home. Until this existed its block drew on
 * the grid with `page: null` — no link, on any surface — so a talk with a
 * title, a circuit and a speaker attached was something you could see and not
 * read. That gap is the reason these pages exist; SEO is a side effect.
 *
 * ─── Why the read is here ───────────────────────────────────────────────────
 *
 * The same split lib/live-schedule keeps: `listSessions` is `server-only`, and
 * the route and its OG card are the only things that need a whole row.
 */
export async function listTalks(): Promise<Talk[]> {
  const rows = await listSessions();
  return rows
    .filter((row) => row.activation === null)
    .map((row) => ({
      row,
      // Rows saved before the venue picker hold free text; the same best-guess
      // the grid and the admin table already make.
      room:
        ROOMS.find((r) => r.slug === row.location) ??
        ROOMS.find((r) => r.slug === roomSlugFromLegacy(row.location)) ??
        null,
    }));
}

export type TalkMatch =
  { talk: Talk; canonical: true } | { talk: Talk; canonical: false };

/**
 * Resolve a URL segment. A hit on `previousSlugs` comes back non-canonical so
 * the route can redirect to the current URL rather than serving one talk at
 * two addresses — the same contract `resolveSlug` gives a renamed speaker.
 */
export async function resolveTalk(slug: string): Promise<TalkMatch | null> {
  const talks = await listTalks();

  const exact = talks.find((t) => t.row.slug === slug);
  if (exact) return { talk: exact, canonical: true };

  const renamed = talks.find((t) => t.row.previousSlugs.includes(slug));
  if (renamed) return { talk: renamed, canonical: false };

  return null;
}
