import { CIRCUIT_SPONSORS } from "@/lib/circuit-sponsors";
import type { TrackName } from "@/lib/tracks";

// The 2026 sponsor report, as data. The words are the report's own — it was
// written and signed off outside this repo, so every string here is copied
// from it verbatim and only the presentation is ours. Edit the report, then
// this; never the other way round.
//
// Photos are the week's: the homepage recap set (public/home/recap) and the
// report's own additions (public/sponsor-report).

export interface ReportStat {
  value: string;
  label: string;
  sub?: string;
  /** Set in magenta — the report's own emphasis. */
  accent?: boolean;
}

export const WEEK_STATS: ReportStat[] = [
  {
    value: "1,638+",
    label: "Registered across SASTW + partner events",
    sub: "1,138 through the central platform, plus ~500 across partner-hosted events",
    accent: true,
  },
  {
    value: "72",
    label: "Curated sessions",
    sub: "Across Founder, Tech & Builders, AI, Small Business, and Capital Circuits",
  },
  {
    value: "87",
    label: "Speakers on stage",
    sub: "Local founders, operators, investors, and technologists",
  },
  {
    value: "5",
    label: "Days downtown",
    sub: "Monday through Friday · Sept 28 – Oct 2",
  },
  {
    value: "4",
    label: "Anchor venues",
    sub: "TPR · The Rand · Central Library · 300 Main",
  },
  {
    value: "73%",
    label: "First-time attendees",
    sub: "Three in four showed up to SASTW for the first time",
    accent: true,
  },
];

export interface ReportRow {
  label: string;
  value: string;
  /** Bar length, 0–1. */
  share: number;
}

/** Counts, with each bar drawn against the largest in its list. */
function counted(rows: [string, number][]): ReportRow[] {
  const max = Math.max(...rows.map(([, n]) => n));
  return rows.map(([label, n]) => ({
    label,
    value: n.toLocaleString("en-US"),
    share: n / max,
  }));
}

export const WHO_THEY_ARE = counted([
  ["Small business owners & solopreneurs", 276],
  ["Founders (all stages)", 200],
  ["Students", 156],
  ["Engineers & technical builders", 84],
  ["Ecosystem builders & nonprofits", 39],
  ["Corporate innovation & partnerships", 35],
  ["Investors (angel, VC, family office)", 21],
]);

/** Percentages, so each bar is its own share of the whole. */
export const WHERE_FROM: ReportRow[] = (
  [
    ["San Antonio metro", 84],
    ["Elsewhere in Texas", 6],
    ["Out of state", 2],
  ] as const
).map(([label, pct]) => ({ label, value: `${pct}%`, share: pct / 100 }));

export const INDUSTRIES = counted([
  ["Services & consulting", 157],
  ["Software / SaaS", 113],
  ["AI / applied AI", 104],
  ["Cybersecurity", 90],
  ["Media / creative", 65],
  ["Healthcare / biotech", 47],
  ["CPG / food & beverage", 30],
  ["Fintech", 22],
]);

/** Most-picked first, which is also the order the charge steps down in. */
export const CIRCUIT_PICKS: { name: TrackName; count: string; pct: number }[] = [
  { name: "Small Business & Solopreneur", count: "568", pct: 62 },
  { name: "AI & Applied Innovation", count: "567", pct: 62 },
  { name: "Tech & Builders", count: "561", pct: 61 },
  { name: "Founder", count: "471", pct: 52 },
  { name: "Capital", count: "324", pct: 35 },
];

export interface ReportPhoto {
  src: string;
  w: number;
  h: number;
  alt: string;
}

const photo = (n: string, w: number, h: number, alt: string): ReportPhoto => ({
  src: `/home/recap/r${n}.jpg`,
  w,
  h,
  alt,
});

export const LONG_HAUL = photo("13", 1600, 1069, "The Long Haul panel on the Texas Public Radio main stage, with Nopalera signage beside the stage");
export const READINESS_GAP = photo("10", 1069, 1600, "Janie Martinez Gonzalez at the lectern for The Readiness Gap");
export const TPR_STAGE = photo("12", 1200, 800, "A speaker at the lectern on the Texas Public Radio main stage");
export const ACCESS_GRANTED = photo("09", 675, 1200, "Hands on the lockpicking table at Access Granted");
export const NOPALERA_GROUP = photo(
  "22",
  801,
  1200,
  "Nopalera founder and CEO Sandra Velasquez, center, after her session, in front of the Founder Circuit screen presented by Nopalera",
);
export const BEHIND_THE_BUILD = photo("06", 800, 1200, "Behind the Build: The Denim Group Story, a three-person panel on stage");

