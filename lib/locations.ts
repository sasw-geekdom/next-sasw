// The six venues active during Startup + Tech Week, and the sessions each
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
  /**
   * A name for a cell too narrow to hold the real one.
   *
   * Only set where the full name genuinely doesn't fit anywhere it's used.
   * On the week calendar a venue label sits in a lane that can be a quarter
   * of a day column, and "Texas Public Radio" truncates there to "TEXAS
   * PUBLIC …" — which names the wrong thing, since the venue is the one field
   * that tells two simultaneous 1–6 PM blocks apart.
   *
   * Everything else on the site keeps `name`. This is a fallback for one
   * layout, not a rename.
   */
  shortName?: string;
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
    // The station's own abbreviation, and already this room's slug.
    shortName: "TPR",
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
    //
    // Rewritten once the programme was real. "The days between fill with
    // technical sessions — security, AI, and design" was written from the
    // circuits rather than from the schedule, and the schedule disagreed: the
    // day between the two pitch events is Sandra Velasquez on building
    // Nopalera, which is a founder's story and not a technical session. What
    // the room actually has in common across three confirmed events is money
    // on the table, so that is what it says.
    //
    // Deliberately not a list. TPR is about to take eighteen to twenty more
    // sessions, and a blurb that enumerates three of them would be wrong the
    // week they land — this names the character of the room instead, which
    // survives them.
    desc: "The anchor, and the room with money on the table. Mission Pitch funds five San Antonio nonprofits on the night, Latin Tech Pitch puts $110k behind Latino-led startups, and founders take the stage in between.",
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
    //
    // The groups, by name, now that all ten sessions are confirmed. The line
    // said "the partners and grassroots groups that run all year" and left
    // the reader to take it on trust; naming six of them is the difference
    // between a claim and evidence, and every one is a group a San Antonio
    // engineer will recognise. It is also the busiest room of the week —
    // four sessions on Tuesday, four on Thursday — which is the single most
    // useful thing this card can say about it.
    desc: "The community floor, and the busiest room of the week. .NET and Google Developer Groups, AITX and Datanauts, AWS and Linux San Antonio run back to back — the groups DEVSA hosts all year, in one place for five days.",
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
    host: "Launch SA · Small Business",
    // From launchsa.org: "San Antonio's Resource Center for Small Business
    // Owners and Entrepreneurs", "a partnership between City of San Antonio
    // and Geekdom", and its help is explicitly no-cost — advising, workshops
    // and networking. It also sits at 600 Soledad St, 1st floor, *inside*
    // Central Library, which is why this room carries the library's name and
    // Launch SA's host line.
    //
    // "No-cost" is the fact worth surfacing: it's the site's own framing, and
    // it tells a small-business owner scanning the section whether the room
    // is for them.
    //
    // Second sentence added once both things running here were locked. The
    // blurb described the venue and stopped at "programming built for owners
    // and solopreneurs", which is a category rather than a plan — and this is
    // the one room whose headline activation runs across all five days, a
    // fact no card in the section could otherwise carry.
    desc: "Launch SA HQ — the City of San Antonio and Geekdom's no-cost resource center for small business. 1 Million Cups brings its weekly founder format here on Wednesday, and the Give-a-LOT donation drive runs all five days.",
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
  // The single-activation rooms run in the order they happen — Trinity on
  // Tuesday, then the brunch and the bash, which share Thursday morning and
  // Thursday night. Array order is display order, so this is what sets the
  // bottom row.
  {
    slug: "trinity",
    name: "Trinity University",
    // "Trinity University" is 18 characters, the same length as "Texas Public
    // Radio", and it truncates in a week-calendar lane for the same reason.
    // The campus is the fact that tells this block apart from the four
    // downtown rooms, so the short form keeps the word that does that work.
    shortName: "Trinity",
    place: {
      // Off-campus visitors are directed to the Alamo Stadium lot rather than
      // to this address, which is the campus itself — but the address is what
      // a map app resolves, and the room is one building inside it. The hall
      // is named in the activation's `venueDetail`.
      address: "1 Trinity Place",
      postalCode: "78212",
      // No coordinates. Every other room's came from a map provider or a
      // published source; a pin dropped on a 117-acre campus would be a guess
      // about which building, and 300 Main already sets the precedent for
      // publishing the postal code alone rather than inferring the rest.
    },
    host: "Trinity University · Capital",
    // The one room on this list that is not downtown, which is why the
    // distance is in the copy rather than left for someone to discover in a
    // map app. Three miles north, and it is the only room of the six that
    // nobody walks to from the others.
    desc: "One evening, three miles north of downtown — five Trinity student ventures pitching for a $50,000 prize.",
    tag: "One evening · capital",
    port: "p6",
    tier: "single",
    ascii: `    _________
   /‖ ‖ ‖ ‖ ‖\\
  | ‖ ‖ ⚡‖ ‖ |
  |_‖_‖_‖_‖_‖_|
  ==============`,
    sessions: [{ title: "Stumberg Venture Competition", kind: "Capital" }],
  },
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
