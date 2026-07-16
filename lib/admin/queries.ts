import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type {
  RegistrationRow,
  SpeakerSubmissionRow,
  VolunteerRow,
  SponsorLeadRow,
} from "@/lib/admin/types";

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

export async function listSpeakerSubmissions(): Promise<SpeakerSubmissionRow[]> {
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

export async function listVolunteers(): Promise<VolunteerRow[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.volunteers)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      email: d.email ?? "",
      phone: d.phone ?? undefined,
      availability: d.availability ?? "",
      interests: Array.isArray(d.interests) ? d.interests : [],
      notes: d.notes ?? undefined,
      status: d.status ?? "new",
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}

export async function listSponsorLeads(): Promise<SponsorLeadRow[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.sponsorLeads)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      email: d.email ?? "",
      company: d.company ?? "",
      role: d.role ?? "",
      website: d.website ?? undefined,
      level: d.level ?? "",
      message: d.message ?? undefined,
      status: d.status ?? "new",
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
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
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}
