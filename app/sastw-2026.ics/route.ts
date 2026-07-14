// Hosted calendar file for the whole week. Linked from the branded emails so
// recipients can add SASTW to Apple Calendar, Outlook desktop, or any app that
// reads .ics. All-day, multi-day event (DTEND is exclusive → Oct 3).

export const dynamic = "force-static";

const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//SASTW//Year 11//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "BEGIN:VEVENT",
  "UID:sastw-2026@sasw.co",
  "DTSTAMP:20260101T000000Z",
  "DTSTART;VALUE=DATE:20260928",
  "DTEND;VALUE=DATE:20261003",
  "SUMMARY:San Antonio Startup + Tech Week",
  "DESCRIPTION:Year 11. Five days, five circuits, one current. Sessions, the Bash, and where to be. https://sasw.co",
  "LOCATION:Texas Public Radio, Downtown San Antonio, TX",
  "URL:https://sasw.co",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

export function GET() {
  return new Response(ICS, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sastw-2026.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
