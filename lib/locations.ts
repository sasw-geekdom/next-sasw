// The four venues active during Startup + Tech Week, and the sessions each
// spotlights. Sessions are curated here for now; they can later be pulled from
// the sessions CMS. `image` is the ASCII building portrait (magenta-on-black);
// until those assets land, the flow renders the `ascii` placeholder.

export interface RoomSession {
  title: string;
  kind: string;
}

export interface Room {
  slug: string;
  name: string;
  host: string;
  desc: string;
  tag: string;
  color: string; // circuit accent
  port: string; // wiring id: p1..p4
  featured?: boolean; // the main stage — the five circuits converge here
  image?: string; // ASCII portrait (magenta-on-black)
  imageWidth?: number;
  imageHeight?: number;
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
    color: "#ff32a0",
    port: "p1",
    featured: true,
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
    host: "Geekdom · Tech Bloc · DEVSA Community",
    desc: "Find your people. Build your future. Community-driven activations — run by the orgs and partners that build here.",
    tag: "Tech & Builders",
    color: "#4d7cff",
    port: "p2",
    image: ASSET("glogo-rand.jpg"),
    imageWidth: 1280,
    imageHeight: 720,
    ascii: `  ____________
 /▒ ▒ ▒ ▒ ▒/|
|▒ ⚡▒ ▒ ▒| |
|▒ ▒ ▒ ▒ ▒| |
|▒_▒_▒_▒_▒|/`,
    sessions: [
      { title: "Founder Funder Speed Networking", kind: "Founders" },
      { title: "PySanAntonio II", kind: "Tech & Builders" },
      { title: "Game Design Summit", kind: "Tech & Builders" },
    ],
  },
  {
    slug: "central-library",
    name: "Central Library",
    host: "LaunchSA · Small Business",
    desc: "LaunchSA HQ — Programming built for small business and solopreneurs.",
    tag: "Small Business & Solopreneur",
    color: "#b45cff",
    port: "p3",
    image: ASSET("sastw-launchsa.jpg"),
    imageWidth: 1280,
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
  {
    slug: "legacy-park",
    name: "Legacy Park",
    host: "Startup + Tech Week · Social",
    desc: "Where the week unwinds — mixers, coffee, and open-air socials.",
    tag: "Where the circuits converge",
    color: "#ff6b57",
    port: "p4",
    image: ASSET("sastw-legacypark.jpg"),
    imageWidth: 1280,
    imageHeight: 720,
    ascii: `   ♣   ♣  ⚡♣
  ♣♣♣ ♣♣♣ ♣♣♣
   |   |   |
  ____________
 [__  STAGE __]`,
    sessions: [
      { title: "Startup Bash", kind:"" },
    ],
  },
];
