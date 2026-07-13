import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSpeakerSubmissions } from "@/lib/admin/queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await listSpeakerSubmissions();
  const csv = toCsv(
    [
      "Name",
      "Email",
      "Company",
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

  return csvResponse("sastw-speaker-submissions.csv", csv);
}
