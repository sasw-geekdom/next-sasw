/**
 * One room's day, exactly as /schedule/day/[iso] draws it.
 *
 * The venue-day cards used to read the sessions collection directly, which is
 * half of what that page shows. The other half is curated in lib/schedule —
 * Cup of Capital opens Tuesday on the main stage and is not a CMS row at all —
 * and the card went out without it. A card that lists a room's day has one
 * job, which is to agree with the page it points at, so it now asks the page's
 * own question: the same `dayCalendar` over the same CMS rows.
 *
 * This file is TypeScript because the answer is. render.mjs bundles it with
 * esbuild at render time rather than restating the schedule in cards.mjs, which
 * is how every other fact reaches that tool and precisely how this one went
 * missing.
 *
 * Not `liveSchedule()`, though it is the same three calls: that one catches a
 * failed read and returns an empty list, which is the right trade for a web
 * page — the curated week still draws — and the wrong one here, where it would
 * post a card missing every CMS session with nothing to say so. A failed read
 * throws instead.
 */
import { listSessions } from "@/lib/admin/cms-queries";
import { ACCESS_CONTINUOUS, accessBlockFor } from "@/lib/access-granted";
import {
  activationSearchText,
  allSessions,
  dayCalendar,
  standaloneItems,
} from "@/lib/schedule";

export async function venueDayItems(iso: string, venue: string) {
  const rows = await listSessions();
  const day = dayCalendar(iso, standaloneItems(rows), activationSearchText(rows));
  if (!day) throw new Error(`${iso} is not a day of the week`);
  // The page's one-liner for a curated block, for the row that has no talk
  // inside it to list — College Night is a room, not a running order.
  const blurbs = new Map(allSessions().map((s) => [s.slug, s.blurb ?? ""]));
  return day.items
    .filter((i) => i.venueSlug === venue)
    .sort((a, b) => a.startMin - b.startMin)
    .map((i) => ({
      title: i.title,
      longTitle: i.longTitle,
      // The talk page's slug, for matching a row back to the CMS for its
      // people. Blocks curated in code link to /schedule/<page> instead.
      slug: i.href?.split("/").pop() ?? i.slug,
      startMin: i.startMin,
      endMin: i.endMin,
      timeLabel: i.timeLabel,
      people: i.people ?? "",
      circuit: i.circuit ?? "",
      blurb: blurbs.get(i.slug) ?? "",
      // The block's mark as the site draws it: a lockup file, or the name of
      // a typeset wordmark and its colours. See components/site/calendar/marks.
      brand: i.brand ?? null,
      // What runs the whole block rather than to a clock — Access Granted's
      // lockpicking village. The day page has no row for it, because it has
      // no start time, but it is part of that afternoon and the event page
      // lists it; a card for the room should too.
      continuous:
        i.slug === "access-granted"
          ? ACCESS_CONTINUOUS.items.map((c) => ({ name: c.name, by: c.by ?? "" }))
          : [],
    }));
}

/**
 * An activation's talks in running order, each with its speakers and — for
 * Access Granted — the community group whose hour it falls in.
 *
 * For the cards that walk through a lineup one speaker at a time. The same
 * reason as `venueDayItems` for reading it here rather than restating it in
 * cards.mjs: the running order and who powers each hour are the site's
 * (`accessBlockFor` is what credits each session on the event page), and a
 * card that typed them out would drift the first time a talk moved.
 */
export async function activationTalks(activation: string) {
  const rows = await listSessions();
  return rows
    .filter((r) => r.activation === activation && r.startsAt)
    .sort((a, b) => a.startsAt - b.startsAt)
    .map((r) => ({
      title: r.title,
      slug: r.slug,
      startsAt: r.startsAt,
      speakers: r.participants
        .filter((p) => p.role !== "moderator" && p.slug)
        .map((p) => ({ slug: p.slug, name: p.name })),
      poweredBy:
        activation === "access-granted"
          ? (accessBlockFor(r.startsAt)?.name ?? "")
          : "",
    }));
}
