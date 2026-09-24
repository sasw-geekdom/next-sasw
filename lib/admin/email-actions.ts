"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, EMAIL_SETTINGS_DOC } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { emailCopySchema } from "@/lib/validation/schemas";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { sendKnowBeforeYouGo } from "@/lib/email/know-before-you-go";
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
    // The SDK reports a rejected send in `error` rather than by throwing, so
    // the catch alone said "Test sent" for a send Resend had refused.
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      replyTo: EMAIL_REPLY_TO,
      subject: `[Test] ${subject}`,
      html,
    });
    if (error) {
      console.error("Test email rejected:", error);
      return { ok: false, error: `Resend refused the test: ${error.message}` };
    }
  } catch (err) {
    console.error("Test email failed:", err);
    return {
      ok: false,
      error: "Send failed — check the Resend configuration.",
    };
  }
  return { ok: true, message: `Test sent to ${user.email}.` };
}

/**
 * Send the know-before-you-go to every registrant who has not had it.
 *
 * `expected` is the waiting count the page showed; see sendKnowBeforeYouGo in
 * lib/email/know-before-you-go.ts for why a mismatch sends nothing, and for
 * how a rerun only reaches the people still waiting.
 */
export async function sendKnowBeforeYouGoToAll(
  expected: number,
): Promise<EmailActionResult> {
  const user = await requireAdmin();
  if (!Number.isInteger(expected) || expected < 1) {
    return { ok: false, error: "Nothing to send." };
  }
  let out;
  try {
    out = await sendKnowBeforeYouGo(user.email, expected);
  } catch (err) {
    console.error("Know-before-you-go send failed:", err);
    revalidatePath("/admin/content/emails");
    return {
      ok: false,
      error:
        "The send stopped partway. Whoever it reached is marked as sent — refresh to see how many are still waiting, then send again.",
    };
  }
  revalidatePath("/admin/content/emails");
  if (!out.ok) return { ok: false, error: out.error };
  if (out.error) {
    return {
      ok: false,
      error: `Sent to ${out.sent}, then Resend stopped it: ${out.error}. The other ${out.failed} are still waiting — send again once that is fixed.`,
    };
  }
  return { ok: true, message: `Sent to ${out.sent} registrants.` };
}
