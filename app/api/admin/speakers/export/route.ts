import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSpeakerSubmissions } from "@/lib/admin/queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";
import {
  applySpeakerFilters,
  isSpeakerFiltered,
  parseSpeakerFilters,
} from "@/lib/admin/speaker-filters";

/**
 * The pitches, as a file.
 *
 * A route rather than the `Blob` the table used to build in the browser. The
 * other two admin exports are routes, and the client version could only ever
 * write out the rows React happened to be holding — so it exported a snapshot
 * of a page that might have been open since before the last three submissions
 * arrived. This reads Firestore at the moment you click.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const filters = parseSpeakerFilters(req.nextUrl.searchParams);
  const rows = applySpeakerFilters(await listSpeakerSubmissions(), filters);

  const csv = toCsv(
    [
      "Name",
      "Email",
      "Company",
      "Track",
      "Session title",
      "Abstract",
      "Bio",
      "Website",
      "LinkedIn",
      "Availability",
      "Status",
      "Submitted",
    ],
    rows.map((r) => [
      r.name,
      r.email,
      r.company ?? "",
      r.track,
      r.sessionTitle,
      r.abstract,
      r.bio,
      r.website ?? "",
      r.linkedin ?? "",
      r.availability ?? "",
      r.status,
      formatDateTime(r.createdAt),
    ]),
  );

  return csvResponse(
    isSpeakerFiltered(filters)
      ? "sastw-speaker-pitches-filtered.csv"
      : "sastw-speaker-pitches.csv",
    csv,
  );
}
