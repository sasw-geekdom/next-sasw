"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { EVENT_DAY_KEYS } from "@/lib/event";
import { deleteImage } from "@/lib/admin/blob";
import {
  ATTENDEE_TYPES,
  SUBMISSION_STATUSES,
  type AttendeeType,
  type SubmissionStatus,
} from "@/lib/admin/types";
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

      // Link to a speaker who is already there rather than making a second one.
      //
      // `promotedSpeakerId` was the only guard, and it is null on every
      // submission because this button has never been used — the whole speaker
      // list was entered by hand in the CMS. So pressing Add for somebody who
      // is already on the site created a duplicate profile silently, and the
      // pitch queue gave no sign that would happen.
      //
      // Exact name only. A looser rule would eventually merge two different
      // people, and the failure modes are not symmetric: linking the wrong
      // record is visible and reversible, quietly publishing a second page for
      // the same speaker is neither.
      const name = typeof d.name === "string" ? d.name.trim() : "";
      if (name) {
        const dupes = await tx.get(
          adminDb
            .collection(COLLECTIONS.speakers)
            .where("name", "==", name)
            .limit(1),
        );
        if (!dupes.empty) {
          const found = dupes.docs[0].id;
          tx.update(subRef, { promotedSpeakerId: found });
          return found;
        }
      }
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

/**
 * Check an attendee in for one day of the week.
 *
 * `day` comes from the browser rather than the server clock, because the server
 * runs in UTC and the door is in Central: after 7pm on the Monday a
 * server-derived date would already be writing Tuesday. It is validated against
 * the five event days, so a bad clock on a door device cannot invent a sixth.
 *
 * Idempotent twice over — a transaction stops two volunteers double-writing the
 * same person, and `arrayUnion` means replaying the same day is a no-op. That
 * second property is what lets the offline queue retry a check-in it is not
 * sure landed.
 */
