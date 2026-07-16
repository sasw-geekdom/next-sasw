import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const yn = (v: boolean | undefined) =>
    v === undefined ? "" : v ? "yes" : "no";

  const rows = await listRegistrations();
  const csv = toCsv(
    [
      "Name",
      "Email",
      "ZIP",
      "Describes you",
      "Company",
      "Role",
      "Industry",
      "Time in SA",
      "Circuits",
      "First time",
      "Volunteer",
      "Volunteer days",
      "Volunteer preferences",
      "Sponsor consent",
      "Registered",
      "Checked in",
      "Checked in at",
      "Checked in by",
    ],
    rows.map((r) => [
      r.name,
      r.email,
      r.zip ?? "",
      r.describesYou ?? "",
      r.company ?? "",
      r.role ?? "",
      r.industry ?? "",
      r.saTenure ?? "",
      r.circuits.join("; "),
      yn(r.firstTime),
      yn(r.volunteerInterested),
      r.volunteerDays.join("; "),
      r.volunteerNotes ?? "",
      r.sponsorConsent ? "yes" : "no",
      formatDateTime(r.createdAt),
      r.checkedIn ? "yes" : "no",
      formatDateTime(r.checkedInAt),
      r.checkedInBy ?? "",
    ]),
  );

  return csvResponse("sastw-registrations.csv", csv);
}
