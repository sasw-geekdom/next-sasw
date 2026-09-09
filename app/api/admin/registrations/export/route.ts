import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";
import {
  applyFilters,
  isFiltered,
  parseFilters,
} from "@/lib/admin/registration-filters";

/**
 * The CSV of whatever the table is showing.
 *
 * It used to be the CSV of everything, always: narrowing to the volunteers on
 * screen and hitting Export handed back all 274 rows. The filters and this
 * route now read the same params off the same URL — see
 * `lib/admin/registration-filters` — so the button exports the view rather
 * than the collection.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const yn = (v: boolean | undefined) =>
    v === undefined ? "" : v ? "yes" : "no";

  const filters = parseFilters(req.nextUrl.searchParams);
  const rows = applyFilters(await listRegistrations(), filters);
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

  // The filename says which it is, because a folder of `sastw-registrations
  // (3).csv` is how a filtered export gets mistaken for the whole list.
  return csvResponse(
    isFiltered(filters)
      ? "sastw-registrations-filtered.csv"
      : "sastw-registrations.csv",
    csv,
  );
}
