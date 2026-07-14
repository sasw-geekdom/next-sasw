import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type {
  RegistrationRow,
  SpeakerSubmissionRow,
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
      company: d.company ?? undefined,
      role: d.role ?? undefined,
      interest: d.interest ?? undefined,
      checkedIn: Boolean(d.checkedIn),
      checkedInAt: toMillis(d.checkedInAt),
      checkedInBy: d.checkedInBy ?? null,
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}
