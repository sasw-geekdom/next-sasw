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

/**
 * Who runs which hour.
 *
 * The day is not one programme with five talks in it — it is four community
 * groups given a block each, which is why the running order has a five-minute
 * gap inside the DEF CON hour and a forty-minute one before SAHA's. Without
 * this the six marks in the band are a credit nobody can act on, and the gaps
 * look like mistakes.
 *
 * Windows rather than a map of session slugs, so the page does not need
 * editing when a session is entered. UTSA CyberJedis have a second talk that
 * is not in the CMS yet; it lands inside their window and picks up their name
 * the moment it is saved.
 *
 * The cost of windows is that a session moved across a boundary changes hands
 * silently. That is the right behaviour here — the block *is* the hour — but
 * it means these bounds are the thing to check if a credit ever looks wrong.
 *
 * `org` matches a name in ACCESS_ORGANIZERS, which is where the link comes
 * from. A name with no match renders as plain text rather than throwing.
 */
export interface AccessBlock {
  org: string;
  /** Local start of the window, "HH:MM" on a 24-hour clock. */
  from: string;
  /** Local end, exclusive. */
  to: string;
}

export const ACCESS_BLOCKS: readonly AccessBlock[] = [
  { org: "BSides San Antonio", from: "13:00", to: "13:45" },
  { org: "DEF CON Group San Antonio", from: "13:45", to: "14:45" },
  { org: "UTSA CyberJedis", from: "14:45", to: "15:45" },
  { org: "San Antonio Hacker Association", from: "15:45", to: "18:00" },
];

/**
 * The week runs on America/Chicago, which is UTC-5 in late September.
 *
 * Stated here rather than imported from lib/schedule's `EVENT_OFFSET`, which
 * is the same value: that module imports this one, and taking it back would
 * be a cycle. Not `new Date().getHours()` either — that reads the *server's*
 * clock, and this has to give the same answer on a machine in UTC.
 */
const EVENT_OFFSET_MINUTES = -5 * 60;

function minuteOfDay(ms: number): number {
  return Math.floor(ms / 60000 + EVENT_OFFSET_MINUTES) % 1440;
}

function hhmm(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

/** The organiser whose block a session starts in, or undefined. */
export function accessBlockFor(startsAt: number | null | undefined) {
  if (!startsAt) return undefined;
  const at = minuteOfDay(startsAt);
  const block = ACCESS_BLOCKS.find(
    (b) => at >= hhmm(b.from) && at < hhmm(b.to),
  );
  if (!block) return undefined;
  const org = ACCESS_ORGANIZERS.find((o) => o.name === block.org);
  return { name: block.org, href: org?.href };
}

export interface AccessContinuousItem {
  name: string;
  /**
   * The organisation running it, by name.
   *
   * Matched against `ACCESS_ORGANIZERS` for the link rather than carrying a
   * href of its own, so the one place this project holds an org's address
   * stays the one place. An item with no match renders its name as plain
   * text, which is the right answer for a table nobody has claimed yet.
   */
  by?: string;
  note?: string;
}

/**
 * What runs for the whole five hours, as opposed to what runs to a clock.
 *
 * There were two columns here and the second is gone: it named sessions an
 * organiser enters in the CMS, and the page listed them twice — once as static
 * copy, once through `ActivationSessions` with a time and a speaker attached.
 * This column has the opposite problem and is why the const survived being
 * pulled off the page: a lockpicking village that runs for five hours is not a
 * talk and does not want a talk's fields. Entered in the CMS it would sort
 * into the running order between two twenty-minute talks, above four things it
 * is not parallel to, and mint a talk page with an empty speaker slot.
 *
 * So it lives here and renders as its own strip under the order.
 */
export const ACCESS_CONTINUOUS: {
  label: string;
  headline: string;
  lede: string;
  items: readonly AccessContinuousItem[];
} = {
  label: "Continuous \u00b7 1:00 \u2013 6:00",
  headline: "Walk in whenever.",
  // Count-free on purpose: it read "three things run the whole afternoon"
  // until two of the three turned out never to have been confirmed, and a
  // sentence that has to be rewritten every time the list changes is a
  // sentence that will one day disagree with the list under it.
  lede: "Nothing here runs to a clock or needs a seat booked \u2014 the running order above is the part that does.",
  items: [
    {
      name: "Lockpicking village",
      by: "Alamo City Locksport",
      // Theirs, condensed. The TOOOL affiliation is the part that says this
      // is a chapter of something rather than a table with padlocks on it,
      // and the welcome is the fact most likely to decide whether somebody
      // brings their kid.
      note: "A TOOOL affiliate, picking locks in the open. Understanding how a lock fails is how you learn to protect yourself and the people around you \u2014 all ages welcome, no experience needed.",
    },
    // A cyber career & resume corner and community org tables were on the
    // original two-column spec and were never confirmed, so they are not
    // here. This list is what an organiser has said is happening.
  ],
};

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
