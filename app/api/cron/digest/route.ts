import { NextResponse } from "next/server";
import { listRegistrations } from "@/lib/admin/queries";
import { resend, EMAIL_FROM, DIGEST_TO } from "@/lib/email/resend";
import { internalNotificationEmail } from "@/lib/email/templates";
import { TRACK_NAMES } from "@/lib/tracks";

// Weekly registration digest ("nice to have" in the 2026 form requirements).
// Vercel Cron hits this route Monday mornings; the CRON_SECRET check keeps
// anyone else from triggering sends.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await listRegistrations();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = rows.filter((r) => r.createdAt >= weekAgo);

  const count = (pred: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(pred).length;

  const circuits = TRACK_NAMES.map(
    (t) => `${t}: ${count((r) => r.circuits.includes(t))}`,
  ).join("\n");

  const email = internalNotificationEmail({
    title: `Weekly digest — ${rows.length} registered, +${newThisWeek.length} this week`,
    fields: [
      { label: "Total registered", value: String(rows.length) },
      { label: "New this week", value: String(newThisWeek.length) },
      { label: "First-timers", value: String(count((r) => r.firstTime === true)) },
      {
        label: "Volunteer interest",
        value: String(count((r) => r.volunteerInterested === true)),
      },
      {
        label: "Sponsor consent",
        value: String(count((r) => r.sponsorConsent)),
      },
      { label: "Circuit interest", value: circuits },
      {
        label: "Full list",
        value: "https://sasw.co/admin/registrations",
      },
    ],
  });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: DIGEST_TO,
    subject: email.subject,
    html: email.html,
  });

  return NextResponse.json({
    ok: true,
    total: rows.length,
    newThisWeek: newThisWeek.length,
    recipients: DIGEST_TO.length,
  });
}
