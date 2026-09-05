import "server-only";

import { clockLabel, weekCalendar } from "@/lib/schedule";
import type { CalendarBrand, CalendarItem } from "@/lib/schedule";

/**
 * The week projected down to a snapshot.
 *
 * Named "board" rather than "reel" because it stopped being one. A reel is a
 * thing that travels, and the two builds that did travel — a 170vh sticky
 * stage, then a scroll-driven pan — both defeated the point: a snapshot has
 * to be seen at once. What shipped is five static columns, which is a board.
 * The name outlived the idea by two rewrites.
 *
 * Server half of the home page's week CTA, split from the component for the
 * reason week-strip.tsx gives: lib/schedule pulls in lib/locations and every
 * room's copy, images and coordinates, and the client only ever needed a
 * title, a time, a venue name and a flag. Everything below is a string by the
 * time it crosses.
 *
 * Built on `weekCalendar`, which is what /schedule draws, rather than on
 * `scheduleByDay`.
 *
 * That is a correctness fix, not tidying. `scheduleByDay` reads
 * `allSessions()` — the activations curated in code — and cannot see a single
 * row an organiser enters in the CMS. So the homepage counted 19 while
 * /schedule listed 20, the missing one being the Nopalera talk; and with TPR
 * bringing twenty more sessions the snapshot would have gone on promising 19
 * ways in while the schedule showed forty. A CTA whose whole job is to say
 * how much is on cannot be blind to most of it.
 *
 * `scheduleByDay` also filters to `s.when`, which silently drops Give-a-LOT —
 * the one activation that runs Monday to Friday rather than at an hour. On a
 * week grid that omission is invisible; on a reel whose whole subject is the
 * shape of the week, the thing that literally spans it is the most
 * reel-shaped item there is. `weekCalendar` hands it back as a span, so it
 * draws as a bar over the days rather than a card inside one.
 *
 * What this file still adds is the spotlight: the camera has to know where to
 * settle, and "biggest" is not a property the schedule carries.
 */

/**
 * Which activation leads its day.
 *
 * A snapshot has room for one or two names a column, so something has to
 * choose. These are the week team's picks, and a day holding none of them
 * falls back to whatever runs first — a column showing its 9 AM is a truer
 * snapshot than a column showing nothing.
 */
const SPOTLIT = new Set([
  "the-model",
  // Tuesday leads on the talk rather than the evening. Both are spotlit, and
  // a spotlit pair keeps the day's own order, so naming this one is what puts
  // 1 PM ahead of 4 PM in the column.
  "building-nopalera-on-her-own-terms",
  "college-night",
  // Latin Tech Pitch over 1 Million Cups on the Wednesday. Both run that day
  // and only two lead a column; the pitch competition is the one with $110k
  // on the table and its own lockup, where 1 Million Cups is the weekly format
  // that runs all year. It keeps its place on the schedule and in the day's
  // "+N more" — this decides which two the homepage leads with, not what is
  // on.
  "latin-tech-pitch",
  "access-granted",
  "linux-satx",
  "startup-bash",
  // Friday opens on the brunch and closes on PySanAntonio, which is the order
  // the day runs in — 10 AM then 1 PM. Both were always going to show, since
  // Friday holds exactly two; spotlighting the earlier one is what decides
  // which is on top.
  "alamo-angels-venture-brunch",
  "pysanantonio",
]);

