import "server-only";

import { listSessions } from "@/lib/admin/cms-queries";
import { standaloneItems, type CalendarItem } from "@/lib/schedule";

/**
 * The CMS's own sessions, as calendar blocks.
 *
 * The week in lib/schedule is curated in code, which is right for the shape of
 * it — the activations were negotiated with venues months out and they do not
 * change on a Tuesday. What code is wrong for is the long tail: an organiser
 * adding a session the week it happens, who should not need a deploy to put it
 * on the grid. `standaloneItems` turns those rows into blocks; this is the read
 * that feeds it.
 *
 * ─── Why the read is here and not in lib/schedule ───────────────────────────
 *
 * lib/schedule is imported by the client components that draw the grid —
 * blocks.tsx, week-calendar-grid, day-calendar-grid all read `CalendarItem` off
 * it. `listSessions` is `server-only`, and a single import of it there would
 * poison every one of those. So the pure half stays pure and takes its rows as
 * an argument, and the Firestore call lives in this file, which only server
 * components import.
 *
 * ─── What a failed read does ────────────────────────────────────────────────
 *
 * Returns nothing, and the curated week draws exactly as it does today. That is
 * the deliberate trade in making the calendar part data: an outage costs the
 * CMS sessions rather than the whole schedule, and the activations people
 * planned their week around are still on the page. It is also the quiet
 * failure — a session an organiser entered would be missing with nothing on
 * screen to say so — which is the argument for keeping the anchor programming
 * in code rather than moving all of it here.
 */
export async function liveCalendarItems(): Promise<CalendarItem[]> {
  try {
    return standaloneItems(await listSessions());
  } catch {
    return [];
  }
}
