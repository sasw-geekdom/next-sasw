import { icsStamp } from "@/lib/calendar";
import { resolveSchedule, scheduleSlugs } from "@/lib/schedule";

// A single activation's calendar entry.
//
// `.ics` rather than a Google Calendar template link: the file imports into
// Apple Calendar, Outlook and Google alike, where a template URL only serves
// one of the three. The whole-week file at /sastw-2026.ics stays as it is —
// this is the same idea scoped to one session.
//
// Only sessions with a confirmed `when` get a route; the button that points
// here is rendered on the same condition.

export const dynamicParams = false;

export function generateStaticParams() {
  return scheduleSlugs()
    .filter((slug) => {
      const s = resolveSchedule(slug);
      return s?.kind === "activation" && !!s.session.when;
    })
    .map((slug) => ({ slug }));
}

/** Fold to 75 octets per line and escape the characters iCalendar reserves. */
function line(key: string, value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
  const full = `${key}:${escaped}`;
  if (full.length <= 75) return full;
  const parts = [full.slice(0, 75)];
  let rest = full.slice(75);
  while (rest.length) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // `?download` forces a save; without it the file is served inline so macOS
  // and iOS hand it straight to Calendar instead of dropping it in Downloads.
  const download = new URL(request.url).searchParams.has("download");
  const schedule = resolveSchedule(slug);
  if (schedule?.kind !== "activation" || !schedule.session.when) {
    return new Response("Not found", { status: 404 });
  }

  const { session } = schedule;
  const when = session.when!;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SASTW//Year 11//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable for the life of this session — re-importing updates the entry
    // rather than creating a duplicate.
    line("UID", `${session.slug}@sasw.co`),
    "DTSTAMP:20260101T000000Z",
    `DTSTART:${icsStamp(when.start)}`,
    `DTEND:${icsStamp(when.end)}`,
    line("SUMMARY", session.title),
    line(
      "DESCRIPTION",
      `${session.blurb} Part of San Antonio Startup + Tech Week.`,
    ),
    line("LOCATION", `${session.venue.name}, Downtown San Antonio, TX`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${session.page}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
