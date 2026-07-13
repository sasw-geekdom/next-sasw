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

  const rows = await listRegistrations();
  const csv = toCsv(
    [
      "Name",
      "Email",
      "Company",
      "Role",
      "Interest",
      "Registered",
      "Checked in",
      "Checked in at",
      "Checked in by",
    ],
    rows.map((r) => [
      r.name,
      r.email,
      r.company ?? "",
      r.role ?? "",
      r.interest ?? "",
      formatDateTime(r.createdAt),
      r.checkedIn ? "yes" : "no",
      formatDateTime(r.checkedInAt),
      r.checkedInBy ?? "",
    ]),
  );

  return csvResponse("sastw-registrations.csv", csv);
}
