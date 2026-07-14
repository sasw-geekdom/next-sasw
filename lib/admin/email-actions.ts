"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, EMAIL_SETTINGS_DOC } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { emailCopySchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import {
  renderSample,
  templateMeta,
  type EmailTemplateKey,
} from "@/lib/email/templates";

export type EmailActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; issues?: Record<string, string[] | undefined> };

function validate(key: EmailTemplateKey, values: unknown) {
  // Guard the key so a bad client can't write an arbitrary field.
  try {
    templateMeta(key);
  } catch {
    return { ok: false as const, error: "Unknown template." };
  }
  const parsed = emailCopySchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Check the fields.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }
  return { ok: true as const, data: parsed.data };
}

/** Persist the edited copy for one template. */
export async function saveEmailCopy(
  key: EmailTemplateKey,
  values: unknown,
): Promise<EmailActionResult> {
  const user = await requireAdmin();
  const v = validate(key, values);
  if (!v.ok) return v;

  await adminDb
    .collection(COLLECTIONS.settings)
    .doc(EMAIL_SETTINGS_DOC)
    .set(
      {
        [key]: v.data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: user.email,
      },
      { merge: true },
    );

  revalidatePath("/admin/content/emails");
  return { ok: true, message: "Saved." };
}

/** Send the current draft (unsaved is fine) to the signed-in admin. */
export async function sendTestEmail(
  key: EmailTemplateKey,
  values: unknown,
): Promise<EmailActionResult> {
  const user = await requireAdmin();
  const v = validate(key, values);
  if (!v.ok) return v;

  const { subject, html } = renderSample(key, v.data);
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      replyTo: EMAIL_REPLY_TO,
      subject: `[Test] ${subject}`,
      html,
    });
  } catch (err) {
    console.error("Test email failed:", err);
    return {
      ok: false,
      error: "Send failed — check the Resend configuration.",
    };
  }
  return { ok: true, message: `Test sent to ${user.email}.` };
}
