"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/admin/types";

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
