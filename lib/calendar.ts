// Add-to-calendar links, shared by the branded emails and the session pages.
//
// Pure — no server-only deps — so the same builders drive the email preview in
// the browser and the client-side menu on a session page.
//
// These lived inline in lib/email/templates.ts, hardcoded to the week's
// all-day event. Sessions needed the same three destinations for a timed
// event, and two implementations of "what URL does Google want" is one too
// many: a fix to the encoding or a change to the copy should land once.

export interface CalendarEvent {
  title: string;
  details: string;
  location: string;
  /**
   * All-day events take `YYYYMMDD` and an EXCLUSIVE end date. Timed events
   * take ISO 8601 with an offset — `2026-09-28T17:00:00-05:00`.
   */
  start: string;
  end: string;
  allDay?: boolean;
}

/** `2026-09-28T17:00:00-05:00` → `20260928T220000Z`, the stamp both formats want. */
export function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Google won't accept an .ics by link — it wants its own render endpoint with
 * the event as query params, which is why the .ics alone isn't enough.
 */
export function googleCalendarUrl(e: CalendarEvent): string {
  const dates = e.allDay
    ? `${e.start}/${e.end}`
    : `${icsStamp(e.start)}/${icsStamp(e.end)}`;
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
    details: e.details,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Outlook.com's compose endpoint. Desktop Outlook uses the .ics instead. */
export function outlookCalendarUrl(e: CalendarEvent): string {
  const q = new URLSearchParams({
    rru: "addevent",
    subject: e.title,
    startdt: e.start,
    enddt: e.end,
    location: e.location,
    body: e.details,
  });
  if (e.allDay) q.set("allday", "true");
  return `https://outlook.live.com/calendar/0/action/compose?${q}`;
}
