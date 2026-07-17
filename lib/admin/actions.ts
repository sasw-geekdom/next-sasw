"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/admin/types";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Server-side auth — never trust the client for a mutation.
  await requireAdmin();

  if (!id || !SUBMISSION_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid request." };
  }

  await adminDb
    .collection(COLLECTIONS.speakerSubmissions)
    .doc(id)
    .update({ status });

  revalidatePath("/admin/speakers");
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
      error: e instanceof Error && e.message === "not-found"
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
