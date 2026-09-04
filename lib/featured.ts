import "server-only";

import { allSessions, resolveSessions, whenShort } from "@/lib/schedule";
import { listTalks } from "@/lib/talks";
import { listSponsors } from "@/lib/admin/cms-queries";
import { sponsorMark } from "@/lib/sponsor-marks";

/**
 * The lineup in the schedule hero, in the order it is drawn.
 *
 * Curated rather than derived: this is the team's pick of what the week is
 * about, and no rule over the data produces it. Three kinds, because the four
 * they picked are three different things —
 *
 *   activation — a page under /schedule
 *   talk       — a CMS session with its own page under /schedule/talk
 *   tba        — announced before it exists
 *
 * `credit` is the "powered by" line. It is text and not a mark on purpose:
 * neither PNC Bank nor Active Capital is in the sponsors or partners
 * collection, so there is no logo to draw. Add them there and this can take
 * their marks instead.
 */
/**
 * A line in the bill: words, or a mark set inline among them.
 *
 * Two of these rows read better with a logo standing in for a word — the talk
 * is about Nopalera and the party is the week's own — so a title is a list of
 * parts rather than a string.
 */
export type BillPart =
  | { text: string; className?: string }
  | {
      src: string;
      alt: string;
      /** Tailwind height, matched to the cap height of the line it sits in. */
      h: string;
      /** Cancels transparent margin baked into the file. See `BASH_TRIM`. */
      mr?: string;
      /**
       * Both CMS sponsor marks are pure white on transparent — one colour
       * each, checked — and the hero's ground is white. `brightness-0` puts
       * them back to black, which costs no brand colour because there is none
       * in the file. The house mark needs none: it ships a black SVG.
       */
      darken?: boolean;
    };

export interface FeaturedEntry {
  key: string;
  /** Day and room, where they are known. */
  meta: string;
  title: BillPart[];
  credit?: BillPart[];
  href?: string;
}

/*
 * Trimmed copies of the two CMS sponsor marks, vendored under public/brand.
 *
 * Both arrive with heavy transparent padding — Google's is 367px of its 4902
 * width on the left and 33% of its height overall — and that padding is not
 * something a layout can size around. It made the mark render small (a height
 * set on the box is spent on empty pixels) and left a gap beside the word
 * before it that no `gap` value could close, because the space was inside the
 * image.
 *
 * Cropping to the ink is what makes the heights below mean what they say. The
 * cost is that these no longer track a logo replaced in the admin; if a
 * sponsor sends new artwork, re-trim it the same way.
 */

/*
 * The house lockup: three numbers that only mean anything together.
 *
 * Sizing it so the logo's own last word and the word after it match was the
 * first pass, and it produced a row visibly taller than the three above it —
 * the bracket around "SA" runs 2.5x the cap height of the type inside it, so
 * matching the *letters* to their neighbours makes the *mark* tower over
 * them. What the row wants is the lockup scaled as one object until the mark
 * sits in the line, with the accent word riding it down. Hence a scale
 * factor, not three independent sizes: `BASH_WORD` is the fraction, and
 * `BASH_LOGO_H` is that fraction of the height the letters would need.
 *
 * The letters' own ratio, measured here rather than borrowed: this SVG's
 * wordmark is 30.0% of its height and Oswald's cap is 0.850em, so a full-size
 * lockup is 0.850/0.300 = 2.83em. At 0.79 that is 2.21em. (The calendar
 * block's 30.5%/0.819em come off its PNG, which is cut differently — using
 * them here put "BASH" 5% over "WEEK".)
 *
 * Weight 400 and normal tracking, which is the other half of "even" and the
 * half size alone does not buy. The bill's own Oswald 700 with tight tracking
 * reads beside the wordmark as a different face; 500, the first correction,
 * still measured 10px of stem against the wordmark's 8px at 3x — 1.25x, which
 * is what makes a matched cap height still look mismatched. 400 measures 8px
 * on 8px. Not 600: app/layout.tsx loads 400, 500 and 700 only, so 600 is a
 * weight the browser synthesises.
 *
 * `BASH_TRIM` cancels the transparent margin on the SVG's right edge, which
 * lands between the mark and the word on top of the flex gap. It does not
 * scale with the other two — the margin tracks the logo's height while the
 * flex gap tracks the row's font size — so it is measured, not derived: the
 * target is the 19px the wordmark puts between "TECH" and "WEEK" at 3x, and
 * 0.43em is what lands on it.
 */
const BASH_LOGO_H = "h-[2.21em]";
const BASH_WORD = "font-normal tracking-normal text-[0.79em]";
const BASH_TRIM = "mr-[-0.43em]";

// Now that the box is the ink, these are the drawn sizes.
const NOPALERA_H = "h-[0.86em]";
const CREDIT_H = "h-[1.35em]";

