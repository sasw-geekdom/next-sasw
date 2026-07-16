import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getInvolvedSchema } from "@/lib/validation/schemas";
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  TEAM_NOTIFY_TO,
} from "@/lib/email/resend";
import {
  renderEmail,
  internalNotificationEmail,
  type EmailTemplateKey,
} from "@/lib/email/templates";
import { getEmailCopy } from "@/lib/email/copy-store";
import { PATH_LABELS } from "@/lib/get-involved";

const CONFIRMATION_TEMPLATE: Record<string, EmailTemplateKey> = {
  sponsor: "getInvolvedSponsor",
  host: "getInvolvedHost",
  general: "getInvolvedGeneral",
};

export async function POST(request: Request) {
  // 1) BotID gate.
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // 2) Validate — the schema branches on `path`.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = getInvolvedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // 3) Store — skip blank optionals (Firestore rejects undefined; empty
  // strings pollute the export).
  const doc: Record<string, unknown> = {
    path: data.path,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    role: data.role,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  };
  if (data.heardAbout) doc.heardAbout = data.heardAbout;
  if (data.notes) doc.notes = data.notes;
  if (data.path === "sponsor") {
    doc.budget = data.budget;
    if (data.anchorEvent) doc.anchorEvent = data.anchorEvent;
    if (data.goals) doc.goals = data.goals;
  } else if (data.path === "host") {
    doc.eventConcept = data.eventConcept;
    doc.audience = data.audience;
    doc.venue = data.venue;
    if (data.attendance) doc.attendance = data.attendance;
    if (data.preferredTime) doc.preferredTime = data.preferredTime;
    if (data.coSponsors) doc.coSponsors = data.coSponsors;
  } else {
    doc.question = data.question;
  }
  await adminDb.collection(COLLECTIONS.getInvolved).add(doc);

  // 4) Confirmation to the submitter (best-effort, admin-editable copy).
  try {
    const copy = await getEmailCopy(CONFIRMATION_TEMPLATE[data.path]);
    const email = renderEmail(copy, {
      firstName: data.name.split(" ")[0] || data.name,
    });
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Get Involved confirmation email failed:", err);
  }

  // 5) Internal notification to the team (best-effort).
  try {
    const label = PATH_LABELS[data.path];
    const fields: { label: string; value: string | undefined }[] = [
      { label: "Name", value: data.name },
      { label: "Email", value: data.email },
      { label: "Phone", value: data.phone },
      { label: "Company", value: data.company },
      { label: "Role", value: data.role },
    ];
    if (data.path === "sponsor") {
      fields.push(
        { label: "Budget", value: data.budget },
        { label: "Anchor event", value: data.anchorEvent },
        { label: "Goals", value: data.goals },
      );
    } else if (data.path === "host") {
      fields.push(
        { label: "Event", value: data.eventConcept },
        { label: "Audience", value: data.audience.join(", ") },
        { label: "Attendance", value: data.attendance },
        { label: "Preferred time", value: data.preferredTime },
        { label: "Venue", value: data.venue },
        { label: "Co-sponsors", value: data.coSponsors },
      );
    } else {
      fields.push({ label: "Question", value: data.question });
    }
    fields.push(
      { label: "Heard about", value: data.heardAbout },
      { label: "Anything else", value: data.notes },
    );

    const email = internalNotificationEmail({
      title: `Get Involved · ${label} — ${data.company}`,
      fields,
    });
    await resend.emails.send({
      from: EMAIL_FROM,
      to: TEAM_NOTIFY_TO,
      replyTo: data.email, // reply straight to the submitter
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error("Get Involved team notification failed:", err);
  }

  return NextResponse.json({ ok: true });
}
