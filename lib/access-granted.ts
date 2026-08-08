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

  /**
   * The line the whole activation hangs on, in two halves.
   *
   * Split rather than stored whole so the turn can start its own line from lg
   * up — the sentence is a setup and a punch, and running them together buries
   * the punch mid-line. Below lg the break is suppressed and the space between
   * them survives, so it reads as one flowing sentence on a narrow column.
   */
  oneLiner: {
    setup: "Every other room this week is people talking about technology.",
    turn: "This one is people taking it apart.",
  },

  /**
   * Renamed from `lock.png` when the artwork was replaced, on purpose.
   *
   * Next's image optimizer caches by URL under `.next/cache/images`. Swapping
   * the file behind an unchanged path leaves every cache — the optimizer, the
   * browser, a CDN — serving the old render, which is exactly what happened:
   * the file on disk was right and the page showed the previous lock. Changing
   * the filename is the only fix that reaches all three.
   *
   * So: replacing this art means a new filename, not just a new file.
   */
  lock: "/access-granted/padlock.png",
  lockWidth: 907,
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
 * The orgs running it, in the order asked for.
 *
 * Marks are held locally rather than hotlinked, unlike PYSA_ORGANIZERS —
 * these arrived as files rather than from a bucket this project can watch.
 * Two needed work before they could sit on black: Alamo City Locksport came
 * as black line art on a white card, so its luminance became its alpha and
 * the ink was redrawn white; Cyber Jedis came as a JPEG whose near-black
 * field would have shown as a faint rectangle, so that was keyed out too.
 *
 * `heightClass` normalises them optically rather than mechanically — a
 * square mark needs more height than a wide wordmark to carry the same
 * weight, which is why these are not all the same number.
 *
 * San Antonio Hacker Association is deliberately absent for now. Its mark is
 * still at `public/access-granted/orgs/saha.png` and its entry was:
 *
 *   { name: "San Antonio Hacker Association",
 *     href: "https://satxhackers.com/",
 *     logo: "/access-granted/orgs/saha.png",
 *     heightClass: "h-10 sm:h-11" }
 *
 * Worth knowing before it goes back: satxhackers.com served an EXPIRED TLS
 * certificate on 2026-08-08 — the host is up and redirects http to https, but
 * the cert fails validation, so a browser shows a full-page security
 * interstitial before the site. Checked with curl: `SSL certificate problem:
 * certificate has expired`. Restore the entry without the `href` if that
 * hasn't been fixed.
 */
export const ACCESS_ORGANIZERS = [
  {
    name: "BSides San Antonio",
    href: "https://www.bsidessatx.com/",
    logo: "/access-granted/orgs/bsides.png",
    // Detailed and near-square. h-20 overshot — it became the loudest thing
    // in the row rather than the first of five equals.
    heightClass: "h-12 sm:h-14",
  },
  {
    name: "DEF CON Group San Antonio",
    href: "https://dcgsatx.com/",
    logo: "/access-granted/orgs/defcon.png",
    // Taller than its ratio alone would suggest: the skyline occupies the top
    // of the artwork and the DCG-SATX wordmark only the lower half, so matched
    // on box height it read smaller than every mark beside it.
    heightClass: "h-12 sm:h-14",
  },
  {
    name: "UTSA CyberJedis",
    href: "https://www.instagram.com/utsacyberjedis/",
    logo: "/access-granted/orgs/cyberjedis.png",
    // The badge sits above a small wordmark, so this is the mark that most
    // needs height before it resolves into anything.
    heightClass: "h-16 sm:h-18",
  },
  {
    name: "Alamo City Locksport",
    href: "https://www.devsa.community/buildingtogether/alamo-city-locksport",
    logo: "/access-granted/orgs/locksport.png",
    // Same reasoning as DCG-SATX: the Alamo fills the box and the wordmark is
    // a thin line beneath it, so matching on box height sold it short.
    heightClass: "h-16 sm:h-20",
  },
  {
    name: "DEVSA",
    href: "https://www.devsa.community/",
    logo: "/access-granted/orgs/devsa.png",
    heightClass: "h-9 sm:h-10",
  },
] as const;
