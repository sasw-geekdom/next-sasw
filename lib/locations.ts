// The five venues active during Startup + Tech Week, and the sessions each
// spotlights. Sessions are curated here for now; they can later be pulled from
// the sessions CMS. `image` is the building portrait (magenta-on-black);
// until those assets land, the flow renders the `ascii` placeholder.
//
// Venues fall into two tiers, and the layout reads `tier` directly rather than
// inferring it from session count — a room can run all week on two sessions.

export interface RoomSession {
  title: string;
  kind: string;
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
  ascii: string; // placeholder art when no image
  sessions: RoomSession[];
}

const ASSET = (file: string) =>
  `https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2F${file}?alt=media`;

export const ROOMS: Room[] = [
  {
    slug: "tpr",
    name: "Texas Public Radio",
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
      { title: "Founder Funder Speed Networking", kind: "Founders" },
      { title: "PySanAntonio II", kind: "Tech & Builders" },
      { title: "Access Granted", kind: "Tech & Builders" },
    ],
  },
  {
    slug: "central-library",
    name: "Central Library",
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
      { title: "Small Business Speed Networking", kind: "Small Business & Solopreneur" },
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
    host: "Startup + Tech Week · Social",
    desc: "One morning — the creative side of the week, over brunch.",
    tag: "One morning · social",
    port: "p4",
    tier: "single",
    ascii: `   ___________
  |‖ ‖ ‖ ‖ ‖ |
  |‖ ⚡‖ ‖ ‖ |
  |‖ ‖ ‖ ‖ ‖ |
  |‖_‖_‖_‖_‖_|
  =============`,
    sessions: [
      { title: "Creative Futures Brunch", kind: "Social" },
    ],
  },
  {
    slug: "legacy-park",
    name: "Legacy Park",
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
    sessions: [
      { title: "Startup Bash", kind: "Social" },
    ],
  },
];