/** Resolve the lineup against the schedule, the CMS and the sponsor marks. */
export async function featuredLineup(): Promise<FeaturedEntry[]> {
  const sessions = resolveSessions(allSessions());
  const [talks, sponsors] = await Promise.all([
    listTalks().catch(() => []),
    listSponsors().catch(() => []),
  ]);
  const markOf = (name: string) =>
    sponsors.find((x) => x.name.trim().toLowerCase() === name.toLowerCase())
      ?.imageUrl ?? "";

  // Present in the CMS, and checked here so a mark pulled from the sponsor
  // list stops appearing in the hero rather than 404ing from public/. The
  // trimmed cut is chosen by `sponsorMark`, which the circuit line uses too —
  // the two local copies were made for this bill and are now shared.
  const nopaleraRow = markOf("Nopalera");
  const nopalera = nopaleraRow ? sponsorMark("Nopalera", nopaleraRow) : "";
  const googleRow = markOf("Google for Startups");
  const google = googleRow ? sponsorMark("Google for Startups", googleRow) : "";

  /*
   * Rows carry the day they happen, and the bill is sorted on it at the end.
   *
   * The order the week's team sent these in was Nopalera, Bon Sethi, 1 Million
   * Cups, Bash — which renders as SEP 29, OCT 1, SEP 30, OCT 1. Every row
   * leads with its date, so a list that announces four dates and then doesn't
   * run in order reads as a bug rather than as billing, and this is the top of
   * the page whose whole job is telling you when things are.
   *
   * The key is the calendar day, not a timestamp, because one of these has no
   * time to sort on: Bon Sethi has no session record yet, only a day. Sorting
   * by day and letting `sort`'s stability hold the team's order inside a day
   * puts him ahead of the 6pm Bash without inventing an hour for him. When his
   * session lands this can take `startsAt` like the others.
   */
  const out: { day: string; entry: FeaturedEntry }[] = [];
  const dayOf = (iso: string | number) =>
    new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  // The talk, with the company's mark standing in for its name.
  const t = talks.find(
    (x) => x.row.slug === "building-nopalera-on-her-own-terms",
  );
  if (t) {
    const when = new Date(t.row.startsAt);
    out.push({
      day: dayOf(t.row.startsAt),
      entry: {
        key: t.row.slug,
        meta: [
          when.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "America/Chicago",
          }),
          t.room?.name,
        ]
          .filter(Boolean)
          .join(" · "),
        title: nopalera
          ? [
              { text: "Building" },
              { src: nopalera, alt: "Nopalera", h: NOPALERA_H, darken: true },
              { text: "on Her Own Terms" },
            ]
          : [{ text: t.row.title }],
        href: `/schedule/talk/${t.row.slug}`,
      },
    });
  }

  // Announced before it exists: a name, who it is with, and now when and
  // where. Still no arrow — an arrow promises somewhere to go, and there is no
  // session behind this yet. The day and room are stated here rather than read
  // off a record for the same reason; when the session lands, this entry
  // becomes a `talk` lookup like the first one and the line comes from the CMS.
  out.push({
    day: "2026-10-01",
    entry: {
      key: "bon-sethi",
      meta: "Thu, Oct 1 · Texas Public Radio",
      title: [{ text: "Bon Sethi" }],
      credit: google
        ? [
            { text: "with" },
            {
              src: google,
              alt: "Google for Startups",
              h: CREDIT_H,
              darken: true,
            },
          ]
        : [{ text: "with Google for Startups" }],
    },
  });

  // The credit comes off the session, not out of this file. Both of these
  // now state their presenting partner in lib/schedule.ts so their own pages
  // can print it, and a bill that repeated the fact would be the second copy
  // to go stale when a sponsor changes.
  for (const page of ["1-million-cups", "startup-bash"] as const) {
    const sn = sessions.find((x) => x.page === page);
    if (!sn) continue;
    const credit = sn.poweredBy?.length
      ? `powered by ${sn.poweredBy.map((o) => o.name).join(" and ")}`
      : null;
    out.push({
      day: dayOf(sn.when!.start),
      entry: {
        key: sn.slug,
        meta: [sn.when ? whenShort(sn.when).day : null, sn.venue.name]
          .filter(Boolean)
          .join(" · "),
        // Startup Bash is the one activation the week runs itself, so it wears
        // the house mark and the word that makes it a party — the same lockup
        // its calendar block builds, in the black SVG this ground needs.
        title:
          page === "startup-bash"
            ? [
                {
                  src: "/brand/sastw-horizontal-black.svg",
                  alt: "Startup + Tech Week",
                  h: BASH_LOGO_H,
                  mr: BASH_TRIM,
                },
                { text: "Bash", className: BASH_WORD },
              ]
            : [{ text: sn.shortTitle ?? sn.title }],
        credit: credit ? [{ text: credit }] : undefined,
        href: `/schedule/${sn.page}`,
      },
    });
  }

  // Stable, so rows sharing a day keep the order the team sent them in.
  return out.sort((a, b) => a.day.localeCompare(b.day)).map((x) => x.entry);
}
