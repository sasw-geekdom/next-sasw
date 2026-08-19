// The five venues active during Startup + Tech Week, and the sessions each
// spotlights. Sessions are curated here for now; they can later be pulled from
// the sessions CMS. `image` is the building portrait (magenta-on-black);
// until those assets land, the flow renders the `ascii` placeholder.
//
// Venues fall into two tiers, and the layout reads `tier` directly rather than
// inferring it from session count — a room can run all week on two sessions.

import type { TrackName } from "@/lib/tracks";

/**
 * Where a room physically is.
 *
 * Shape deliberately mirrors `RoomPlace` on the schedule-and-venues branch —
 * a subset of it — so merging that work adds `parking` and `node` rather than
 * colliding with a different design for the same facts.
 *
 * Optional throughout: every consumer renders conditionally, and one venue
 * (300 Main) has no address on that branch either.
 */
export interface RoomPlace {
  address?: string;
  /**
   * Only where it's been confirmed. Every one of these is almost certainly
   * 78205 — they are all within a few downtown blocks — but "almost certainly"
   * is not a fact to publish in structured data, so this is set for the one
   * address that arrived with it rather than inferred for the rest.
   */
  postalCode?: string;
  /** Real coordinates, for `geo` in the Event markup. */
  coords?: { lat: number; lon: number };
}

export interface RoomSession {
  title: string;
  /**
   * One of the five circuits, or "Social" for Startup Bash, the one evening
   * activation that sits outside them. The brunch was the other until the
   * organisers placed it on AI & Applied Innovation.
   *
   * Typed rather than a bare string because a bare string let this drift: The
   * Rand's speed-networking session was tagged "Founders" while the homepage
   * hero, a few hundred pixels above it, rendered the canonical "Founder"
   * from TRACK_NAMES. Same page, two spellings of one circuit, and nothing to
   * catch it — the value is only ever displayed, never looked up, so no
   * lookup failed loudly.
   */
  kind: TrackName | "Social";
}

/**
 * "anchor" — the main stage, where the five circuits converge.
 * "day"    — runs programming through the day, all week.
 * "single" — lights up once, for one event.
 */
export type RoomTier = "anchor" | "day" | "single";

export interface Room {
  slug: string;
  name: string;
  host: string;
  desc: string;
  tag: string;
  port: string; // wiring id: p1..p5
  tier: RoomTier;
  image?: string; // ASCII portrait (magenta-on-black)
  imageWidth?: number;
  imageHeight?: number;
  // How the image sits in the shared 4:3 frame (non-featured only).
  // "cover" (default) fills and top-crops; "contain" fits the whole image
  // for near-square art that would otherwise lose its base to the crop.
  fit?: "cover" | "contain";
  place?: RoomPlace;
  ascii: string; // placeholder art when no image
  sessions: RoomSession[];
}

export const ASSET = (file: string) =>
  `https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2F${file}?alt=media`;