const week = (n: string, w: number, h: number, alt: string): ReportPhoto => ({
  src: `/sponsor-report/week-${n}.jpg`,
  w,
  h,
  alt,
});

export const LUIS_MARTINEZ = week("09", 1067, 1600, "Luis Martinez pointing up into the audience during his session");

const ADDED: ReportPhoto[] = [
  week("01", 1069, 1600, "Three panelists in conversation on a dark stage"),
  week("02", 1600, 1068, "A packed room mingling between sessions"),
  week("03", 1068, 1600, "Attendees smiling in the audience during a session"),
  week("04", 1600, 1069, "Attendees at tables during a small business session"),
  week("06", 1600, 1260, "A speaker on a magenta-lit stage between two screens"),
  week("07", 1067, 1600, "Attendees talking over drinks at a networking hour"),
  week("08", 1067, 1600, "A crowded room at the coffee bar"),
  LUIS_MARTINEZ,
  week("10", 1067, 1600, "Two attendees talking between rows of seats"),
];

const RECAP_PHOTOS: ReportPhoto[] = [
  LONG_HAUL,
  READINESS_GAP,
  BEHIND_THE_BUILD,
  photo("18", 1600, 1069, "Five panelists on stage under a screen reading Pre-Seed in the Age of AI"),
  photo("19", 1200, 800, "A speaker on the main stage beside a slide of a canned tea"),
  photo("15", 1200, 900, "The AWS User Group crowd posing in front of its banner"),
  photo("11", 1200, 800, "A speaker presenting on the Texas Public Radio main stage"),
  photo("08", 1200, 800, "A 1 Million Cups session, its welcome slide on the screen"),
  photo("16", 1200, 800, "The LISC San Antonio team and guests in front of the LISC banner"),
  photo("23", 1067, 1600, "A speaker presenting in front of a Launch SA banner"),
  photo("17", 1200, 800, "A full room of attendees at tables during a session"),
  TPR_STAGE,
  ACCESS_GRANTED,
  photo("02", 1200, 960, "Founders talking beside the Mission Pitch banner"),
  photo("20", 1200, 800, "A speaker walking the main stage beside his slides"),
  photo("05", 1600, 1067, "Two attendees in front of the Startup + Tech Week wall"),
  photo("21", 1200, 800, "Attendees networking under purple light"),
  photo("01", 798, 1200, "An audience at tables, watching a session"),
  photo("25", 1200, 800, "A packed room at PySanAntonio"),
  photo("07", 801, 1200, "A speaker with a microphone on a dark stage"),
  photo("14", 675, 1200, "An attendee at a workstation in a busy room"),
  photo("24", 1200, 800, "Three attendees working together around a laptop"),
  NOPALERA_GROUP,
  photo("00", 1067, 1600, "A panel on a lit stage between two Startup + Tech Week screens"),
  photo("03", 784, 1200, "Attendees seated along a wall, listening"),
  photo("04", 800, 1200, "An attendee smiling in conversation"),
  photo("26", 1067, 1600, "An attendee laughing beside someone in an orange suit"),
];

/**
 * The gallery: the recap set with the additions dealt in through it, one
 * every third photo, so the new ones read as part of the week rather than an
 * appendix at the bottom.
 */
export const WEEK_PHOTOS: ReportPhoto[] = RECAP_PHOTOS.flatMap((p, i) =>
  i % 3 === 2 && ADDED[(i - 2) / 3] ? [p, ADDED[(i - 2) / 3]] : [p],
);

export const RESPONSE_STATS: ReportStat[] = [
  { value: "85%", label: "Say they'll be back in 2027", accent: true },
  { value: "8.5", label: "Average attendee rating (of 10)" },
  { value: "174", label: "Registered to volunteer" },
  { value: "58%", label: "Opted in to sponsor contact", accent: true },
];

/** Promoters, passives, detractors — the split behind the score. */
export const NPS_SPLIT = [75, 15, 10] as const;

export const QUOTES = [
  `"I love Luis Martinez's presentation — speaking truth to founders is so incredibly valuable!"`,
  `"Nopalera — made me proud to be from San Antonio."`,
  `"I presented at the Access Granted track on Wednesday. It was my first time presenting at a conference like this and I really appreciated the people and crowd that gathered there."`,
  `"TPR presented the most compelling sessions. Mainly those that shared their lessons learned, AI opportunities and platforms that best support it."`,
  `"Hearing Janie Gonzalez talk about her resilience."`,
  `"The cyber sessions on Wednesday were on point and interactive. We loved the talk from the CEO of Capital Factory as well."`,
];

