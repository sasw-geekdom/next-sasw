import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { broadcastEmail, type BroadcastContent } from "@/lib/email/templates";
import {
  UNSUBSCRIBED_FIELD,
  unsubscribeOneClickUrl,
  unsubscribePageUrl,
  unsubscribeReady,
} from "@/lib/email/unsubscribe";

/**
 * Team emails to every registrant — written in Admin → Emails → New email.
 *
 * The same three guards as the know-before-you-go (lib/email/know-before-you-go.ts),
 * per email rather than per template:
 *
 * - Twice. Each registration is stamped `broadcastsSent.<emailId>` as its
 *   batch lands, and a run only takes the unstamped. A retry after a failure
 *   reaches exactly the people still waiting.
 * - At once. The email doc carries a send lock, taken in a transaction.
 * - Half. Batches of 100 through Resend's batch endpoint, each with an
 *   idempotency key from its recipients.
 *
 * And two that are new here:
 *
 * - Tested. The send refuses unless the saved version is the version someone
 *   last sent themselves as a test — `testedHash` against the content's hash.
 * - Leavable. Every email carries its reader's own unsubscribe link and the
 *   one-click header, and anyone who has used one is skipped.
 */

const BATCH = 100;
const LOCK_TTL_MS = 10 * 60 * 1000;
const VALID = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SENT_MAP = "broadcastsSent";

export interface BroadcastRun {
  at: number;
  by: string;
  sent: number;
  failed: number;
  error: string | null;
}

export interface BroadcastRow extends BroadcastContent {
  id: string;
  createdBy: string;
  updatedAt: number | null;
  updatedBy: string;
  /** Hash of the content that was last sent as a test, if any. */
  testedHash: string | null;
  testedBy: string;
  /** Hash of the saved content — tested when it equals `testedHash`. */
  savedHash: string;
  /** People this email has reached. */
  sent: number;
  /** People it would reach now: registered, reachable, not unsubscribed, not sent. */
  pending: number;
  lastRun: BroadcastRun | null;
}

export interface BroadcastList {
  rows: BroadcastRow[];
  /** Registrants who can be emailed at all. */
  reachable: number;
  unsubscribed: number;
}

export function contentHash(c: BroadcastContent): string {
  return createHash("sha256")
    .update(JSON.stringify([c.subject, c.preheader, c.heading, c.body]))
    .digest("hex")
    .slice(0, 32);
}

async function registrations() {
  const snap = await adminDb.collection(COLLECTIONS.registrations).get();
  const valid = snap.docs.filter((d) => VALID.test(String(d.get("email") ?? "").trim()));
  const reachable = valid.filter((d) => !d.get(UNSUBSCRIBED_FIELD));
  return { reachable, unsubscribed: valid.length - reachable.length };
}

function sentTo(d: FirebaseFirestore.QueryDocumentSnapshot, id: string): boolean {
  const map = d.get(SENT_MAP);
  return Boolean(map && typeof map === "object" && map[id]);
}

function toContent(data: FirebaseFirestore.DocumentData): BroadcastContent {
  return {
    subject: String(data.subject ?? ""),
    preheader: String(data.preheader ?? ""),
    heading: String(data.heading ?? ""),
    body: String(data.body ?? ""),
  };
}

