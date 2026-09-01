import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { slugify, uniqueSlug } from "@/lib/slug";
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

async function listLogoEntities(collection: string): Promise<LogoEntityRow[]> {
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
        scale: typeof d.scale === "number" ? d.scale : undefined,
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

function strings(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

export async function listSpeakers(): Promise<SpeakerRow[]> {
  const snap = await adminDb.collection(COLLECTIONS.speakers).get();
  const docs = snap.docs.sort(
    (a, b) =>
      orderOf(a.data()) - orderOf(b.data()) ||
      (a.get("name") ?? "").localeCompare(b.get("name") ?? ""),
  );

  // Two passes, because a stored slug is a published URL and must never lose
  // one to a derived one. Pass 1 reserves every slug an admin save has
  // committed (current and retired); pass 2 fills in anything added before
  // this field existed, deriving from the name and de-duping in list order.
  // Those derived slugs are provisional — the next admin save promotes one to
  // stored, which is what makes it safe to link to.
  const taken = new Set<string>();
  for (const doc of docs) {
    const stored = doc.get("slug");
    if (typeof stored === "string" && stored) taken.add(stored);
    for (const old of strings(doc.get("previousSlugs"))) taken.add(old);
  }

  return docs.map((doc) => {
    const d = doc.data();
    const stored = typeof d.slug === "string" && d.slug ? d.slug : null;
    const slug = stored ?? uniqueSlug(slugify(d.name ?? ""), taken);
    if (!stored) taken.add(slug);

    return {
      id: doc.id,
      slug,
      previousSlugs: strings(d.previousSlugs),
      name: d.name ?? "",
      title: d.title ?? "",
      company: d.company ?? "",
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

  // Stored slugs claim their names first, then the rest derive from the title
  // in document order — the same two-pass shape `listSpeakers` uses above, and
  // for the same reason: a derived slug must never take a name a stored one
  // already owns, whichever order they happen to be read in.
  const taken = new Set<string>();
  for (const doc of sessionsSnap.docs) {
    const stored = doc.get("slug");
    if (typeof stored === "string" && stored) taken.add(stored);
    // Retired slugs hold their names as well, or a new session could derive
    // one that already redirects somewhere else.
    for (const old of strings(doc.get("previousSlugs"))) taken.add(old);
  }

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
        slug: speaker?.slug ?? "",
      };
    });

    const stored = typeof d.slug === "string" && d.slug ? d.slug : null;
    const slug = stored ?? uniqueSlug(slugify(d.title ?? "", "session"), taken);
    if (!stored) taken.add(slug);

    return {
      id: doc.id,
      slug,
      previousSlugs: strings(d.previousSlugs),
      title: d.title ?? "",
      description: d.description ?? "",
      startsAt: toMillis(d.startsAt) ?? 0,
      endsAt: toMillis(d.endsAt),
      location: d.location ?? "",
      track: d.track ?? null,
      activation: d.activation ?? null,
      participants,
      createdAt: toMillis(d.createdAt) ?? 0,
    };
  });
}
