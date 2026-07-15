import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { sponsorSchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { sponsorEmail } from "@/lib/email/templates";
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

  const parsed = sponsorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  await adminDb.collection(COLLECTIONS.sponsorLeads).add({
    ...data,
    website: data.website || undefined,
    message: data.message || undefined,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Branded confirmation — best-effort, never blocks the submission.
  try {
    const copy = await getEmailCopy("sponsor");
    const email = sponsorEmail({ name: data.name }, copy);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Sponsor confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
