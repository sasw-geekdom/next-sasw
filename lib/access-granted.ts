// Access Granted — the security and hacker activation, and the second thing
// inside Startup + Tech Week with a brand of its own.
//
// Modelled on lib/pysa.ts deliberately: an activation big enough to carry its
// own band gets its own constants file, so the band, the page, the calendar
// entry and the structured data all read the same values and cannot drift
// about when or where it runs.

/**
 * Terminal green — the accent, deliberately not SASTW's magenta.
 *
 * From the brand spec, and it agrees with the artwork: the padlock render
 * glows around #98f8b0, which is the same hue (~137°) read back through an
 * emissive surface. This is that hue at full saturation, which is what small
 * text and 1px borders need — the glow itself is too pale to sit on black as
 * type.
 *
 * The spec's alternative ink (#0F1115) is *not* used as a ground here. PySA
 * tried a second near-black on a site whose sections are otherwise pure black
 * and it read as drift rather than as the brand's palette; that band sits on
 * site black now. Same reasoning, same decision — the brand carries through
 * the green, not the floor.
 */
export const ACCESS_GREEN = "#00ff66";

/** Hardware amber, for the second rank of callouts. From the same spec. */
export const ACCESS_AMBER = "#ffb800";

export const ACCESS_GRANTED = {
  name: "Access Granted",
  dateLabel: "Wednesday, September 30, 2026",
  timeLabel: "1:00 – 6:00 PM",
  venue: "Geekdom",
  venueDetail: "3rd Floor",

  /** The line the whole activation hangs on. */
  oneLiner:
    "Every other room this week is people talking about technology. This one is people taking it apart.",

  lock: "/access-granted/lock.png",
  lockWidth: 927,
  lockHeight: 1400,
} as const;

/**
 * The pill tags, which answer the three questions a security room gets asked
 * before anyone commits an afternoon to it.
 */
export const ACCESS_BADGES = [
  "Free · drop-in",
  "All skill levels",
  "No sales pitches",
] as const;

export interface AccessTrack {
  /** Terminal-style label, rendered in mono caps. */
  label: string;
  note: string;
  items: readonly string[];
}

/**
 * Two columns, as the spec lays them out: what runs continuously for five
 * hours, and what runs to a clock.
 */
export const ACCESS_TRACKS: readonly AccessTrack[] = [
  {
    label: "Continuous · 1:00 – 6:00",
    note: "Walk in whenever. Nothing here needs a seat booked.",
    items: [
      "Lockpicking village",
      "Cyber career & resume corner",
      "Community org tables",
    ],
  },
  {
    label: "Workshops & hacker track",
    note: "Zero-pitch technical sessions on real exploits, OSINT and vulnerabilities.",
    items: [
      "Threat-modeling workshop for founders",
      "Three technical lightning talks",
      "CFP first-time speaker slot",
    ],
  },
] as const;

/**
 * The orgs running it.
 *
 * Names only — no logos have landed for these yet, and the spec's own layout
 * calls for a text partner wall rather than a logo row. When marks arrive,
 * this gains a `logo` field and the wall renders them; the shape is
 * deliberately close to PYSA_ORGANIZERS so that change is small.
 */
export const ACCESS_ORGANIZERS = [
  { name: "DEF CON Group San Antonio", short: "DEF CON Group SATX" },
  { name: "San Antonio Hacker Association", short: "SAHA" },
  { name: "Alamo City Locksport", short: "Alamo City Locksport" },
  { name: "UTSA CyberJedis", short: "UTSA CyberJedis" },
  { name: "BSides San Antonio", short: "BSides SATX" },
  { name: "DEVSA", short: "DEVSA" },
] as const;