export const ROOMS: Room[] = [
  {
    slug: "tpr",
    name: "Texas Public Radio",
    place: {
      address: "321 W Commerce St",
      coords: { lat: 29.425941, lon: -98.49713 },
    },
    host: "San Antonio Startup + Tech Week",
    // "Five circuits" is dropped from the copy on purpose — the pip ramp and
    // the `tag` beside this already say it, and the panel shouldn't state the
    // same fact three times. What it says instead is who holds the stage.
    //
    // No partner named here, deliberately. DEVSA does fill the days between
    // the two pitch events, but this room's host line is the event itself, so
    // crediting a partner inside it read as DEVSA operating the main stage
    // rather than programming into it. The fact survives without the name,
    // and the phrasing leaves room for the keynotes still to be added.
    desc: "The anchor. Mission Pitch and Latin Tech Pitch take the main stage, and the days between fill with technical sessions — security, AI, and design.",
    tag: "5 circuits · main stage",
    port: "p1",
    tier: "anchor",
    image: ASSET("sastw-tpr-magenta.png"),
    imageWidth: 1536,
    imageHeight: 1024,
    ascii: `      .:|:.
     :|▓▓▓|:   ) )
     |▓ ⚡▓|  ( ·
     |▓▓▓▓▓|
   __|▓▓▓▓▓|__
  |___________|`,
    sessions: [
      { title: "Mission Pitch", kind: "Capital" },
      { title: "State of Innovation", kind: "AI & Applied Innovation" },
      { title: "Latin Tech Pitch", kind: "Capital" },
    ],
  },
  {
    slug: "the-rand",
    name: "The Rand",
    place: {
      address: "110 E Houston St",
      coords: { lat: 29.426244, lon: -98.4935 },
    },
    host: "Geekdom · DEVSA Community",
    // Leads with the communities, not the org that convenes them, and names
    // DEVSA once — the host line above already says whose floor this is, so
    // repeating it in the blurb spent the section's most-used name again.
    //
    // It also opened on "Find your people. Build your future.", which is
    // devsa.community's own tagline verbatim; a partner's brand line reads as
    // marketing when it's the event doing the describing. Naming the groups
    // instead matches how DEVSA positions itself anyway — "we don't replace
    // the communities doing the work, we host them, connect them".
    desc: "The community floor. The partners and grassroots groups that run all year, together in one room for the week — connected by DEVSA.",
    tag: "Tech & Builders",
    port: "p2",
    tier: "day",
    image: ASSET("glogo-rand.jpg"),
    imageWidth: 698,
    imageHeight: 720,
    // Contain, now that every venue runs the anchor's wide portrait cell.
    // This art is near-square (698×720); in a landscape cell, covering it
    // crops top and bottom, and the bottom is where the Geekdom "g" descender
    // lives. Contained on a black ground it reads as the mark sitting in
    // space rather than as letterboxing — there's no border for the bars to
    // show against.
    fit: "contain",
    ascii: `  ____________
 /▒ ▒ ▒ ▒ ▒/|
|▒ ⚡▒ ▒ ▒| |
|▒ ▒ ▒ ▒ ▒| |
|▒_▒_▒_▒_▒|/`,
    sessions: [
      { title: "Founder Funder Speed Networking", kind: "Founder" },
      { title: "The Model", kind: "AI & Applied Innovation" },
      { title: "PySanAntonio II", kind: "Tech & Builders" },
      { title: "Access Granted", kind: "Tech & Builders" },
    ],
  },
  {
    slug: "central-library",
    name: "Central Library",
    place: {
      address: "600 Soledad St",
      coords: { lat: 29.432316, lon: -98.492844 },
    },
    host: "LaunchSA · Small Business",
    // From launchsa.org: "San Antonio's Resource Center for Small Business
    // Owners and Entrepreneurs", "a partnership between City of San Antonio
    // and Geekdom", and its help is explicitly no-cost — advising, workshops
    // and networking. It also sits at 600 Soledad St, 1st floor, *inside*
    // Central Library, which is why this room carries the library's name and
    // LaunchSA's host line.
    //
    // "No-cost" is the fact worth surfacing: it's the site's own framing, and
    // it tells a small-business owner scanning the section whether the room
    // is for them.
    desc: "LaunchSA HQ — the City of San Antonio and Geekdom's no-cost resource center for small business. Programming built for owners and solopreneurs.",
    tag: "Small Business & Solopreneur",
    port: "p3",
    tier: "day",
    image: ASSET("sastw-launchsa.jpg"),
    imageWidth: 819,
    imageHeight: 720,
    // Contain, for the same reason as The Rand. At 819×720 this is near-square
    // too, so covering it in room-flow's landscape cell threw away 234px —
    // half off the top, which is where this illustration's sky and its orange
    // bolt live. The whole mark shows now.
    fit: "contain",
    ascii: `    ________
   / ______ \\
  ||‖ ‖ ‖ ‖||
  ||‖⚡‖ ‖ ‖||
  ||‖_‖_‖_‖||
  ===========`,
    sessions: [
      { title: "1 Million Cups", kind: "Small Business & Solopreneur" },
      {
        title: "Small Business Speed Networking",
        kind: "Small Business & Solopreneur",
      },
      // The room's one Tech & Builders session. A room is not a circuit — The
      // Rand carries three across its three activations — and the short name
      // is what goes here because room-flow joins these titles with " · " into
      // a single line, where "Give-a-LOT Computer Donation Drive" runs the row
      // to two.
      { title: "Give-a-LOT", kind: "Tech & Builders" },
    ],
  },
  // The two single-activation rooms run in the order they happen — the brunch
  // in the morning, the bash at night. Array order is display order, so this
  // is what puts 300 Main ahead of Legacy Park in the bottom row, and it
  // matches the order the section intro lists them in.
  {
    // TODO(content): host, desc and tag below are placeholders — no brief was
    // given for 300 Main beyond the Creative Futures Brunch. There's also no
    // building portrait in sasw-assets yet, so this renders the ASCII
    // fallback; drop in `image: ASSET("sastw-300main.…")` when the art lands.
    slug: "300-main",
    name: "300 Main",
    place: {
      address: "300 N Main Ave",
      postalCode: "78205",
    },
    host: "Startup + Tech Week · AI & Applied Innovation",
    desc: "One morning — the creative side of the week, over brunch.",
    // 300 Main lights up once, for the brunch, so the room's strand is simply
    // the activation's. Both said "social" until the organisers placed it on
    // AI & Applied Innovation; leaving these behind would have put a Social
    // chip on the room card and an AI chip on the event inside it.
    tag: "One morning · AI & applied innovation",
    port: "p4",
    tier: "single",
    ascii: `   ___________
  |‖ ‖ ‖ ‖ ‖ |
  |‖ ⚡‖ ‖ ‖ |
  |‖ ‖ ‖ ‖ ‖ |
  |‖_‖_‖_‖_‖_|
  =============`,
    // "The" is part of the name — they asked for it. This is the short form
    // room-flow prints; the activation's own title in lib/schedule carries the
    // full "The Creative Futures ™ Brunch powered by The Down Market".
    sessions: [
      { title: "The Creative Futures Brunch", kind: "AI & Applied Innovation" },
    ],
  },
  {
    slug: "legacy-park",
    name: "Legacy Park",
    place: {
      // Derived, not sourced — 103 W Houston is one short block west of The
      // Rand at 110 E Houston. Carried over from schedule-and-venues with its
      // caveat intact: the other three came from map providers, this one was
      // reasoned out. Worth confirming before it drives anything a visitor
      // navigates by.
      address: "103 W Houston St",
      coords: { lat: 29.4263, lon: -98.4947 },
    },
    host: "Startup + Tech Week · Social",
    desc: "Where the week unwinds — the Startup Bash, open-air.",
    tag: "One night · social",
    port: "p5",
    tier: "single",
    // No portrait by design — single-activation rooms stay lean. The old
    // illustration was `sastw-legacypark.jpg`, recoverable from git if a
    // future layout wants it back.
    ascii: `   ♣   ♣  ⚡♣
  ♣♣♣ ♣♣♣ ♣♣♣
   |   |   |
  ____________
 [__  STAGE __]`,
    sessions: [{ title: "Startup Bash", kind: "Social" }],
  },
];

