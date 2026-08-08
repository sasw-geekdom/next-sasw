import { ASSET, ROOMS, type Room } from "@/lib/locations";

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
  /**
   * Gives this session its own page at `/sessions/<page>`, for an activation
   * big enough to be a mini-conference inside the week rather than a card in
   * someone else's room.
   *
   * Separate from `slug` on purpose. `slug` names the edition — the 2026 run
   * is `pysanantonio-ii` — while the URL should outlive it, so next year's
   * third edition keeps the same address and whatever links to it. Omit this
   * and the session simply has no page.
   */
  page?: string;
  /**
   * The organiser's own page for this activation, when it has one.
   *
   * These are partner-run events with their own sites, schedules and
   * applications. This site holds where it sits in the week; the depth lives
   * there, and its page should say so rather than pretend otherwise.
   */
  site?: {
    label: string;
    /**
     * Omitted when we run the thing ourselves — Startup Bash is ours, so the
     * credit is a statement of fact with nowhere else to send anyone. The
     * page renders it as plain text rather than a link back to this same
     * site, which would be a dead loop dressed as a handoff.
     */
    href?: string;
  };
  /**
   * Confirmed start and end, once the organiser has fixed them.
   *
   * ISO 8601 with an explicit offset, not display strings: the page label, the
   * metadata description and the downloadable calendar file all derive from
   * this one value, so they cannot drift apart. Absent means genuinely
   * unconfirmed — the page says so rather than inventing a placeholder.
   *
   * The week runs in America/Chicago and ends well before DST does (Nov 1
   * 2026), so every 2026 session is -05:00.
   */
  when?: { start: string; end: string };
  /**
   * A photograph for the page's hero, laid into the right of the frame behind
   * the copy — not a card image and not shown anywhere else.
   *
   * Desktop only by the time it renders: below `lg` the hero is a single
   * column and a photograph under the type would fight it. Pick something
   * that reads at a glance and survives being masked and dimmed, because it
   * is set into the black rather than placed on top of it.
   */
  hero?: { src: string; width: number; height: number; alt: string };
}

/** The one activation big enough to carry the page on its own. */
export const HEADLINE_SESSION: FeaturedSession = {
  slug: "pysanantonio-ii",
  page: "pysanantonio",
  title: "PySanAntonio II",
  room: "the-rand",
  circuit: "Tech & Builders",
  // Friday, October 2, 1:00–6:00 PM — the same slot lib/pysa states in prose
  // for the band, expressed here in the shape every activation uses.
  when: {
    start: "2026-10-02T13:00:00-05:00",
    end: "2026-10-02T18:00:00-05:00",
  },
  blurb:
    "The city's Python community, back for a second run — talks, workshops, and the people who build with it every day.",
};

