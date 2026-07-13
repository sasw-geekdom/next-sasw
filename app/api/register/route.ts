import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { registrationSchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { registrationEmail } from "@/lib/email/templates";

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
    await adminDb.collection(COLLECTIONS.registrations).add({
      ...data,
      company: data.company || undefined,
      role: data.role || undefined,
      interest: data.interest || undefined,
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // 4) Branded confirmation (best-effort). Send even on re-register so the
  // attendee always gets their "you're in" — but never block on it.
  try {
    const email = registrationEmail({ name: data.name });
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
