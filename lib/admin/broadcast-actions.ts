"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { broadcastSchema } from "@/lib/validation/schemas";
import { sendBroadcast, testBroadcast } from "@/lib/email/broadcasts";

// Team emails to every registrant. Any admin can draft, test and send; the
// guards against sending twice, sending untested and sending to the wrong
// number live in lib/email/broadcasts.ts.

export type BroadcastActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string; issues?: Record<string, string[] | undefined> };

const PATH = "/admin/content/emails";

/** Create (no id) or update a draft. */
export async function saveBroadcast(id: string | null, values: unknown): Promise<BroadcastActionResult> {
  const user = await requireAdmin();
  const parsed = broadcastSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields.", issues: parsed.error.flatten().fieldErrors };
  }
  const col = adminDb.collection(COLLECTIONS.broadcasts);
  const ref = id ? col.doc(id) : col.doc();
  if (id) {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "That email no longer exists." };
    if (Number(snap.get("totalSent") ?? 0) > 0) {
      return { ok: false, error: "This email has already gone out, so it can't be edited. Start a new one instead." };
    }
  }
  await ref.set(
    {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.email,
      ...(id ? {} : { createdAt: FieldValue.serverTimestamp(), createdBy: user.email, totalSent: 0 }),
    },
    { merge: true },
  );
  revalidatePath(PATH);
  return { ok: true, message: "Saved.", id: ref.id };
}

/** Drafts only: once anything has gone out, the record stays. */
export async function deleteBroadcast(id: string): Promise<BroadcastActionResult> {
  await requireAdmin();
  const ref = adminDb.collection(COLLECTIONS.broadcasts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: true, message: "Deleted." };
  if (Number(snap.get("totalSent") ?? 0) > 0) {
    return { ok: false, error: "This email has already gone out, so it stays in the log." };
  }
  await ref.delete();
  revalidatePath(PATH);
  return { ok: true, message: "Draft deleted." };
}

export async function sendBroadcastTest(id: string): Promise<BroadcastActionResult> {
  const user = await requireAdmin();
  const out = await testBroadcast(id, user.email).catch((err: Error) => ({ ok: false as const, error: err.message }));
  revalidatePath(PATH);
  return out.ok ? { ok: true, message: `Test sent to ${user.email}.` } : { ok: false, error: out.error };
}

export async function sendBroadcastToAll(id: string, expected: number): Promise<BroadcastActionResult> {
  const user = await requireAdmin();
  if (!Number.isInteger(expected) || expected < 1) return { ok: false, error: "Nothing to send." };
  let out;
  try {
    out = await sendBroadcast(id, user.email, expected);
  } catch (err) {
    console.error("Broadcast send failed:", err);
    revalidatePath(PATH);
    return {
      ok: false,
      error: "The send stopped partway. Whoever it reached is marked as sent — refresh to see how many are still waiting, then send again.",
    };
  }
  revalidatePath(PATH);
  if (!out.ok) return { ok: false, error: out.error };
  if (out.error) {
    return {
      ok: false,
      error: `Sent to ${out.sent}, then Resend stopped it: ${out.error}. The other ${out.failed} are still waiting — send again once that is fixed.`,
    };
  }
  return { ok: true, message: `Sent to ${out.sent} registrants.` };
}