/**
 * The rooms as a picker: slug for storage, name for the label.
 *
 * A session's venue is stored as a slug, not a display name. Names get
 * rewritten — Central Library's host line once read "LaunchSA" — and a stored
 * name would then point at nothing. Slugs already carry the URLs, so they are
 * the stable key, and a CMS session holding one can link straight to its venue
 * page without a lookup table.
 */
export const VENUE_OPTIONS = ROOMS.map((r) => ({ slug: r.slug, name: r.name }));

export const VENUE_SLUGS = ROOMS.map((r) => r.slug) as [string, ...string[]];

/**
 * Best guess at a slug for a value stored before the field was constrained.
 *
 * Sessions entered while `location` was free text hold things like "The Rand"
 * or "Geekdom 3rd floor". Matching those back means an admin editing an old row
 * sees the right venue pre-selected rather than an empty required field.
 * Returns null when it can't tell — which is the honest answer for "Geekdom
 * 3rd floor", a room inside The Rand rather than one of these five.
 */
/**
 * A venue slug as a human reads it.
 *
 * Session rows hold `location` as a slug now, so every surface that prints one
 * — a speaker's "on the schedule" list, the admin table — needs the name back.
 * Falls through to the stored string for rows saved before the picker landed,
 * which is what they always displayed anyway.
 */
export function venueLabel(value: string | null | undefined): string {
  if (!value) return "";
  return ROOMS.find((r) => r.slug === value)?.name ?? value;
}

export function roomSlugFromLegacy(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const hit = ROOMS.find((r) => r.slug === v || r.name.toLowerCase() === v);
  return hit?.slug ?? null;
}