export interface BoardItem {
  slug: string;
  title: string;
  /**
   * The organisers' full title, for the card that has the width for it.
   *
   * The board's cards are ~380px wide — wider than a week column — so they
   * take the same `fullTitle` the schedule's day view takes rather than the
   * cut-to-fit `shortTitle`.
   */
  longTitle: string;
  /**
   * Where the card links, and what keys the inline wordmark.
   *
   * `TITLE_MARKS` is keyed on the URL slug rather than on a session id — see
   * the note there — so the mark cannot be drawn without it.
   */
  href: string | null;
  /** The presenting partner, already joined. "PNC Bank", "Active Capital". */
  poweredBy?: string;
  /**
   * The room's short name, for the card's meta row.
   *
   * The schedule's cards read "1 – 1:30 PM · TPR" and this one read "1 PM"
   * alone, which was the snapshot quietly saying less than the thing it is a
   * snapshot of. Pre-shortened, like everything else that crosses.
   */
  venue: string;
  /** Null when the activation has no page of its own — render it unlinked. */
  page: string | null;
  /** Pre-formatted. The client has no business re-deriving a timezone. */
  time: string | null;
  /**
   * The mark the schedule page draws for this activation.
   *
   * Taken from `brandFor` rather than re-derived, so the snapshot cannot
   * drift from the calendar: an activation that gains a lockup in the data
   * gains it in both places at once. `lockup` is a file; `accent` is how the
   * four typeset brands identify themselves without one.
   */
  brand: CalendarBrand | null;
}

export interface BoardDay {
  iso: string;
  /** "Mon" */
  weekday: string;
  /** "Sept 28" */
  label: string;
  /** What the column shows — at most two, so five columns fit at once. */
  lead: BoardItem[];
  /** How many more that day holds, for the line under the leads. */
  more: number;
}

export interface BoardSpan {
  slug: string;
  title: string;
  page: string | null;
  /** The activation's own mark, where it has one. */
  lockup: { src: string; alt: string; width: number; height: number } | null;
  /** "Sep 28 – Oct 2", already formatted. */
  dayLabel: string;
  venueName: string;
}

export interface WeekBoard {
  days: BoardDay[];
  /** The one activation that runs across the week rather than inside a day. */
  span: BoardSpan | null;
}

/** At most this many per column, so all five days fit on one screen. */
const PER_DAY = 2;

/**
 * What a spotlight is matched on: the activation's page, or a talk's URL slug.
 *
 * It used to fall back to `CalendarItem.slug`, which for a CMS session is the
 * Firestore id — "unique by construction, stable across edits", and therefore
 * exactly the wrong thing to write into a list in source. Spotlighting a talk
 * that way would tie the homepage's running order to a database row id.
 *
 * The URL slug off `href` is the same key `TITLE_MARKS` uses, and for the same
 * reason: it is the published address, so it is the one name for a session
 * that is safe to hard-code.
 */
function spotlightKey(item: CalendarItem): string {
  return item.page ?? item.href?.split("/").pop() ?? item.slug;
}

export function weekBoard(
  /** The CMS's own sessions, from `liveSchedule`. See the note above. */
  extra: CalendarItem[] = [],
): WeekBoard {
  const project = (item: CalendarItem): BoardItem => ({
    slug: item.slug,
    title: item.title,
    longTitle: item.longTitle,
    href: item.href,
    poweredBy: item.poweredBy,
    page: item.page,
    // The start alone, not the range the calendar block prints. A column
    // 190px wide has room for "1 PM" and not for "1 – 1:30 PM", and the
    // snapshot's job is when a day starts moving, not how long each thing
    // runs.
    time: clockLabel(item.startMin),
    venue: item.venueShort,
    brand: item.brand ?? null,
  });

  const { days: meta, items, spans } = weekCalendar(extra);

  const days: BoardDay[] = meta.map((d) => {
    const onDay = items.filter((i) => i.dayIso === d.iso);
    // Spotlit first, then whatever runs earliest. `weekCalendar` has already
    // sorted by start, so "earliest" is just the original order.
    const spotlit = onDay.filter((i) => SPOTLIT.has(spotlightKey(i)));
    const rest = onDay.filter((i) => !SPOTLIT.has(spotlightKey(i)));
    const lead = [...spotlit, ...rest].slice(0, PER_DAY);
    return {
      iso: d.iso,
      weekday: d.weekday,
      label: d.label,
      lead: lead.map(project),
      more: Math.max(0, onDay.length - lead.length),
    };
  });

  const across = spans[0] ?? null;

  return {
    days,
    span: across
      ? {
          slug: across.slug,
          title: across.title,
          page: across.page,
          lockup: across.brand?.lockup ?? null,
          dayLabel: across.dayLabel,
          venueName: across.venueName,
        }
      : null,
  };
}