export async function checkIn(id: string, day: string): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!id) return { ok: false, error: "Missing registration." };
  if (!EVENT_DAY_KEYS.has(day)) {
    return { ok: false, error: "That date is not part of the week." };
  }

  const ref = adminDb.collection(COLLECTIONS.registrations).doc(id);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("not-found");

      const days: string[] = Array.isArray(snap.get("checkedInDays"))
        ? snap.get("checkedInDays")
        : [];
      if (days.includes(day)) return; // already in for today — no-op

      tx.update(ref, {
        checkedIn: true,
        checkedInDays: FieldValue.arrayUnion(day),
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
/**
 * Move an inbound submission along its pipeline.
 *
 * Deliberately not `updateSubmissionStatus`, which is the speaker version and
 * looks reusable right up until it isn't: that one is hardcoded to the
 * `speakerSubmissions` collection and, on `accepted` or `declined`, sends the
 * speaker decision email. Pointing Get Involved at it would have written to the
 * wrong collection and told a sponsor their talk had been accepted.
 *
 * No email here at all. A sponsor conversation is a person picking up the phone,
 * not a templated notification, and `accepted` on this table means "we are doing
 * this with them" — a state the team sets after the conversation, not a trigger
 * for one.
 *
 * Revalidates the dashboard as well as the table, because the Inbound line on
 * `/admin` counts these rows and now reports how many are still open.
 */
export async function updateGetInvolvedStatus(
  id: string,
  status: SubmissionStatus,
): Promise<ActionResult> {
  await requireAdmin();

  if (!id || !SUBMISSION_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid request." };
  }

  await adminDb.collection(COLLECTIONS.getInvolved).doc(id).update({ status });

  revalidatePath("/admin/get-involved");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteGetInvolved(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing submission." };

  await adminDb.collection(COLLECTIONS.getInvolved).doc(id).delete();

  revalidatePath("/admin/get-involved");
  return { ok: true };
}

/**
 * Add somebody at the door and check them in, in one go.
 *
 * The door could only find people who had already registered, which left the
 * two groups most likely to turn up unhandled: walk-ups, at a free community
 * event where walking up is the normal way to attend, and speakers, who were
 * invited rather than registered and so are not in this collection at all. Both
 * were being turned away from the screen and written on paper.
 *
 * They land in `registrations` rather than a table of their own, because every
 * count the team relies on — attendance rate, the audience mix, the CSV a
 * sponsor gets — reads that collection, and a parallel list would have to be
 * merged into all of them by hand. `source: "door"` is what tells the two
 * apart afterwards.
 *
 * Idempotent on email. Two volunteers working the same queue can both add the
 * same person; the second call checks in the record the first one made instead
 * of creating a twin. Email is optional at a door, though — somebody who will
 * not give one still gets in, and without it there is nothing to match on, so
 * the guard simply does not apply.
 */
export async function registerAtDoor(input: {
  name: string;
  email?: string;
  company?: string;
  attendeeType?: AttendeeType;
  day: string;
  /**
   * A key the door device makes up before it sends anything.
   *
   * Email is the natural way to spot a duplicate, and at a door it is the one
   * field people decline to give. Without it a retry — which the offline queue
   * exists to perform — would add the same person twice. This is written onto
   * the document, so a replay finds its own earlier attempt regardless.
   */
  clientId?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireAdmin();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "A name is required." };
  if (!EVENT_DAY_KEYS.has(input.day)) {
    return { ok: false, error: "That date is not part of the week." };
  }
  const email = (input.email ?? "").trim().toLowerCase();
  const attendeeType = input.attendeeType ?? "attendee";
  if (!ATTENDEE_TYPES.includes(attendeeType)) {
    return { ok: false, error: "Unknown attendee type." };
  }

  const col = adminDb.collection(COLLECTIONS.registrations);

  if (input.clientId) {
    const replay = await col
      .where("doorClientId", "==", input.clientId)
      .limit(1)
      .get();
    if (!replay.empty) return { ok: true, id: replay.docs[0].id };
  }

  if (email) {
    const existing = await col.where("email", "==", email).limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      const days: string[] = Array.isArray(doc.get("checkedInDays"))
        ? doc.get("checkedInDays")
        : [];
      if (!days.includes(input.day)) {
        await doc.ref.update({
          checkedIn: true,
          checkedInDays: FieldValue.arrayUnion(input.day),
          checkedInAt: FieldValue.serverTimestamp(),
          checkedInBy: user.email,
        });
      }
      revalidatePath("/admin/checkin");
      revalidatePath("/admin/registrations");
      return { ok: true, id: doc.id };
    }
  }

  const ref = await col.add({
    name,
    email,
    company: input.company?.trim() ?? "",
    circuits: [],
    volunteerDays: [],
    sponsorConsent: false,
    source: "door",
    attendeeType,
    ...(input.clientId ? { doorClientId: input.clientId } : {}),
    checkedIn: true,
    checkedInDays: [input.day],
    checkedInAt: FieldValue.serverTimestamp(),
    checkedInBy: user.email,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/checkin");
  revalidatePath("/admin/registrations");
  return { ok: true, id: ref.id };
}

/**
 * Reverse one day's check-in (fix a mistake at the door).
 *
 * Removes the day, not the person. Someone wrongly marked in on the Thursday
 * still attended on the Monday, and clearing the record wholesale would have
 * taken that with it. `checkedIn` only goes false once no days are left.
 */
export async function undoCheckIn(
  id: string,
  day: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing registration." };
  if (!EVENT_DAY_KEYS.has(day)) {
    return { ok: false, error: "That date is not part of the week." };
  }

  const ref = adminDb.collection(COLLECTIONS.registrations).doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const days: string[] = Array.isArray(snap.get("checkedInDays"))
      ? snap.get("checkedInDays")
      : [];
    const left = days.filter((d) => d !== day);
    tx.update(ref, {
      checkedInDays: left,
      checkedIn: left.length > 0,
      ...(left.length === 0 ? { checkedInAt: null, checkedInBy: null } : {}),
    });
  });

  revalidatePath("/admin/checkin");
  revalidatePath("/admin/registrations");
  return { ok: true };
}
