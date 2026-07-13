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