export const CHANNELS: { name: string; rows: [string, string][] }[] = [
  {
    name: "Email Campaign",
    rows: [
      ["Campaigns sent", "15"],
      ["Total sends", "141,402"],
      ["Subscriber list", "9,829"],
      ["Avg open rate", "9.6%"],
      ["Unsub rate", "0.20%"],
    ],
  },
  {
    name: "Instagram",
    rows: [
      ["Posts", "117"],
      ["Content views", "70.8K"],
      ["Reach", "23.9K"],
      ["Reactions", "1,300"],
      ["Net new followers", "125"],
    ],
  },
  {
    name: "LinkedIn",
    rows: [
      ["Posts", "40"],
      ["Impressions", "19.6K"],
      ["Reach", "11.9K"],
      ["Engagement rate", "12.5%"],
      ["Net new followers", "222"],
    ],
  },
];

export const PRESS: { name: string; items: { outlet: string; text: string }[] }[] = [
  {
    name: "Broadcast TV",
    items: [
      {
        outlet: "KENS 5 (CBS)",
        text: "Opening-day live segment and web feature. Covered Launch SA kickoff, speed-networking, pitch competitions, an interview with Geekdom CEO Charles Woodin, and a founder spotlight on Janay Branham (ClosureCast).",
      },
      {
        outlet: "KSAT 12 (ABC)",
        text: "Pre-event ecosystem feature on small business survival rates in SA, spotlighting Launch SA and AI founder Michelle Gimbel (3E AI Solutions).",
      },
    ],
  },
  {
    name: "Digital & National",
    items: [
      {
        outlet: "Axios San Antonio",
        text: "Comprehensive pre-event reader guide on downtown programming for local founders and solopreneurs.",
      },
      {
        outlet: "Hoodline San Antonio",
        text: "Event preview on open-access sessions across the downtown tech corridor.",
      },
      {
        outlet: "Yahoo News",
        text: "Syndicated KENS 5 reporting to a national digital audience.",
      },
    ],
  },
  {
    name: "Community video & podcasts",
    items: [
      {
        outlet: "DEVSA",
        text: "and local podcasts documented twelve technical activations across AI, cybersecurity, Linux, and Python — plus live on-site podcast recordings and main-stage builder talks at Texas Public Radio.",
      },
    ],
  },
];

/** The three circuit spotlights: whose circuit, and the photo that shows it. */
export const SPOTLIGHTS: { circuit: TrackName; photo: ReportPhoto; caption: string }[] = [
  {
    circuit: "Founder",
    photo: LONG_HAUL,
    caption: "Nopalera on signage at The Long Haul · Thursday mainstage",
  },
  {
    circuit: "AI & Applied Innovation",
    photo: READINESS_GAP,
    caption: "Janie Martinez Gonzalez · The Readiness Gap · Webhead on screen",
  },
  {
    circuit: "Tech & Builders",
    photo: BEHIND_THE_BUILD,
    caption: "Behind the Build · The Denim Group Story · Google for Startups on signage",
  },
];

export const IMPACT: ReportStat[] = [
  {
    value: "72",
    label: "Curated sessions produced",
    sub: "Programming across five days — all free to attend for the community.",
  },
  {
    value: "4",
    label: "Anchor venues activated",
    sub: "TPR, The Rand at Geekdom, Central Library, and 300 Main — downtown as home base.",
  },
  {
    value: "1,638+",
    label: "Residents reached directly",
    sub: "Across SASTW programming and partner-hosted events during the week.",
  },
  {
    value: "$0",
    label: "Attendee cost",
    sub: "The week stays free for the community because sponsors like you power it.",
  },
];

/**
 * Who powered what, past the circuits. Org names match the CMS sponsor and
 * partner rows, which supply the marks; one with no row falls back to
 * LOCAL_MARKS, and failing that is set as type in the logo's place.
 */
