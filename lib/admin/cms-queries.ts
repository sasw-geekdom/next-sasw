import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type {
  LogoEntityRow,
  SpeakerRow,
  SessionRow,
  ResolvedParticipant,
  SessionParticipant,
} from "@/lib/admin/cms-types";

function toMillis(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

// Admin drag order; docs from before ordering existed sort last, by name.
function orderOf(d: FirebaseFirestore.DocumentData): number {
  return typeof d.order === "number" ? d.order : Number.MAX_SAFE_INTEGER;
}

async function listLogoEntities(
  collection: string,
): Promise<LogoEntityRow[]> {
  const snap = await adminDb.collection(collection).get();
  return snap.docs
    .sort(
      (a, b) =>
        orderOf(a.data()) - orderOf(b.data()) ||
        (a.get("name") ?? "").localeCompare(b.get("name") ?? ""),
    )
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? "",
        imageUrl: d.imageUrl ?? "",
        link: d.link ?? "",
        createdAt: toMillis(d.createdAt) ?? 0,
      };
    });
}

export function listPartners() {
  return listLogoEntities(COLLECTIONS.partners);
}

export function listSponsors() {
  return listLogoEntities(COLLECTIONS.sponsors);
}

export async function listSpeakers(): Promise<SpeakerRow[]> {
  const snap = await adminDb.collection(COLLECTIONS.speakers).get();
  return snap.docs
    .sort(
      (a, b) =>
        orderOf(a.data()) - orderOf(b.data()) ||
        (a.get("name") ?? "").localeCompare(b.get("name") ?? ""),
    )
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? "",
        imageUrl: d.imageUrl ?? "",
        bio: d.bio ?? "",
        linkedin: d.linkedin ?? "",
        createdAt: toMillis(d.createdAt) ?? 0,
      };
    });
}

export async function listSessions(): Promise<SessionRow[]> {
  const [sessionsSnap, speakers] = await Promise.all([
    adminDb.collection(COLLECTIONS.sessions).orderBy("startsAt").get(),
    listSpeakers(),
  ]);

  const byId = new Map(speakers.map((s) => [s.id, s]));

  return sessionsSnap.docs.map((doc) => {
    const d = doc.data();
    const raw: SessionParticipant[] = Array.isArray(d.participants)
      ? d.participants
      : [];
    const participants: ResolvedParticipant[] = raw.map((p) => {
      const speaker = byId.get(p.speakerId);
      return {
        speakerId: p.speakerId,
        role: p.role,
        name: speaker?.name ?? "Unknown speaker",
        imageUrl: speaker?.imageUrl || undefined,
      };
    });

    return {
      id: doc.id,
      title: d.title ?? "",
      description: d.description ?? "",
      startsAt: toMillis(d.startsAt) ?? 0,
      endsAt: toMillis(d.endsAt),
      location: d.location ?? "",
      track: d.track ?? null,
      participants,
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}
