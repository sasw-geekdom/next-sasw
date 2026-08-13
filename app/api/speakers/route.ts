import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { put } from "@vercel/blob";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { speakerSubmissionSchema } from "@/lib/validation/schemas";
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  TEAM_NOTIFY_TO,
} from "@/lib/email/resend";
import {
  speakerSubmissionEmail,
  internalNotificationEmail,
} from "@/lib/email/templates";
import { getEmailCopy } from "@/lib/email/copy-store";
import { imageFileError, PHOTO_TYPES } from "@/lib/images";

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
    track: form.get("track"),
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

  // 3) Headshot → Vercel Blob.
  //
  // Required now, like every other field on this form. `required` on the input
  // is a client hint a direct POST ignores, so the check lives here too, and
  // it returns an `issues` entry rather than a bare error so the form can put
  // the message under the field like every other validation failure.
  const headshot = form.get("headshot");
  if (!(headshot instanceof File) || headshot.size === 0) {
    return NextResponse.json(
      { error: "Check the form.", issues: { headshot: ["Add a headshot."] } },
      { status: 422 },
    );
  }

  // Shared with the admin uploads — the ceiling is Vercel's 4.5 MB request
  // body, so a 5 MB file 413s at the platform before this route is reached.
  const problem = imageFileError(headshot, PHOTO_TYPES);
  if (problem) {
    return NextResponse.json(
      { error: problem.replace("Image", "Headshot") },
      { status: 422 },
    );
  }
  const ext = headshot.name.split(".").pop() ?? "jpg";
  const blob = await put(`speaker-headshots/${randomUUID()}.${ext}`, headshot, {
    access: "public",
    addRandomSuffix: false,
  });
  const headshotUrl = blob.url;

  // 4) Persist to Firestore (Admin SDK — bypasses client rules).
  //
  // Listed field by field rather than spreading `...data`, the same way
  // /api/register and /api/get-involved already do.
  //
  // Spreading is what broke this route: Firestore rejects `undefined`
  // outright, `website` was the schema's one optional field, and it
  // normalises to undefined when left blank — so every pitch without a
  // website threw before it could be saved. Unhandled, so the reply was a
  // bare 500 with no JSON body and the form fell through to its generic
  // "Something went wrong." No field error, nothing in the admin queue, no
  // email to anyone. Every field is required now, which closes that door as
  // well, but listing them is what keeps it shut when the next optional field
  // is added.
  //
  // Wrapped too, so a future write failure says so in JSON instead of
  // surfacing as that same blank 500.
  const doc: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    company: data.company,
    track: data.track,
    sessionTitle: data.sessionTitle,
    abstract: data.abstract,
    bio: data.bio,
    linkedin: data.linkedin,
    availability: data.availability,
    website: data.website,
    headshotUrl,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await adminDb.collection(COLLECTIONS.speakerSubmissions).add(doc);
  } catch (err) {
    console.error("Speaker submission write failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your pitch. Try again in a moment." },
      { status: 500 },
    );
  }

  // 5) Branded confirmation — best-effort, never blocks the submission.
  try {
    const copy = await getEmailCopy("speaker");
    const email = speakerSubmissionEmail(
      { name: data.name, sessionTitle: data.sessionTitle },
      copy,
    );
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

  // 6) Internal notification to the team (best-effort) — a pitch shouldn't
  // land silently in the admin queue.
  try {
    const email = internalNotificationEmail({
      title: `Plug In · Session pitch — ${data.sessionTitle}`,
      fields: [
        { label: "Name", value: data.name },
        { label: "Email", value: data.email },
        { label: "Company", value: data.company },
        { label: "Circuit", value: data.track },
        { label: "Session title", value: data.sessionTitle },
        { label: "Abstract", value: data.abstract },
        { label: "Bio", value: data.bio },
        { label: "LinkedIn", value: data.linkedin },
        { label: "Website", value: data.website },
        { label: "Availability", value: data.availability },
      ],
    });
    await resend.emails.send({
      from: EMAIL_FROM,
      to: TEAM_NOTIFY_TO,
      replyTo: data.email, // reply straight to the speaker
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Speaker team notification failed:", err);
  }

  return NextResponse.json({ ok: true });
}
