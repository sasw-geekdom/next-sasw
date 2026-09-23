import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import { listSessions } from "@/lib/admin/cms-queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { EVENT_DAYS, localDayKey } from "@/lib/event";
import { roomSlugFromLegacy, venueLabel } from "@/lib/locations";
import { activationTitle } from "@/lib/schedule";
import { SITE_URL } from "@/lib/event";

/**
 * The schedule, as a file, filtered to a room and a day.
 *
 * Built for the question a venue actually asks: "what is happening in my room
 * on Thursday?" The Rand asked first, which is why this exists rather than a
 * CSV written once and mailed over — a schedule still being edited is stale
 * the moment it is exported, and the next room would have asked next.
 *
 * Both filters are optional and independent, so the same route answers "the
 * whole week at The Rand", "everything on Thursday" and "the whole schedule".
 *
 * A route rather than a client-side Blob, for the reason the speakers export
 * carries: the browser can only write out the rows React is holding, which is
 * a snapshot of whenever the page was opened. This reads Firestore on click.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  // The page-level guards do not cover route handlers — same explicit check
  // the other three exports make. A door account runs a badge desk and has no
  // business pulling the CMS out as a file.
  if (!isStaff(user)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const venue = req.nextUrl.searchParams.get("venue") ?? "";
  const day = req.nextUrl.searchParams.get("day") ?? "";

  const rows = (await listSessions())
    .filter((r) => {
      // Rows saved before `location` was constrained hold free text — "The
      // Rand", "the rand", "Geekdom 3rd floor". Matching through
      // `roomSlugFromLegacy` is what stops an old row being silently left out
      // of its own room's export.
      if (venue && (roomSlugFromLegacy(r.location) ?? r.location) !== venue) {
        return false;
      }
      // A session with no time cannot belong to a day. It still belongs to the
      // room, so it survives an unfiltered export and drops out of a dated one
      // rather than being filed under a date nobody has confirmed.
      if (day && (!r.startsAt || localDayKey(r.startsAt) !== day)) {
        return false;
      }
      return true;
    })
    // Undated last rather than first: a run sheet is read top to bottom, and a
    // session with no hour is a thing to chase, not a thing to start with.
    .sort((a, b) => (a.startsAt || Infinity) - (b.startsAt || Infinity));

  const time = (ms: number | null | undefined) =>
    ms
      ? new Date(ms).toLocaleTimeString("en-US", {
          timeZone: "America/Chicago",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
  const dayLabel = (ms: number | null | undefined) => {
    if (!ms) return "";
    const iso = localDayKey(ms);
    const d = EVENT_DAYS.find((x) => x.iso === iso);
    return d
      ? `${new Date(ms).toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long" })}, ${d.label}`
      : iso;
  };

  const csv = toCsv(
    [
      "Day",
      "Start",
      "End",
      "Title",
      "Speakers",
      "Track",
      "Part of",
      "Room",
      "URL",
    ],
    rows.map((r) => [
      dayLabel(r.startsAt),
      time(r.startsAt),
      time(r.endsAt),
      r.title,
      // Names, not ids. This file gets printed and handed to whoever is
      // running the room, and a run sheet that says who is on is the point.
      (r.participants ?? []).map((p) => p.name).join(", "),
      r.track ?? "",
      r.activation ? activationTitle(r.activation) : "",
      venueLabel(roomSlugFromLegacy(r.location) ?? r.location),
      r.slug ? `${SITE_URL}/schedule/talk/${r.slug}` : "",
    ]),
  );

  // The filename says what is in it, because these get saved in a downloads
  // folder next to four other exports and opened a week later.
  const parts = ["sastw-schedule"];
  if (venue) parts.push(venue);
  if (day) parts.push(day);
  return csvResponse(`${parts.join("-")}.csv`, csv);
}
