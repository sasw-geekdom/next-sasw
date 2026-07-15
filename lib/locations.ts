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
  tag: string;
  color: string; // circuit accent
  port: string; // wiring id: p1..p4
  image?: string; // ASCII portrait when ready
  ascii: string; // placeholder art
  sessions: RoomSession[];
}

export const ROOMS: Room[] = [
  {
    slug: "tpr",
    name: "Texas Public Radio",
    host: "SASTW · the anchor",
    tag: "5 circuits · main stage",
    color: "#ff32a0",
    port: "p1",
    ascii: `      .:|:.
     :|▓▓▓|:   ) )
     |▓ ⚡▓|  ( ·
     |▓▓▓▓▓|
   __|▓▓▓▓▓|__
  |___________|`,
    sessions: [
      { title: "Founder keynote", kind: "Founder" },
      { title: "AI & Applied panel", kind: "AI" },
      { title: "Capital fireside", kind: "Capital" },
    ],
  },
  {
    slug: "the-rand",
    name: "The Rand",
    host: "Geekdom · community-led",
    tag: "Tech & Builders",
    color: "#4d7cff",
    port: "p2",
    ascii: `  ____________
 /▒ ▒ ▒ ▒ ▒/|
|▒ ⚡▒ ▒ ▒| |
|▒ ▒ ▒ ▒ ▒| |
|▒_▒_▒_▒_▒|/`,
    sessions: [
      { title: "Python Conference", kind: "Community" },
      { title: "Game Design Summit", kind: "Community" },
    ],
  },
  {
    slug: "central-library",
    name: "Central Library",
    host: "LaunchSA · small business",
    tag: "Small Business & Solopreneur",
    color: "#b45cff",
    port: "p3",
    ascii: `    ________
   / ______ \\
  ||‖ ‖ ‖ ‖||
  ||‖⚡‖ ‖ ‖||
  ||‖_‖_‖_‖||
  ===========`,
    sessions: [
      { title: "Solopreneur masterclass", kind: "LaunchSA" },
      { title: "Main Street mixer", kind: "LaunchSA" },
    ],
  },
  {
    slug: "legacy-park",
    name: "Legacy Park",
    host: "SASTW · social",
    tag: "Where the circuits converge",
    color: "#ff6b57",
    port: "p4",
    ascii: `   ♣   ♣  ⚡♣
  ♣♣♣ ♣♣♣ ♣♣♣
   |   |   |
  ____________
 [__  STAGE __]`,
    sessions: [
      { title: "The Bash", kind: "After-hours" },
      { title: "Founders social", kind: "Mixer" },
    ],
  },
];

// Port vertical positions on the source node's right edge (fan-out order).
export const PORT_TOP: Record<string, string> = {
  p1: "24%",
  p2: "43%",
  p3: "62%",
  p4: "81%",
};
