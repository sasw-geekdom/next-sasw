import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { put } from "@vercel/blob";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { speakerSubmissionSchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { speakerSubmissionEmail } from "@/lib/email/templates";

const MAX_HEADSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
const HEADSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  // 1) BotID — invisible CAPTCHA. Reject bots before any write or email.
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // 2) Parse multipart form (fields + optional headshot).
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const parsed = speakerSubmissionSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    company: form.get("company") ?? "",
    sessionTitle: form.get("sessionTitle"),
    abstract: form.get("abstract"),
    bio: form.get("bio"),
    website: form.get("website") ?? "",
    linkedin: form.get("linkedin") ?? "",
    availability: form.get("availability") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // 3) Optional headshot → Vercel Blob.
  let headshotUrl: string | undefined;
  const headshot = form.get("headshot");
  if (headshot instanceof File && headshot.size > 0) {
    if (!HEADSHOT_TYPES.includes(headshot.type)) {
      return NextResponse.json(
        { error: "Headshot must be JPEG, PNG, or WebP." },
        { status: 422 },
      );
    }
    if (headshot.size > MAX_HEADSHOT_BYTES) {
      return NextResponse.json(
        { error: "Headshot must be under 5 MB." },
        { status: 422 },
      );
    }
    const ext = headshot.name.split(".").pop() ?? "jpg";
    const blob = await put(
      `speaker-headshots/${randomUUID()}.${ext}`,
      headshot,
      { access: "public", addRandomSuffix: false },
    );
    headshotUrl = blob.url;
  }

  // 4) Persist to Firestore (Admin SDK — bypasses client rules).
  await adminDb.collection(COLLECTIONS.speakerSubmissions).add({
    ...data,
    company: data.company || undefined,
    availability: data.availability || undefined,
    headshotUrl,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  });

  // 5) Branded confirmation — best-effort, never blocks the submission.
  try {
    const email = speakerSubmissionEmail({
      name: data.name,
      sessionTitle: data.sessionTitle,
    });
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Speaker confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
