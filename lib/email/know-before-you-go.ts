import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { getEmailCopy } from "@/lib/email/copy-store";
import { knowBeforeYouGoEmail } from "@/lib/email/templates";

/**
 * The know-before-you-go, sent to every registrant.
 *
 * The only one-to-many send in the app — every other email answers something
 * one person just did. So the three things a one-to-many send gets wrong are
 * handled here rather than left to whoever presses the button:
 *
 * - Twice. Each registration is stamped `knowBeforeYouGoSentAt` as its batch
 *   lands, and a run only takes the unstamped. Pressing Send again after a
 *   failure, or on Wednesday for the people who registered since, reaches
 *   exactly the people who have not had it.
 * - At once. A lock doc stops a second run starting while one is going, so
 *   two staff pressing Send in two tabs cannot both take the same list.
 * - Half. Batches go through Resend's batch endpoint, 100 at a time, each
 *   with an idempotency key built from its recipients: if a batch reached
 *   Resend but its stamps did not reach Firestore, the retry is recognised
 *   and not delivered again (Resend holds the key for 24 hours).
 *
 * What goes is the SAVED copy, never a draft in someone's editor — the admin
 * page will not offer the button while the editor has unsaved changes.
 */

const SENT_FIELD = "knowBeforeYouGoSentAt";
const LOCK_ID = "knowBeforeYouGo-lock";
// A lock older than this is a run that died without releasing it.
const LOCK_TTL_MS = 10 * 60 * 1000;
const BATCH = 100;

const VALID = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface KnowBeforeYouGoRun {
  at: number;
  by: string;
  sent: number;
  failed: number;
  error: string | null;
}

export interface KnowBeforeYouGoStatus {
  total: number;
  sent: number;
  pending: number;
  lastRun: KnowBeforeYouGoRun | null;
}

async function pendingRegistrations() {
  const snap = await adminDb.collection(COLLECTIONS.registrations).get();
  const all = snap.docs.filter((d) =>
    VALID.test(String(d.get("email") ?? "").trim()),
  );
  const pending = all
    .filter((d) => !d.get(SENT_FIELD))
    // Stable order, so a retry rebuilds the same batches and the same keys.
    .sort((a, b) => a.id.localeCompare(b.id));
  return { total: all.length, pending };
}

export async function knowBeforeYouGoStatus(): Promise<KnowBeforeYouGoStatus> {
  const [{ total, pending }, runs] = await Promise.all([
    pendingRegistrations(),
    adminDb
      .collection(COLLECTIONS.emailSends)
      .where("template", "==", "knowBeforeYouGo")
      .get(),
  ]);
  const last = runs.docs
    .map((d) => d.data())
    .filter((r) => r.finishedAt instanceof Timestamp)
    .sort((a, b) => b.finishedAt.toMillis() - a.finishedAt.toMillis())[0];
  return {
    total,
    sent: total - pending.length,
    pending: pending.length,
    lastRun: last
      ? {
          at: last.finishedAt.toMillis(),
          by: String(last.by ?? ""),
          sent: Number(last.sent ?? 0),
          failed: Number(last.failed ?? 0),
          error: last.error ? String(last.error) : null,
        }
      : null,
  };
}

export type SendOutcome =
  | { ok: true; sent: number; failed: number; error: string | null }
  | { ok: false; error: string };

/**
 * Send to everyone not yet sent to. `expected` is the waiting count the admin
 * saw when they pressed Send: if the list moved since, nothing goes and they
 * are shown the new number — a confirmation is only a confirmation of the
 * number it named.
 */
export async function sendKnowBeforeYouGo(
  by: string,
  expected: number,
): Promise<SendOutcome> {
  const { pending } = await pendingRegistrations();
  if (pending.length === 0) {
    return { ok: false, error: "Everyone registered has already been sent it." };
  }
  if (pending.length !== expected) {
    return {
      ok: false,
      error: `The list changed since this page loaded — ${pending.length} are waiting now, not ${expected}. Refresh and check the number before sending.`,
    };
  }

  const lock = adminDb.collection(COLLECTIONS.emailSends).doc(LOCK_ID);
  try {
    await adminDb.runTransaction(async (tx) => {
      const held = await tx.get(lock);
      const at = held.get("at");
      if (
        held.exists &&
        at instanceof Timestamp &&
        Date.now() - at.toMillis() < LOCK_TTL_MS
      ) {
        throw new Error(`already sending (${held.get("by")})`);
      }
      tx.set(lock, { at: Timestamp.now(), by });
    });
  } catch (err) {
    return {
      ok: false,
      error: `A send is already running — ${(err as Error).message}. Give it a minute and refresh.`,
    };
  }

  const copy = await getEmailCopy("knowBeforeYouGo");
  const run = adminDb.collection(COLLECTIONS.emailSends).doc();
  await run.set({
    template: "knowBeforeYouGo",
    by,
    subject: copy.subject,
    expected,
    startedAt: FieldValue.serverTimestamp(),
  });

  let sent = 0;
  let failed = 0;
  let error: string | null = null;
  try {
    for (let i = 0; i < pending.length; i += BATCH) {
      const chunk = pending.slice(i, i + BATCH);
      const payload = chunk.map((d) => {
        const { subject, html } = knowBeforeYouGoEmail(
          { name: String(d.get("name") ?? "") },
          copy,
        );
        return {
          from: EMAIL_FROM,
          to: String(d.get("email")).trim(),
          replyTo: EMAIL_REPLY_TO,
          subject,
          html,
        };
      });
      const key =
        "kbyg-" +
        createHash("sha256")
          .update(chunk.map((d) => d.id).join(","))
          .digest("hex")
          .slice(0, 40);

      const res = await resend.batch.send(payload, { idempotencyKey: key });
      if (res.error) {
        // Stop rather than skip ahead: the likeliest cause is a quota or a
        // key problem, and every later batch would fail the same way. What
        // went out is stamped; the rest wait for the next press.
        failed = pending.length - sent;
        error = res.error.message;
        break;
      }

      const stamp = adminDb.batch();
      for (const d of chunk) {
        stamp.update(d.ref, { [SENT_FIELD]: FieldValue.serverTimestamp() });
      }
      await stamp.commit();
      sent += chunk.length;
    }
  } finally {
    await run.set(
      { sent, failed, error, finishedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await lock.delete();
  }

  return { ok: true, sent, failed, error };
}
