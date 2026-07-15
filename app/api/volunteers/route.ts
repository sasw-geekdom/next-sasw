import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { volunteerSchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { volunteerEmail } from "@/lib/email/templates";
import { getEmailCopy } from "@/lib/email/copy-store";

export async function POST(request: Request) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = volunteerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  await adminDb.collection(COLLECTIONS.volunteers).add({
    ...data,
    phone: data.phone || undefined,
    notes: data.notes || undefined,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Branded confirmation — best-effort, never blocks the submission.
  try {
    const copy = await getEmailCopy("volunteer");
    const email = volunteerEmail({ name: data.name }, copy);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Volunteer confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
