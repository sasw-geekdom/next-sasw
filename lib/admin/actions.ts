"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { deleteImage } from "@/lib/admin/blob";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/admin/types";
import { getEmailCopy } from "@/lib/email/copy-store";
import { renderEmail } from "@/lib/email/templates";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Set a submission's status, and tell the person where they stand.
 *
 * Accepted and declined are the two statuses that are an answer rather than a
 * note to ourselves, so they send. "new" and "reviewing" do not — those are
 * the queue moving, and the submitter already had a receipt when they pitched.
 *
 * Sending is guarded by `decisionEmailedFor`, which records the status the
 * last email announced. Statuses get toggled — someone re-reads a submission,
 * flips it back to reviewing, flips it forward again — and without the guard
 * that is a second "you're in" to somebody who already had one. Changing your
 * mind the other way does still send, which is correct: accepted-then-declined
 * is news.
 *
 * A failed send never fails the status change. The decision is the thing being
 * recorded; the email is how it travels, and losing the second is not a reason
 * to lose the first. It comes back as a warning the table can show.
 */
export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  // Server-side auth — never trust the client for a mutation.
  await requireAdmin();

  if (!id || !SUBMISSION_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid request." };
  }

  const ref = adminDb.collection(COLLECTIONS.speakerSubmissions).doc(id);
  const before = await ref.get();
  const row = before.data() ?? {};

  await ref.update({ status });
  revalidatePath("/admin/speakers");

  const decides = status === "accepted" || status === "declined";
  if (!decides || row.decisionEmailedFor === status) return { ok: true };

  const to = typeof row.email === "string" ? row.email.trim() : "";
  if (!to) {
    return { ok: true, warning: "Status saved. No email on file to notify." };
  }

  try {
    const key = status === "accepted" ? "speakerAccepted" : "speakerDeclined";
    const copy = await getEmailCopy(key);
    const name = typeof row.name === "string" ? row.name : "";
    const { subject, html } = renderEmail(copy, {
      firstName: name.split(" ")[0] || name || "there",
      sessionTitle:
        typeof row.sessionTitle === "string"
          ? row.sessionTitle
          : "your session",
    });
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    });
    await ref.update({
      decisionEmailedFor: status,
      decisionEmailedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("Decision email failed:", err);
    return {
      ok: true,
      warning: `Status saved, but the ${status} email did not send.`,
    };
  }

  return { ok: true };
}

/** Promote an accepted submission into the Speakers CMS. Idempotent — a second
 *  call reuses the speaker already created (tracked via promotedSpeakerId), so it
 *  can't create duplicates. Carries over name, bio, LinkedIn, and the headshot
 *  (the Blob URL is reused — no re-upload). */
export async function promoteToSpeaker(
  id: string,
): Promise<{ ok: true; speakerId: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing submission." };

  const subRef = adminDb.collection(COLLECTIONS.speakerSubmissions).doc(id);
  const speakerRef = adminDb.collection(COLLECTIONS.speakers).doc();

  try {
    const speakerId = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(subRef);
      if (!snap.exists) throw new Error("not-found");

      const existing = snap.get("promotedSpeakerId");
      if (existing) return existing as string; // already promoted

      const d = snap.data() ?? {};
      tx.set(speakerRef, {
        name: d.name ?? "",
        imageUrl: d.headshotUrl ?? "",
        bio: d.bio ?? "",
        linkedin: d.linkedin ?? d.website ?? "",
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(subRef, { promotedSpeakerId: speakerRef.id });
      return speakerRef.id;
    });

    revalidatePath("/admin/speakers");
    revalidatePath("/admin/content/speakers");
    return { ok: true, speakerId };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message === "not-found"
          ? "Submission not found."
          : "Promotion failed.",
    };
  }
}

/** Check an attendee in. Idempotent — a second call on an already-checked-in
 *  registration is a no-op, and a transaction prevents double-writes at the door. */
export async function checkIn(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!id) return { ok: false, error: "Missing registration." };

  const ref = adminDb.collection(COLLECTIONS.registrations).doc(id);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("not-found");
      if (snap.get("checkedIn")) return; // already in — no-op
      tx.update(ref, {
        checkedIn: true,
        checkedInAt: FieldValue.serverTimestamp(),
        checkedInBy: user.email,
      });
    });
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message === "not-found"
          ? "Registration not found."
          : "Check-in failed.",
    };
  }

  revalidatePath("/admin/checkin");
  revalidatePath("/admin/registrations");
  return { ok: true };
}

/** Permanently delete a registration (test-data cleanup). */
export async function deleteRegistration(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing registration." };

  await adminDb.collection(COLLECTIONS.registrations).doc(id).delete();

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/checkin");
  return { ok: true };
}

/**
 * Permanently delete a session pitch (test-data cleanup).
 *
 * Unlike the other two deletes, this one has a file attached. A pitch's
 * headshot lives in Vercel Blob, which is not garbage-collected — deleting
 * only the document would strand the image and keep paying for it forever,
 * and the document is the sole record of its URL. So the blob goes first.
 *
 * `deleteImage` is best-effort and never throws, so a blob that has already
 * gone doesn't block removing the row.
 *
 * Deliberately does NOT touch a speaker promoted from this pitch. Once
 * someone is in the lineup they are their own record, edited independently,
 * and deleting a test pitch should not quietly remove a public profile. Clear
 * those from Content → Speakers.
 */
export async function deleteSpeakerSubmission(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing submission." };

  const ref = adminDb.collection(COLLECTIONS.speakerSubmissions).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Already gone." };

  await deleteImage(snap.get("headshotUrl"));
  await ref.delete();

  revalidatePath("/admin/speakers");
  return { ok: true };
}

/** Permanently delete a Get Involved submission (test-data cleanup). */
export async function deleteGetInvolved(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing submission." };

  await adminDb.collection(COLLECTIONS.getInvolved).doc(id).delete();

  revalidatePath("/admin/get-involved");
  return { ok: true };
}

/** Reverse a check-in (fix a mistake at the door). */
export async function undoCheckIn(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing registration." };

  await adminDb.collection(COLLECTIONS.registrations).doc(id).update({
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
  });

  revalidatePath("/admin/checkin");
  revalidatePath("/admin/registrations");
  return { ok: true };
}
