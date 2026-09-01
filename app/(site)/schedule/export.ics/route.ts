import { listSessions } from "@/lib/admin/cms-queries";
import { eventLocation, icsLine as line, icsStamp } from "@/lib/calendar";
import { ROOMS, roomSlugFromLegacy } from "@/lib/locations";
import { ASSUMED_MINUTES, exportableSessions } from "@/lib/schedule";

// The week a reader actually picked, as one calendar file.
//
// The three .ics producers on this site answer three different questions and
// none of them replaces another:
//
//   /sastw-2026.ics                 — "the week is happening." One all-day
//                                     event across five days, linked from the
//                                     emails.
//   /schedule/<page>/calendar       — "I'm going to this one thing."
//   /schedule/export.ics?s=a,b      — "I'm going to these four." This.
//
// Multi-VEVENT because that is the only format that carries a selection. Note
// the one real limitation: Google will not import an .ics by link — it wants
// its own template endpoint, one event at a time — so a Google user takes the
// file and imports it. That is the reason the per-session pages keep their
// four-destination menu rather than being replaced by this.
//
// A literal `.ics` segment, matching /sastw-2026.ics. It also puts the route
// out of reach of /schedule/[slug], which builds a fixed set of slugs and
// would otherwise be the only other thing that could claim this path.

/** A defensive ceiling. The week is nine activations; a hundred is not a week. */
const MAX_SELECTION = 100;

export async function GET(request: Request): Promise<Response> {
  const requested = new URL(request.url).searchParams.get("s");
  if (!requested) return new Response("No selection", { status: 400 });

  // Resolved against the known schedule rather than trusted.
  const wanted = new Set(requested.split(",").slice(0, MAX_SELECTION));

  // Sorted on epoch rather than on the ISO string. The curated week is all one
  // offset so comparing text worked while that was the only source; a CMS row
  // arrives as a UTC instant, and "2026-10-02T13:00:00-05:00" against
  // "2026-10-02T18:00:00.000Z" compares as text to the wrong answer.
  type Entry = { at: number; lines: string[] };

  const curated: Entry[] = exportableSessions()
    .filter((s) => wanted.has(s.slug))
    .map((session) => ({
      at: Date.parse(session.when!.start),
      lines: [
        "BEGIN:VEVENT",
        // The same UID the per-session file uses, deliberately. Someone who
        // added one activation from its own page and then exported a selection
        // containing it gets the entry updated rather than duplicated.
        line("UID", `${session.slug}@sasw.co`),
        "DTSTAMP:20260101T000000Z",
        `DTSTART:${icsStamp(session.when!.start)}`,
        `DTEND:${icsStamp(session.when!.end)}`,
        line("SUMMARY", session.title),
        line(
          "DESCRIPTION",
          `${session.blurb} Part of San Antonio Startup + Tech Week.`,
        ),
        line("LOCATION", eventLocation(session)),
        "END:VEVENT",
      ],
    }));

  // The CMS's standalone sessions, which the grid has drawn since the calendar
  // became part data and which are `exportable` for the reason set out on
  // `standaloneItems`. A row carries a start, an end, a title and a room —
  // everything a VEVENT needs but `URL`, which is optional.
  //
  // Wrapped, like every other read of this collection: an outage costs the CMS
  // sessions from the file rather than the whole download, so a reader who
  // picked four activations and one talk still gets their four.
  let fromCms: Entry[] = [];
  try {
    fromCms = (await listSessions())
      .filter((row) => row.activation === null && wanted.has(row.id))
      .map((row) => {
        const room =
          ROOMS.find((r) => r.slug === row.location) ??
          ROOMS.find((r) => r.slug === roomSlugFromLegacy(row.location));
        // The same fallback the grid draws with, so the block and the calendar
        // entry cannot disagree about how long a row with no end runs.
        const end = row.endsAt ?? row.startsAt + ASSUMED_MINUTES * 60_000;
        const who = row.participants
          .map((p) => p.name)
          .filter(Boolean)
          .join(", ");
        return {
          at: row.startsAt,
          lines: [
            "BEGIN:VEVENT",
            // The Firestore id, which is what the grid uses as this block's
            // slug and what the reader's selection therefore holds.
            line("UID", `${row.id}@sasw.co`),
            "DTSTAMP:20260101T000000Z",
            `DTSTART:${icsStamp(new Date(row.startsAt).toISOString())}`,
            `DTEND:${icsStamp(new Date(end).toISOString())}`,
            line("SUMMARY", row.title),
            line(
              "DESCRIPTION",
              [
                row.description,
                who && `With ${who}.`,
                "Part of San Antonio Startup + Tech Week.",
              ]
                .filter(Boolean)
                .join(" "),
            ),
            line(
              "LOCATION",
              room ? eventLocation({ venue: room }) : "San Antonio, TX",
            ),
            "END:VEVENT",
          ],
        };
      });
  } catch {
    fromCms = [];
  }

  // An unknown slug is dropped silently, but a selection that resolves to
  // nothing is a 404 rather than an empty calendar — an .ics with no VEVENT
  // imports "successfully" and adds nothing, which looks exactly like the
  // feature being broken.
  if (curated.length + fromCms.length === 0)
    return new Response("Not found", { status: 404 });

  // In the week's own order rather than the order they were clicked — a
  // calendar file is read chronologically, and the click order is noise.
  const events = [...curated, ...fromCms]
    .sort((a, b) => a.at - b.at)
    .flatMap((e) => e.lines);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SASTW//Year 11//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Always an attachment. The inline path exists on the per-session route
      // so iOS hands a single event straight to Calendar; a multi-event file
      // is an import, and every client wants it as a file.
      "Content-Disposition": 'attachment; filename="sastw-2026-selection.ics"',
      // Varies by query string, so it is the reader's own file — not
      // something a shared cache should hold.
      "Cache-Control": "private, no-store",
    },
  });
}