export const POWERING: { lead: string; title: string; orgs: string[] }[] = [
  { lead: "Powering", title: "Startup Bash", orgs: ["Active Capital", "Downtown West"] },
  { lead: "Powering", title: "CPG Main Stage sessions", orgs: ["H-E-B Supplier Diversity"] },
  {
    lead: "Powering",
    title: "Small Business Activations at Launch SA",
    orgs: ["PNC Bank", "LISC San Antonio"],
  },
  { lead: "2026", title: "Media Partners", orgs: ["San Antonio Report", "Texas Public Radio", "KSAT"] },
  {
    lead: "Powering",
    title: "the Current all week",
    orgs: ["80/20 Foundation", "Students + Startups", "Geekdom", "Launch SA", "Accelerate South Texas"],
  },
];

/**
 * Marks for orgs this report credits that the CMS doesn't carry.
 *
 * PNC Bank backed the small business activations but isn't a sponsor or
 * partner row. Its mark is PNC's own logo (Wikimedia Commons, PNClogo.svg)
 * cut the way PNC reverses it on its own site for dark grounds — the blue
 * wordmark turned white, the orange mark kept — since blue type disappears on
 * this page's black.
 */
export const LOCAL_MARKS: Readonly<Record<string, { imageUrl: string; link: string }>> = {
  "PNC Bank": { imageUrl: "/brand/pnc-logo-rev.svg", link: "https://www.pnc.com/" },
};

/**
 * The report's sections, in page order: the anchor each one carries (so
 * Geekdom can send /sponsor-report#press) and its eyebrow, which is what the
 * progress rail labels it with — the report's own words, not new ones.
 */
export const SECTIONS = [
  { id: "numbers", label: "The week in numbers" },
  { id: "audience", label: "Who showed up" },
  { id: "circuits", label: "Five Circuits" },
  { id: "photos", label: "The week in photos" },
  { id: "response", label: "What the community said" },
  { id: "reach", label: "Reach beyond the room" },
  { id: "press", label: "Press coverage" },
  { id: "sponsors", label: "Where sponsors showed up" },
  { id: "roster", label: "Already plugged in" },
  { id: "impact", label: "What you enabled" },
  { id: "thank-you", label: "See you in 2027" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** The designed PDF, rendered from /sponsor-report/print by `pnpm report:pdf`. */
export const REPORT_PDF = "/SASTW-2026-Sponsor-Report.pdf";

/**
 * The attendee quotes, given an order of their own: two set as headlines over
 * the people they're about, two beside the photo of who they name, and two as
 * they stand. The words are QUOTES', untouched; this only decides weight.
 *
 * A quote gets a photo only when the photo shows who or what it is about.
 * The two Access Granted quotes stand without one: there are no photos of
 * that track's speakers, and the lockpicking table would put a face on a
 * presenter it isn't.
 *
 * Nopalera's leads because it is a sponsor praised by name, unprompted, in a
 * report written for sponsors — set over its founder, Sandra Velasquez, after
 * her session, in front of the circuit Nopalera presented. `accent` is the
 * word picked out in magenta — a word already in the quote, never an
 * addition. `pos` is the crop, held on faces.
 */
export const FEATURED_QUOTES: { quote: string; accent: string; photo: ReportPhoto; pos: string }[] = [
  { quote: QUOTES[1], accent: "Nopalera", photo: NOPALERA_GROUP, pos: "50% 25%" },
  { quote: QUOTES[4], accent: "resilience", photo: READINESS_GAP, pos: "50% 30%" },
];

export const PHOTO_QUOTES: { quote: string; photo: ReportPhoto; pos: string }[] = [
  { quote: QUOTES[0], photo: LUIS_MARTINEZ, pos: "50% 38%" },
  { quote: QUOTES[3], photo: TPR_STAGE, pos: "50% 50%" },
];

export const PLAIN_QUOTES = [QUOTES[2], QUOTES[5]];

/** A quote split around its accent word, for setting that word apart. */
export function splitAccent(quote: string, accent: string): [string, string, string] {
  const i = quote.indexOf(accent);
  return i === -1 ? [quote, "", ""] : [quote.slice(0, i), accent, quote.slice(i + accent.length)];
}

/**
 * Who "The full backing roster" shows: the organizations the report itself
 * credits — the three circuit sponsors, then everyone in the POWERING bands,
 * in that order — rather than every sponsor and partner row in the CMS. Built
 * from those two lists, so the roster can't credit someone the report doesn't
 * or miss someone it does. The CMS still supplies each mark.
 */
export const ROSTER: string[] = [
  ...new Set([
    ...SPOTLIGHTS.map((s) => CIRCUIT_SPONSORS[s.circuit]).filter((n): n is string => Boolean(n)),
    ...POWERING.flatMap((b) => b.orgs),
  ]),
];