export const FEATURED_SESSIONS: FeaturedSession[] = [
  {
    slug: "mission-pitch",
    page: "mission-pitch",
    site: { label: "missionpitch.org", href: "https://www.missionpitch.org/" },
    // White-on-transparent, so it sits on the dark card and the dark page
    // without a plate behind it. Copied into the repo rather than hotlinked
    // from the bucket it arrived in: next/image needs the host in
    // `remotePatterns`, and a mark the layout depends on shouldn't hang off a
    // third party.
    //
    // Cropped to its ink before committing. As supplied it was 1200x400 with
    // 157px of transparent margin down the left, so `object-left` aligned the
    // file's edge while the visible mark sat indented from the eyebrow above
    // it. Trimmed, the box and the mark are the same thing and CSS controls
    // the spacing. Any future lockup wants the same treatment.
    logo: {
      src: "/sessions/mission-pitch.png",
      width: 920,
      height: 225,
      alt: "Mission Pitch",
    },
    title: "Mission Pitch",
    room: "tpr",
    circuit: "Capital",
    // The 2025 showcase — a $20,000 grant handed over on the night, which is
    // the blurb's "grants decided in the room" as a photograph. Resized from
    // the 2500px original on missionpitch.org; anything larger is bytes that
    // never reach a screen.
    hero: {
      src: "/sessions/mission-pitch-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
    // Confirmed: Monday 28 September, 5–7pm, and the only thing running at
    // Texas Public Radio that evening.
    when: {
      start: "2026-09-28T17:00:00-05:00",
      end: "2026-09-28T19:00:00-05:00",
    },
    // Nonprofit leaders, not founders. missionpitch.org describes it as "an
    // accelerator for nonprofit leaders in the greater San Antonio area", run
    // by Social Venture Partners with Geekdom, and what's awarded is
    // unrestricted grant money — the 2025 cohort took $72,855, part of it
    // raised from the room on the night. The old blurb said "founders" and
    // "capital", which described a startup demo day this isn't.
    blurb:
      "San Antonio nonprofit leaders pitch funders from the main stage — grants decided in the room.",
  },
  {
    slug: "latin-tech-pitch",
    page: "latin-tech-pitch",
    site: {
      label: "latintechpitch.com",
      href: "https://www.latintechpitch.com/about-1",
    },
    title: "Latin Tech Pitch",
    room: "tpr",
    circuit: "Capital",
    // Per latintechpitch.com: "an elite startup competition for early-stage,
    // Latino-led tech companies", eligibility Texas-wide rather than local
    // (the old "building here" implied San Antonio), presented in partnership
    // with the Consulate General of Israel. "$110k in prizes and mentorship"
    // mirrors their own framing — the cash placings total far less, so it
    // shouldn't be described as a purse.
    blurb:
      "Latino-led startups from across Texas, pitching for $110k in prizes and mentorship — presented with the Consulate General of Israel.",
    when: {
      start: "2026-09-30T14:00:00-05:00",
      end: "2026-09-30T18:00:00-05:00",
    },
    // The mark reads "LatinTECH PITCH 2026" — the only version they publish
    // that carries the full name; the plain "LatinTECH" wordmark drops
    // "Pitch". The year is baked into the artwork, so this file needs a new
    // one if the page outlives the 2026 edition.
    logo: {
      src: "/sessions/latin-tech-pitch.png",
      width: 936,
      height: 243,
      alt: "Latin Tech Pitch",
    },
    // The 2024 competition's room, from latintechpitch.com. Chosen over their
    // cheque-presentation shots on purpose: Mission Pitch already leads with
    // one, and two sibling pages running the same composition reads as a
    // template. A full house also survives the hero's mask — whatever the
    // dissolve eats is still a crowd, where a single subject would be lost.
    hero: {
      src: "/sessions/latin-tech-pitch-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
  },
  {
    slug: "1-million-cups",
    page: "1-million-cups",
    // The chapter is run by Launch SA, who host it at their Central Library
    // HQ — so the "run by" credit points at them rather than at 1MC's national
    // site. 1millioncups.com/sanantonio still redirects to the chapter page if
    // that's ever wanted back.
    site: {
      label: "launchsa.org",
      href: "https://launchsa.org/",
    },
    title: "1 Million Cups",
    room: "central-library",
    circuit: "Small Business & Solopreneur",
    blurb:
      "The weekly founder format, run at LaunchSA HQ: present, take questions, leave with answers.",
    when: {
      start: "2026-09-30T09:00:00-05:00",
      end: "2026-09-30T11:00:00-05:00",
    },
    // 1millioncups.com's stacked white mark, which already carries the
    // Kauffman Foundation line — their other lockup is white knocked out of an
    // orange square, and a square of brand colour would fight the black.
    // Stacked, so it sits taller and narrower than the wide lockups on the
    // other cards; the slot is height-led, which keeps them on one baseline.
    logo: {
      src: "/sessions/1-million-cups.png",
      width: 1072,
      height: 536,
      alt: "1 Million Cups",
    },
    // From launchsa.org, and shot at an actual 1 Million Cups morning there —
    // the venue's own branding is on the glass, which is worth more than a
    // generic room given the blurb names LaunchSA HQ. Deliberately quieter
    // than the other two: a cheque handover and a full auditorium already
    // carry the week's big moments, and this one is a weekly working session.
    hero: {
      src: "/sessions/1-million-cups-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
  },
  {
    slug: "creative-futures-brunch",
    page: "creative-futures-brunch",
    title: "The Creative Futures ™ Brunch powered by The Down Market",
    titleBreakBefore: "powered by",
    room: "300-main",
    circuit: "Social",
    blurb:
      "One morning for the creative side of the week — designers, makers, and the work in between.",
  },
  {
    slug: "startup-bash",
    page: "startup-bash",
    title: "Startup Bash",
    room: "legacy-park",
    circuit: "Social",
    blurb:
      "Where the week unwinds. Open-air, the whole ecosystem in one place, no badge scanning.",
    when: {
      start: "2026-10-01T18:00:00-05:00",
      end: "2026-10-01T20:00:00-05:00",
    },
    // Ours, so there is no organiser to hand off to — see `site.href`.
    site: { label: "Startup + Tech Week" },
    // No logo on purpose: this one is the week's own party, not a partner
    // brand, so the title is typeset like any other heading.
    //
    // The art is Legacy Park's own magenta ASCII illustration, already in the
    // asset bucket the venue images come from. It is near-black at 20/255, so
    // unlike the photographs it never threatens the copy — the mask is doing
    // composition here, not rescue.
    hero: {
      src: ASSET("sastw-legacypark.jpg"),
      width: 784,
      height: 720,
      alt: "",
    },
  },
];

/** The week's timezone. Every label and calendar stamp is resolved in it. */
const TZ = "America/Chicago";

/**
 * Display strings for a confirmed slot, both derived from `when` so a change
 * to the time can't leave a stale label behind.
 */
export function whenLabels(when: { start: string; end: string }) {
  const start = new Date(when.start);
  const end = new Date(when.end);
  const date = start.toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const t = (d: Date) =>
    d
      .toLocaleTimeString("en-US", {
        timeZone: TZ,
        hour: "numeric",
        minute: "2-digit",
      })
      .replace(":00", ":00");
  return { date, time: `${t(start)} – ${t(end)}` };
}

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

export interface ActivationSchedule {
  kind: "activation";
  session: ResolvedSession;
}

export type Schedule = VenueSchedule | ActivationSchedule;

/** Activations big enough to hold a page, keyed by the segment they answer to. */
function activations(): Map<string, FeaturedSession> {
  const m = new Map<string, FeaturedSession>();
  for (const s of allSessions()) if (s.page) m.set(s.page, s);
  return m;
}

/**
 * Slugs /sessions/[slug] builds — every room carrying at least one featured
 * session, plus every activation that has opted into a page.
 *
 * A room with an empty schedule gets nothing: no link points at it, and an
 * empty page is a worse answer than a 404.
 */
/**
 * Where a venue slug should send people instead of rendering a page.
 *
 * A room with a single activation has no week to show. /sessions/legacy-park
 * was 898 words that named Startup Bash twelve times and nothing else — a
 * second URL competing with the activation's own page for the same searches,
 * and by then nothing linked to it either.
 *
 * Derived from the room's programming rather than a hardcoded slug, so a room
 * that gains a second session stops redirecting on the next build and gets
 * its venue page back with no config to remember.
 *
 * Returns null when the room genuinely has a week worth showing, or when its
 * one activation has no page of its own to send anyone to.
 */
export function venueRedirect(slug: string): string | null {
  const room = ROOMS.find((r) => r.slug === slug);
  if (!room || room.sessions.length > 1) return null;
  const only = allSessions().find((s) => s.room === slug);
  return only?.page ? `/sessions/${only.page}` : null;
}

export function scheduleSlugs(): string[] {
  const withSessions = new Set(allSessions().map((s) => s.room));
  return [
    ...ROOMS.filter((r) => withSessions.has(r.slug)).map((r) => r.slug),
    ...activations().keys(),
  ];
}

/**
 * Resolve a /sessions/[slug] segment, or null when nothing claims it.
 *
 * Rooms resolve first, so an activation can never shadow a venue that happens
 * to share its name — the venue is the older, more linked-to URL of the two.
 */
export function resolveSchedule(slug: string): Schedule | null {
  const room = ROOMS.find((r) => r.slug === slug);
  if (room) {
    const sessions = resolveSessions(
      allSessions().filter((s) => s.room === room.slug),
    );
    return sessions.length > 0 ? { kind: "venue", room, sessions } : null;
  }

  const activation = activations().get(slug);
  if (!activation) return null;
  const session = resolveSession(activation);
  return session ? { kind: "activation", session } : null;
}
