// The Give-a-LOT Computer Donation Drive — DEVSA with learnOPENtech, at
// Launch SA. Constants for the band and its page, kept out of lib/schedule.ts
// the way lib/the-model.ts and lib/pysa.ts are: the schedule holds where this
// sits in the week, and this holds what it looks and sounds like.
//
// ── Whose brand this is ─────────────────────────────────────────────────────
//
// Unlike The Model, none of this was invented here. Give-a-LOT arrives with a
// finished identity — a hand-lettered wordmark on an amber panel, over plum —
// and the job is to seat it in the site's system rather than to design over it.
// So the band keeps the site's grammar (black ground, Oswald wordmark, mono
// eyebrows, one button) and takes exactly two things from the partner: the
// amber, and the lockup itself.
//
// ── About the amber ─────────────────────────────────────────────────────────
//
// Worth saying plainly, because there is a rule against it three files over.
// lib/the-model.ts refuses orange on the grounds that it is "exactly the hue
// the old amber accent occupied, so anything of ours set in it read as the
// discarded system hanging on". That still holds and this does not break it.
// The distinction is whose colour it is: The Model would have been *us*
// reaching for a retired accent, while this is a partner's own brand colour
// arriving attached to a partner's own mark. It is the same argument that lets
// PySanAntonio be blue on a magenta site.
//
// The green inside learnOPENtech's wordmark is the mirror of that. Access
// Granted owns green here, and its green is #00FF66 — an electric terminal
// green. learnOPENtech's is #789C1E, an olive, and it appears only inside
// their logo where nobody reads it as an accent choice of ours. No SASTW
// element in this band is green.

/** The amber panel behind the wordmark. Reads at 11.5:1 on black. */
export const GIVE_AMBER = "#FFB400";

/**
 * The lettering plum.
 *
 * Fill only, never type. Against black this measures about 2.1:1 — it is a
 * dark colour on a dark ground, and the lockup only gets away with it because
 * there it sits on amber. Used here for the one solid block behind the
 * artwork, where it is a ground rather than something to be read.
 */
export const GIVE_PLUM = "#800069";

/** The ink an amber block knocks out. Near-black, matching the lockup's own. */
export const GIVE_INK = "#0A0A0A";

export const GIVE_A_LOT = {
  name: "Give-a-LOT",
  /**
   * The full name, for the page title and the card.
   *
   * "Give-a-LOT" alone is the wordmark and reads as a pun with no object; the
   * lockup itself sets "Computer Donation Giveaway" underneath for exactly
   * that reason. The heading in the band splits the two the same way.
   */
  fullName: "Give-a-LOT Computer Donation Drive",

  /**
   * Two dates, because this is two things.
   *
   * The drive runs Monday to Thursday as a drop-off window; the workshop and
   * the giveaway are one afternoon at the end of it. A single date line would
   * have to pick one and lose the other, and the one it would lose is the one
   * that asks the reader to do something.
   */
  driveLabel: "Drop-off · Sept 28 – Oct 1",
  dateLabel: "Friday, October 2, 2026",
  /**
   * Confirmed, from learnOPENtech's registration page.
   *
   * This said "Time to be announced" while the brief was still open, and kept
   * saying it after the hour was fixed — a band stating a day and refusing an
   * hour, above a programme that printed both.
   *
   * GIVE_A_LOT_SESSION still carries no `when`, and that is now a layout
   * decision rather than an honesty one: `when` wins over `span` in the
   * calendar projection, so setting it would take the activation off the
   * all-week rail and reduce four days of collection to one Friday block.
   */
  timeLabel: "12 – 2:30 PM",
  /**
   * The lockup, as supplied by the organisers and used as the band's title —
   * the same bargain PySanAntonio's wordmark makes, where the mark is the
   * heading and its `alt` carries the name.
   *
   * Intrinsic size off the file (629.5 x 230.2), given so the browser reserves
   * the box before the SVG lands and the copy column does not jump.
   */
  lockup: "/give-a-lot/lockup.svg",
  lockupWidth: 630,
  lockupHeight: 230,

  venue: "Launch SA",
  venueDetail: "Central Library, 1st Floor",

  /**
   * The hook, in two lines the band breaks between at `lg`.
   *
   * The arc the event actually makes: what happens to the hardware, then who
   * ends up with it. Every draft that stopped after the first half described a
   * recycling programme, which is the smaller and duller half of this — the
   * machines are the method and the people are the point.
   *
   * "Back online" is the site's own electrical metaphor doing real work for
   * once rather than being applied to something as decoration; these are
   * literally machines being switched back on.
   *
   * The tagline is two imperatives and a thesis, in that order, because this
   * page asks opposite things of two audiences — somebody with a dead laptop
   * in a closet, and somebody who needs a computer. Two doors, one each.
   *
   * The turn was "Both count.", which granted permission — either door is
   * enough — but granted it abstractly. "Nothing here is junk." is the
   * argument the table underneath then proves, and it was the section
   * heading before the section went away.
   */
  tagline: {
    setup: "Bring a machine. Take one home.",
    turn: "Nothing here is junk.",
  },
  /**
   * The two ways in, because there are two and they ask different things of
   * different readers — one is a drop-off across four days, the other is a
   * booked seat on one afternoon. This was a section below the band; it is
   * here because the band is now the page.
   */
  ways: [
    {
      label: "Donate",
      when: "Mon – Thu · Central Library",
      body: "Working laptops and desktops, monitors, keyboards, drives, chargers. No printers, no CRTs, nothing broken. Drives are erased as part of the rebuild, and certified if you need that.",
    },
    {
      label: "Receive",
      when: "Fri · 12 – 2:30 PM",
      body: "Two and a half hours on Linux and open source, and you leave with a machine — the session is the requirement, not the queue. Seats are booked with learnOPENtech and close Sept 30. First come, first served.",
    },
  ],
} as const;