export async function listBroadcasts(): Promise<BroadcastList> {
  const [{ reachable, unsubscribed }, snap] = await Promise.all([
    registrations(),
    adminDb.collection(COLLECTIONS.broadcasts).get(),
  ]);
  const rows = snap.docs
    .map((doc) => {
      const d = doc.data();
      const sent = reachable.filter((r) => sentTo(r, doc.id)).length;
      const run = d.lastRun;
      return {
        id: doc.id,
        ...toContent(d),
        createdBy: String(d.createdBy ?? ""),
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : null,
        updatedBy: String(d.updatedBy ?? ""),
        testedHash: d.testedHash ? String(d.testedHash) : null,
        testedBy: String(d.testedBy ?? ""),
        savedHash: contentHash(toContent(d)),
        sent,
        pending: reachable.length - sent,
        lastRun:
          run && run.at instanceof Timestamp
            ? {
                at: run.at.toMillis(),
                by: String(run.by ?? ""),
                sent: Number(run.sent ?? 0),
                failed: Number(run.failed ?? 0),
                error: run.error ? String(run.error) : null,
              }
            : null,
      } satisfies BroadcastRow;
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return { rows, reachable: reachable.length, unsubscribed };
}

export async function getBroadcastContent(id: string): Promise<BroadcastContent | null> {
  const snap = await adminDb.collection(COLLECTIONS.broadcasts).doc(id).get();
  return snap.exists ? toContent(snap.data()!) : null;
}

export type BroadcastSendOutcome =
  | { ok: true; sent: number; failed: number; error: string | null }
  | { ok: false; error: string };

/** One email per recipient, with their name and their own unsubscribe link. */
function message(content: BroadcastContent, d: FirebaseFirestore.QueryDocumentSnapshot) {
  const { subject, html } = broadcastEmail(
    content,
    { name: String(d.get("name") ?? "") },
    unsubscribePageUrl(d.id),
  );
  return {
    from: EMAIL_FROM,
    to: String(d.get("email")).trim(),
    replyTo: EMAIL_REPLY_TO,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeOneClickUrl(d.id)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export async function sendBroadcast(
  id: string,
  by: string,
  expected: number,
): Promise<BroadcastSendOutcome> {
  if (!unsubscribeReady()) {
    return {
      ok: false,
      error: "Unsubscribe links can't be signed on this deployment (CRON_SECRET is not set). Nothing was sent.",
    };
  }
  const ref = adminDb.collection(COLLECTIONS.broadcasts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "That email no longer exists." };
  const content = toContent(snap.data()!);
  if (snap.get("testedHash") !== contentHash(content)) {
    return {
      ok: false,
      error: "Send yourself a test of the saved version first — it has changed since the last test.",
    };
  }

  const { reachable } = await registrations();
  const pending = reachable
    .filter((d) => !sentTo(d, id))
    // Stable order, so a retry rebuilds the same batches and the same keys.
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pending.length === 0) return { ok: false, error: "Everyone registered has already had this email." };
  if (pending.length !== expected) {
    return {
      ok: false,
      error: `The list changed since this page loaded — ${pending.length} are waiting now, not ${expected}. Refresh and check the number before sending.`,
    };
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const held = await tx.get(ref);
      const at = held.get("sendingAt");
      if (at instanceof Timestamp && Date.now() - at.toMillis() < LOCK_TTL_MS) {
        throw new Error(`already sending (${held.get("sendingBy")})`);
      }
      tx.update(ref, { sendingAt: Timestamp.now(), sendingBy: by });
    });
  } catch (err) {
    return { ok: false, error: `A send is already running — ${(err as Error).message}. Give it a minute and refresh.` };
  }

  let sent = 0;
  let failed = 0;
  let error: string | null = null;
  try {
    for (let i = 0; i < pending.length; i += BATCH) {
      const chunk = pending.slice(i, i + BATCH);
      const key =
        `bc-${id}-` +
        createHash("sha256").update(chunk.map((d) => d.id).join(",")).digest("hex").slice(0, 32);
      const res = await resend.batch.send(chunk.map((d) => message(content, d)), { idempotencyKey: key });
      if (res.error) {
        // Stop rather than skip ahead: a quota or key problem fails every
        // later batch the same way. What went out is stamped.
        failed = pending.length - sent;
        error = res.error.message;
        break;
      }
      const stamp = adminDb.batch();
      for (const d of chunk) {
        stamp.update(d.ref, { [`${SENT_MAP}.${id}`]: FieldValue.serverTimestamp() });
      }
      await stamp.commit();
      sent += chunk.length;
    }
  } finally {
    await ref.update({
      sendingAt: FieldValue.delete(),
      sendingBy: FieldValue.delete(),
      lastRun: { at: Timestamp.now(), by, sent, failed, error },
      totalSent: FieldValue.increment(sent),
    });
  }
  return { ok: true, sent, failed, error };
}

/** The saved version, to the admin who asked — and it records that it was tested. */
export async function testBroadcast(id: string, to: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!unsubscribeReady()) {
    return { ok: false, error: "Unsubscribe links can't be signed on this deployment (CRON_SECRET is not set)." };
  }
  const ref = adminDb.collection(COLLECTIONS.broadcasts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Save the email first." };
  const content = toContent(snap.data()!);
  // A sample reader, with a real signed link that points at nobody's record.
  const { subject, html } = broadcastEmail(content, { name: "Alex Rivera" }, unsubscribePageUrl("test"));
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    replyTo: EMAIL_REPLY_TO,
    subject: `[Test] ${subject}`,
    html,
  });
  if (error) return { ok: false, error: `Resend refused the test: ${error.message}` };
  await ref.update({ testedHash: contentHash(content), testedBy: to, testedAt: FieldValue.serverTimestamp() });
  return { ok: true };
}
