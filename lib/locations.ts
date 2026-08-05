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
    desc: "The anchor. Five circuits, the keynotes, and the biggest rooms of the week.",
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
    desc: "Community-driven activations — run by the orgs and partners that build here.",
    tag: "Tech & Builders",
    port: "p2",
    tier: "day",
    image: ASSET("glogo-rand.jpg"),
    imageWidth: 698,
    imageHeight: 720,
    // Fills like the others. From sm the cell is portrait and this art is
    // near-square, so covering it crops width, not the base — about 27px off
    // each side at desktop, which trims building edge and leaves the Geekdom
    // mark whole. Below sm the cell turns landscape and room-flow switches to
    // contain, since covering there would cut the "g" descender.
    fit: "cover",
    ascii: `  ____________
 /▒ ▒ ▒ ▒ ▒/|
|▒ ⚡▒ ▒ ▒| |
|▒ ▒ ▒ ▒ ▒| |
|▒_▒_▒_▒_▒|/`,
    sessions: [
      { title: "Founder Funder Speed Networking", kind: "Founders" },
      { title: "PySanAntonio II", kind: "Tech & Builders" },
    ],
  },
  {
    slug: "central-library",
    name: "Central Library",
    host: "LaunchSA · Small Business",
    desc: "LaunchSA HQ — Programming built for small business and solopreneurs.",
    tag: "Small Business & Solopreneur",
    port: "p3",
    tier: "day",
    image: ASSET("sastw-launchsa.jpg"),
    imageWidth: 819,
    imageHeight: 720,
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