/**
 * What a donated machine goes in as, and what it comes out as.
 *
 * The band's artwork under the lockup. Two columns rather than a diagram: the
 * transformation is a list of properties changing, which is a table, and
 * drawing it as a flow would have been a second node graph on a site that
 * already has one on The Model. Two events three sections apart should not
 * share a picture.
 *
 * Only the right column takes the amber. That is the whole visual idea — the
 * left side is unpowered and the right side is lit, which is the same sentence
 * the tagline makes.
 */
export const GIVE_A_LOT_STATES: readonly { before: string; after: string }[] = [
  { before: "vendor-locked", after: "linux + open source" },
  { before: "unsupported", after: "patched and current" },
  // Both halves are 16 characters, which is not a coincidence: this pair sets
  // the table's width, and the longer draft ("slow, full of telemetry") wrapped
  // its own cell to two lines while every other row held one. "tracked" was
  // chosen over "watched" for the same length and a plainer word — it is what
  // telemetry is actually called.
  //
  // Copied into tools/social-cards/cards.mjs, which cannot import from here.
  // Change both or the card and the band disagree.
  { before: "slow and tracked", after: "fast and private" },
  { before: "headed for landfill", after: "yours to keep" },
];

export interface GiveALotOrganizer {
  name: string;
  /** Matched case-insensitively against the CMS partner list. */
  partner: string;
  /** Used only when the partner row carries no `link`. */
  href?: string;
  /** Used only when the partner row is missing or carries no `imageUrl`. */
  logo?: string;
  heightClass: string;
}

/**
 * learnOPENtech, then Launch SA, then DEVSA.
 *
 * Not the order the brief credits them in — that reads "DEVSA &
 * learnOPENtech", and this ran that way first. The wall is the one place the
 * programme belongs to learnOPENtech rather than to DEVSA: the Linux and open
 * source work is theirs, and DEVSA convenes the week that it happens inside.
 * Launch SA sits between them as the room it happens in. Array order is
 * render order, so this is the whole mechanism.
 *
 * learnOPENtech and DEVSA carry a local fallback. That was because a wall of
 * two that loses one to a Firestore hiccup reads as a mistake rather than as a
 * shorter list; now that Launch SA makes three, it can rely on the CMS the way
 * The Model's third mark does.
 */
export const GIVE_A_LOT_ORGANIZERS: readonly GiveALotOrganizer[] = [
  {
    name: "learnOPENtech",
    partner: "learnopentech",
    href: "https://learnopentech.com/",
    logo: "/give-a-lot/learnopentech.svg",
    // Well under DEVSA, and the reason is width rather than height. This is a
    // 10:1 wordmark on a single line, so every pixel of height buys ten of
    // width: at h-8 it rendered 320px wide against DEVSA's 52px badge and the
    // credit line read as learnOPENtech's, with DEVSA as a footnote. At h-6
    // the two carry the same weight, which is what a "powered by" wall of
    // equal partners should look like.
    //
    // Still true now that it leads. Leading is a matter of position, and this
    // mark going up a step to match would just reintroduce the imbalance from
    // the other side.
    heightClass: "h-5 sm:h-6",
  },
  {
    // The room. Launch SA is inside the Central Library and is what the
    // registration page tells people to look for, so it belongs on the credit
    // line with the two running it.
    name: "Launch SA",
    partner: "launch sa",
    href: "https://launchsa.org/",
    // No local fallback, unlike the two above. Theirs exist because a wall of
    // two that loses one reads as a mistake; at three, a mark that fails to
    // resolve drops out and the line still reads as a list. Same bargain The
    // Model's wall makes.
    logo: "",
    // 7.4:1, between learnOPENtech's 10:1 wordmark and DEVSA's badge, so it
    // sits between their heights too — matched to learnOPENtech it would draw
    // a third wider and take the line over.
    heightClass: "h-6 sm:h-7",
  },
  {
    name: "DEVSA",
    partner: "devsa",
    href: "https://www.devsa.community/",
    // Already in the repo for Access Granted. Shared rather than copied — one
    // file, so a re-export lands on both bands at once.
    logo: "/access-granted/orgs/devsa.png",
    heightClass: "h-11 sm:h-13",
  },
] as const;

/**
 * Resolve the "powered by" wall against the CMS partner list.
 *
 * Takes the rows rather than fetching them, so this file stays free of
 * `server-only` and can be imported anywhere. Same shape as `modelOrganizers`.
 */
export function giveALotOrganizers(
  partners: readonly { name: string; imageUrl: string; link: string }[],
): { name: string; logo: string; heightClass: string; href?: string }[] {
  return GIVE_A_LOT_ORGANIZERS.flatMap((org) => {
    const match = partners.find((p) =>
      p.name.toLowerCase().includes(org.partner),
    );
    const logo = match?.imageUrl || org.logo;
    if (!logo) return [];
    const href = match?.link || org.href;
    return [
      {
        name: org.name,
        logo,
        heightClass: org.heightClass,
        ...(href ? { href } : {}),
      },
    ];
  });
}
