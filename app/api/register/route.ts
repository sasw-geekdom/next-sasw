import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { registrationSchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { registrationEmail } from "@/lib/email/templates";
import { getEmailCopy } from "@/lib/email/copy-store";

export async function POST(request: Request) {
  // 1) BotID gate.
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // 2) Validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // 3) One registration per email — keep the check-in list clean.
  const existing = await adminDb
    .collection(COLLECTIONS.registrations)
    .where("email", "==", data.email)
    .limit(1)
    .get();

  if (existing.empty) {
    // Build the doc explicitly, skipping blank optionals — Firestore rejects
    // `undefined` values and empty strings just pollute the export.
    const doc: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      zip: data.zip,
      circuits: data.circuits,
      volunteerDays: data.volunteerInterested ? data.volunteerDays : [],
      sponsorConsent: data.sponsorConsent,
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (data.describesYou) doc.describesYou = data.describesYou;
    if (data.company) doc.company = data.company;
    if (data.role) doc.role = data.role;
    if (data.industry) doc.industry = data.industry;
    if (data.saTenure) doc.saTenure = data.saTenure;
    if (typeof data.firstTime === "boolean") doc.firstTime = data.firstTime;
    if (typeof data.volunteerInterested === "boolean") {
      doc.volunteerInterested = data.volunteerInterested;
    }
    if (data.volunteerInterested && data.volunteerNotes) {
      doc.volunteerNotes = data.volunteerNotes;
    }
    await adminDb.collection(COLLECTIONS.registrations).add(doc);
  }

  // 4) Branded confirmation (best-effort). Send even on re-register so the
  // attendee always gets their "you're in" — but never block on it.
  try {
    const copy = await getEmailCopy("registration");
    const email = registrationEmail({ name: data.name }, copy);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Registration confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
