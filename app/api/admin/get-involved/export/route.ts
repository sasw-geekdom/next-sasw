import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listGetInvolved } from "@/lib/admin/queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";
import { PATH_LABELS } from "@/lib/get-involved";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await listGetInvolved();
  const csv = toCsv(
    [
      "Path",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Role",
      "Budget",
      "Anchor event",
      "Goals",
      "Event concept",
      "Audience",
      "Attendance",
      "Preferred time",
      "Venue",
      "Co-sponsors",
      "Question",
      "Heard about",
      "Anything else",
      "Status",
      "Received",
    ],
    rows.map((r) => [
      PATH_LABELS[r.path],
      r.name,
      r.email,
      r.phone,
      r.company,
      r.role,
      r.budget ?? "",
      r.anchorEvent ?? "",
      r.goals ?? "",
      r.eventConcept ?? "",
      r.audience.join("; "),
      r.attendance ?? "",
      r.preferredTime ?? "",
      r.venue ?? "",
      r.coSponsors ?? "",
      r.question ?? "",
      r.heardAbout ?? "",
      r.notes ?? "",
      r.status,
      formatDateTime(r.createdAt),
    ]),
  );

  return csvResponse("sastw-get-involved.csv", csv);
}
