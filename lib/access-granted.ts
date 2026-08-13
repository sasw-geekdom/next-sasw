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

/**
 * The schematic field the padlock sits in — a hairline grid for its glow to
 * fall on, so the render reads as being in a space rather than pasted onto
 * one. Shared by the band and the homepage spotlight; a value that lived in
 * one of them would drift from the other.
 */
export const GRID_LINE = "rgba(255,255,255,0.055)";

/**
 * And the mask that stops it. Tiled to the section edges the grid stops being
 * a hint and becomes wallpaper, so it is an ellipse centred on the artwork
 * rather than on its (much wider) box.
 */
export const GRID_FADE =
  "radial-gradient(ellipse 58% 62% at 68% 52%, black 0%, black 20%, transparent 74%)";

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

export interface AccessTrack {
  /** Terminal-style label, rendered in mono caps. */
  label: string;
  note: string;
  items: readonly string[];
}

/**
 * Two columns, as the spec lays them out: what runs continuously for five
 * hours, and what runs to a clock.
 *
 * **Not currently rendered anywhere.** Pulled off the slug page because the
 * second column names sessions an organiser will enter in the CMS, and the
 * page would then list them twice in two formats — once as static copy here,
 * once through ActivationSessions with a time and a speaker attached.
 *
 * Kept rather than deleted because the first column is still true and still
 * has no better home: a lockpicking village that runs for five hours isn't a
 * talk and doesn't want a talk's fields. If this comes back, it should be that
 * column only.
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
    name: "San Antonio Hacker Association",
    href: "https://www.devsa.community/buildingtogether/saha",
    logo: "/access-granted/orgs/saha.png",
    // 44px is what the ink maths asks for at 57.3% coverage and a 1.81 ratio
    // — the same value it carried before it came out, arrived at again from
    // the rebalanced wall rather than restored on faith.
    heightClass: "h-10 sm:h-11",
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
