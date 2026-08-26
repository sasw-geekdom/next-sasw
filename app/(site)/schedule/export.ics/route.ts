import { eventLocation, icsLine as line, icsStamp } from "@/lib/calendar";
import { exportableSessions } from "@/lib/schedule";

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

  const sessions = exportableSessions();

  // Resolved against the known schedule rather than trusted, and in the
  // week's own order rather than the order they were clicked — a calendar
  // file is read chronologically, and the click order is noise.
  const wanted = new Set(requested.split(",").slice(0, MAX_SELECTION));
  const picked = sessions
    .filter((s) => wanted.has(s.slug))
    .sort((a, b) => a.when!.start.localeCompare(b.when!.start));

  // An unknown slug is dropped silently, but a selection that resolves to
  // nothing is a 404 rather than an empty calendar — an .ics with no VEVENT
  // imports "successfully" and adds nothing, which looks exactly like the
  // feature being broken.
  if (picked.length === 0) return new Response("Not found", { status: 404 });

  const events = picked.flatMap((session) => [
    "BEGIN:VEVENT",
    // The same UID the per-session file uses, deliberately. Someone who added
    // one activation from its own page and then exported a selection
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
  ]);

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
