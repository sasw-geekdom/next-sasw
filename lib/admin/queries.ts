import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type {
  RegistrationRow,
  SpeakerSubmissionRow,
  GetInvolvedRow,
} from "@/lib/admin/types";

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

export async function listSpeakerSubmissions(): Promise<
  SpeakerSubmissionRow[]
> {
  const snap = await adminDb
    .collection(COLLECTIONS.speakerSubmissions)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      email: d.email ?? "",
      company: d.company ?? undefined,
      track: d.track ?? "",
      sessionTitle: d.sessionTitle ?? "",
      abstract: d.abstract ?? "",
      bio: d.bio ?? "",
      website: d.website ?? undefined,
      linkedin: d.linkedin ?? undefined,
      availability: d.availability ?? undefined,
      headshotUrl: d.headshotUrl ?? undefined,
      status: d.status ?? "new",
      promotedSpeakerId: d.promotedSpeakerId ?? null,
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}

export async function listGetInvolved(): Promise<GetInvolvedRow[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.getInvolved)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      path: d.path ?? "general",
      name: d.name ?? "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      company: d.company ?? "",
      role: d.role ?? "",
      anchorEvent: d.anchorEvent ?? undefined,
      goals: d.goals ?? undefined,
      budget: d.budget ?? undefined,
      eventConcept: d.eventConcept ?? undefined,
      audience: Array.isArray(d.audience) ? d.audience : [],
      attendance: d.attendance ?? undefined,
      preferredTime: d.preferredTime ?? undefined,
      venue: d.venue ?? undefined,
      coSponsors: d.coSponsors ?? undefined,
      question: d.question ?? undefined,
      heardAbout: d.heardAbout ?? undefined,
      notes: d.notes ?? undefined,
      status: d.status ?? "new",
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}

/**
 * Just the names on the speaker roster, for the door.
 *
 * A speaker is not a registration — they were invited, and plenty of them never
 * filled in the public form — so searching the check-in list for one finds
 * nothing. This gives the door something to match against, and checking one in
 * writes a door registration for them.
 */
export async function listSpeakerNames(): Promise<
  { id: string; name: string }[]
> {
  const snap = await adminDb.collection(COLLECTIONS.speakers).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, name: (doc.data().name ?? "") as string }))
    .filter((s) => s.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listRegistrations(): Promise<RegistrationRow[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.registrations)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      email: d.email ?? "",
      zip: d.zip ?? undefined,
      describesYou: d.describesYou ?? undefined,
      company: d.company ?? undefined,
      role: d.role ?? undefined,
      industry: d.industry ?? undefined,
      saTenure: d.saTenure ?? undefined,
      circuits: Array.isArray(d.circuits) ? d.circuits : [],
      firstTime: typeof d.firstTime === "boolean" ? d.firstTime : undefined,
      volunteerInterested:
        typeof d.volunteerInterested === "boolean"
          ? d.volunteerInterested
          : undefined,
      volunteerDays: Array.isArray(d.volunteerDays) ? d.volunteerDays : [],
      volunteerNotes: d.volunteerNotes ?? undefined,
      sponsorConsent: Boolean(d.sponsorConsent),
      checkedIn: Boolean(d.checkedIn),
      checkedInAt: toMillis(d.checkedInAt),
      checkedInBy: d.checkedInBy ?? null,
      checkedInDays: Array.isArray(d.checkedInDays) ? d.checkedInDays : [],
      createdAt: toMillis(d.createdAt) ?? 0,
      source: d.source === "door" ? "door" : undefined,
      attendeeType: d.attendeeType ?? undefined,
    };
  });
}
