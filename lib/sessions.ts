import { ROOMS, type Room } from "@/lib/locations";

// The confirmed activations, for /sessions. Curated here for now, like ROOMS —
// the sessions CMS can feed this later.
//
// `room` is a ROOMS slug rather than a repeated venue name, so a venue rename
// or reorder can't leave this file quietly wrong. `resolveSessions` drops any
// entry whose room no longer exists instead of rendering a blank venue.
//
// TODO(content): every `blurb` below is a placeholder. Only the titles, venues
// and circuits came from a brief — the descriptions are written from the
// format names alone and need real copy before launch.
//
// TODO(assets): Mission Pitch, Latin Tech Pitch and 1 Million Cups each have a
// lockup that hasn't landed in the repo yet. Save each as white-on-transparent
// at `public/sessions/<slug>.svg` and uncomment its `logo` block — the cards
// already render a logo when one is present and typeset the title when it
// isn't, so nothing else has to change.

export interface FeaturedSession {
  slug: string;
  title: string;
  /** A `Room["slug"]` from lib/locations. */
  room: string;
  /** The circuit or strand this runs under. Matches the room's session kind. */
  circuit: string;
  blurb: string;
  /**
   * Optional programme lockup, shown in place of the typeset title.
   *
   * Drop a white-on-transparent SVG (or PNG) into `public/sessions/` and point
   * here; the card falls back to display type when this is absent, so an
   * activation without artwork still renders correctly. Wide lockups suit the
   * slot better than square marks — it's a letterbox, not a badge.
   */
  logo?: { src: string; width: number; height: number; alt: string };
  /**
   * Borrow the lockup from a CMS partner instead of a file in the repo, by
   * case-insensitive substring of the partner's name. Use this when the org
   * running the activation is already on the partner wall — the logo then
   * tracks whatever the admin uploads and can't fall out of date here.
   */
  logoFromPartner?: string;
  /**
   * Force the typeset title to wrap before this substring on wide screens,
   * instead of letting it break wherever the cell runs out of room. For titles
   * carrying a trailing attribution ("… powered by X") the natural break lands
   * mid-phrase; this keeps the credit on its own line.
   *
   * Only applies at `lg` and up — a narrow cell already wraps a long title, so
   * forcing the split on mobile just adds a stub line.
   *
   * Visual only — `title` stays a single clean string, since it's also the
   * logo's alt text and the screen-reader heading. Ignored if the substring
   * isn't found, so editing a title can't break the card.
   */
  titleBreakBefore?: string;
}

/** The one activation big enough to carry the page on its own. */
export const HEADLINE_SESSION: FeaturedSession = {
  slug: "pysanantonio-ii",
  title: "PySanAntonio II",
  room: "the-rand",
  circuit: "Tech & Builders",
  blurb:
    "The city's Python community, back for a second run — talks, workshops, and the people who build with it every day.",
};

export const FEATURED_SESSIONS: FeaturedSession[] = [
  {
    slug: "mission-pitch",
    title: "Mission Pitch",
    room: "tpr",
    circuit: "Capital",
    blurb:
      "Founders pitch from the main stage, with the capital that can move on it in the room.",
  },
  {
    slug: "latin-tech-pitch",
    title: "Latin Tech Pitch",
    room: "tpr",
    circuit: "Capital",
    blurb:
      "A pitch stage for Latino founders building here — and the investors backing them.",
  },
  {
    slug: "1-million-cups",
    title: "1 Million Cups",
    room: "central-library",
    circuit: "Small Business & Solopreneur",
    blurb:
      "The weekly founder format, run at LaunchSA HQ: present, take questions, leave with answers.",
  },
  {
    slug: "creative-futures-brunch",
    title: "The Creative Futures ™ Brunch powered by The Down Market",
    titleBreakBefore: "powered by",
    room: "300-main",
    circuit: "Social",
    blurb:
      "One morning for the creative side of the week — designers, makers, and the work in between.",
  },
  {
    slug: "startup-bash",
    title: "Startup Bash",
    room: "legacy-park",
    circuit: "Social",
    blurb:
      "Where the week unwinds. Open-air, the whole ecosystem in one place, no badge scanning.",
  },
];

export interface ResolvedSession extends FeaturedSession {
  venue: Room;
}

/**
 * Attach each session's venue. Entries pointing at a room that no longer
 * exists are dropped rather than rendered with a blank venue line.
 */
export function resolveSessions(
  sessions: FeaturedSession[],
): ResolvedSession[] {
  return sessions.flatMap((s) => {
    const venue = ROOMS.find((r) => r.slug === s.room);
    return venue ? [{ ...s, venue }] : [];
  });
}

export function resolveSession(
  session: FeaturedSession,
): ResolvedSession | null {
  return resolveSessions([session])[0] ?? null;
}

// ─── /sessions/[slug] ───────────────────────────────────────────────────────
//
// One namespace under /sessions, holding two kinds of page.
//
// Today every slug is a venue — /sessions/tpr is Texas Public Radio's week.
// The second kind is an activation big enough to be its own mini-conference
// inside the week (PySanAntonio is the first), which will want its own page
// rather than a card in someone else's room.
//
// They share a namespace because a reader doesn't sort them: both answer
// "what's happening at this thing". Venues resolve first, so a room slug can
// never be shadowed by an activation that happens to share its name.

/** Every session known to the site, headline included. */
export function allSessions(): FeaturedSession[] {
  return [HEADLINE_SESSION, ...FEATURED_SESSIONS];
}

export interface VenueSchedule {
  kind: "venue";
  room: Room;
  /** Featured activations in this room, headline first if it has one. */
  sessions: ResolvedSession[];
}

/**
 * Slugs /sessions/[slug] builds. Only rooms carrying at least one featured
 * session get a page — an empty schedule is a worse answer than no link, and
 * room-flow only links the rooms it renders.
 */
export function scheduleSlugs(): string[] {
  const withSessions = new Set(allSessions().map((s) => s.room));
  return ROOMS.filter((r) => withSessions.has(r.slug)).map((r) => r.slug);
}

/** Resolve a /sessions/[slug] segment, or null when nothing claims it. */
export function resolveSchedule(slug: string): VenueSchedule | null {
  const room = ROOMS.find((r) => r.slug === slug);
  if (!room) return null;

  const sessions = resolveSessions(
    allSessions().filter((s) => s.room === room.slug),
  );
  return sessions.length > 0 ? { kind: "venue", room, sessions } : null;
}
