"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { uploadImage, deleteImage, ImageError } from "@/lib/admin/blob";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  logoEntitySchema,
  speakerSchema,
  sessionSchema,
} from "@/lib/validation/schemas";
import type { CmsEntity, SessionParticipant } from "@/lib/admin/cms-types";

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string; issues?: Record<string, string[] | undefined> };

const okResult = (id: string): SaveResult => ({ ok: true, id });

function revalidate(entity: CmsEntity) {
  revalidatePath(`/admin/content/${entity}`);
  // Both public pages are ISR'd (revalidate = 300) — an edit that feeds one
  // has to bust it, or it sits behind that window. Partners + sponsors feed
  // the homepage wall; speakers feed the homepage lineup *and* /speakers; and
  // sessions decide which circuits a speaker carries on /speakers, so a
  // session write moves speaker chips even though no speaker doc changed.
  if (entity === "partners" || entity === "sponsors") {
    revalidatePath("/");
  }
  if (entity === "speakers") {
    revalidatePath("/");
    revalidatePath("/speakers");
    revalidateSpeakerPages();
  }
  if (entity === "sessions") {
    revalidatePath("/speakers");
    revalidateSpeakerPages();
    // Sessions render on the activation pages now, and those are ISR'd at
    // 300s like everything else public. Without this an admin saves a session
    // and it stays invisible on /schedule/<activation> for five minutes —
    // the same failure partners and sponsors hit on reorder.
    revalidateActivationPages();
  }
}

// Every /speakers/[slug] page at once — the writer doesn't know which slugs
// moved (a session edit can change several people's circuits), and the route
// pattern form busts them all. Both spellings are issued because the page
// lives inside the (site) route group and revalidatePath matches on the route
// file structure; the one that doesn't match is a no-op.
function revalidateActivationPages() {
  revalidatePath("/schedule");
  revalidatePath("/schedule/[slug]", "page");
  revalidatePath("/(site)/schedule/[slug]", "page");
  // The day view as well, which this used to miss. It reads the same calendar
  // as /schedule, so a session write moves it too — and now that a standalone
  // session draws its own block, the day it lands on is the page most likely
  // to be looked at straight after the edit.
  revalidatePath("/schedule/day/[iso]", "page");
  revalidatePath("/(site)/schedule/day/[iso]", "page");
}

function revalidateSpeakerPages() {
  revalidatePath("/speakers/[slug]", "page");
  revalidatePath("/(site)/speakers/[slug]", "page");
}

/** Pull the optional uploaded image; upload if present, else return null. */
async function nextImageUrl(
  form: FormData,
  prefix: string,
): Promise<string | null> {
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    return uploadImage(file, prefix);
  }
  return null;
}

// ─── Partners + Sponsors (shared shape) ─────────────────────────────────────
async function saveLogoEntity(
  entity: "partners" | "sponsors",
  form: FormData,
): Promise<SaveResult> {
  await requireAdmin();
  const collection = COLLECTIONS[entity];
  const id = (form.get("id") as string) || null;

  const parsed = logoEntitySchema.safeParse({
    name: form.get("name"),
    link: form.get("link"),
    scale: form.get("scale"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await nextImageUrl(form, entity);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ImageError ? e.message : "Upload failed.",
    };
  }

  const ref = id
    ? adminDb.collection(collection).doc(id)
    : adminDb.collection(collection).doc();

  if (id) {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "Not found." };
    if (imageUrl) await deleteImage(snap.get("imageUrl")); // replace old
    await ref.update({
      ...parsed.data,
      ...(imageUrl ? { imageUrl } : {}),
    });
  } else {
    if (!imageUrl) return { ok: false, error: "An image is required." };
    await ref.set({
      ...parsed.data,
      imageUrl,
      order: Date.now(), // new entries sort after any drag-ordered ones
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  revalidate(entity);
  return okResult(ref.id);
}

// ─── Display order (drag-and-drop in the admin) ─────────────────────────────
const REORDERABLE = ["partners", "sponsors", "speakers"] as const;
type Reorderable = (typeof REORDERABLE)[number];

async function reorderEntities(
  entity: Reorderable,
  ids: string[],
): Promise<SaveResult> {
  await requireAdmin();
  if (
    !REORDERABLE.includes(entity) ||
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 500 ||
    ids.some((id) => typeof id !== "string" || !id)
  ) {
    return { ok: false, error: "Bad order." };
  }
  try {
    const batch = adminDb.batch();
    ids.forEach((id, i) => {
      batch.update(adminDb.collection(COLLECTIONS[entity]).doc(id), {
        order: i,
      });
    });
    await batch.commit();
  } catch {
    return { ok: false, error: "Reorder failed — refresh and try again." };
  }
  revalidate(entity);
  revalidatePath("/"); // the homepage wall follows this order
  return okResult("");
}

export async function reorderPartners(ids: string[]) {
  return reorderEntities("partners", ids);
}
export async function reorderSponsors(ids: string[]) {
  return reorderEntities("sponsors", ids);
}
export async function reorderSpeakers(ids: string[]) {
  return reorderEntities("speakers", ids);
}

export async function savePartner(form: FormData) {
  return saveLogoEntity("partners", form);
}
export async function saveSponsor(form: FormData) {
  return saveLogoEntity("sponsors", form);
}

async function deleteLogoEntity(
  entity: "partners" | "sponsors",
  id: string,
): Promise<SaveResult> {
  await requireAdmin();
  const ref = adminDb.collection(COLLECTIONS[entity]).doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    await deleteImage(snap.get("imageUrl"));
    await ref.delete();
  }
  revalidate(entity);
  return okResult(id);
}

export async function deletePartner(id: string) {
  return deleteLogoEntity("partners", id);
}
export async function deleteSponsor(id: string) {
  return deleteLogoEntity("sponsors", id);
}

// ─── Speakers ───────────────────────────────────────────────────────────────
export async function saveSpeaker(form: FormData): Promise<SaveResult> {
  await requireAdmin();
  const id = (form.get("id") as string) || null;

  const parsed = speakerSchema.safeParse({
    name: form.get("name"),
    // Absent for anything submitting the pre-title/company/slug form shape.
    slug: form.get("slug") ?? "",
    title: form.get("title") ?? "",
    company: form.get("company") ?? "",
    bio: form.get("bio"),
    linkedin: form.get("linkedin"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await nextImageUrl(form, "speakers");
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ImageError ? e.message : "Upload failed.",
    };
  }

  const ref = id
    ? adminDb.collection(COLLECTIONS.speakers).doc(id)
    : adminDb.collection(COLLECTIONS.speakers).doc();

  // Every slug spoken for by someone else — current *and* retired, so a new
  // speaker can't claim a URL that already redirects to a different person.
  const collection = await adminDb.collection(COLLECTIONS.speakers).get();
  const taken = new Set<string>();
  for (const doc of collection.docs) {
    if (doc.id === ref.id) continue;
    const current = doc.get("slug");
    if (typeof current === "string" && current) taken.add(current);
    for (const old of doc.get("previousSlugs") ?? []) {
      if (typeof old === "string") taken.add(old);
    }
  }

  // Blank means derive from the name. The admin form pre-fills the field with
  // the existing slug, so a rename leaves the URL alone unless the slug was
  // edited too — published links stay published.
  const slug = uniqueSlug(parsed.data.slug || slugify(parsed.data.name), taken);

  if (id) {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "Not found." };
    if (imageUrl) await deleteImage(snap.get("imageUrl"));

    // A changed slug retires the old one rather than dropping it, so links
    // already in the wild redirect instead of 404ing. Reclaiming a slug this
    // speaker used before just removes it from the retired list.
    const retired = new Set<string>(
      (snap.get("previousSlugs") ?? []).filter(
        (s: unknown): s is string => typeof s === "string",
      ),
    );
    const previous = snap.get("slug");
    if (typeof previous === "string" && previous && previous !== slug) {
      retired.add(previous);
    }
    retired.delete(slug);

    await ref.update({
      ...parsed.data,
      slug,
      previousSlugs: [...retired],
      ...(imageUrl ? { imageUrl } : {}),
    });
  } else {
    if (!imageUrl) return { ok: false, error: "A headshot is required." };
    await ref.set({
      ...parsed.data,
      slug,
      previousSlugs: [],
      imageUrl,
      order: Date.now(), // new entries sort after any drag-ordered ones
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  revalidate("speakers");
  return okResult(ref.id);
}

export async function deleteSpeaker(id: string): Promise<SaveResult> {
  await requireAdmin();
  const ref = adminDb.collection(COLLECTIONS.speakers).doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    await deleteImage(snap.get("imageUrl"));
    await ref.delete();
  }
  revalidate("speakers");
  // Sessions may reference this speaker; the schedule resolves missing ones gracefully.
  revalidate("sessions");
  return okResult(id);
}

// ─── Sessions ───────────────────────────────────────────────────────────────
export async function saveSession(form: FormData): Promise<SaveResult> {
  await requireAdmin();
  const id = (form.get("id") as string) || null;

  let participants: SessionParticipant[] = [];
  try {
    const raw = form.get("participants");
    participants = raw ? JSON.parse(raw as string) : [];
  } catch {
    return { ok: false, error: "Invalid participants." };
  }

  const parsed = sessionSchema.safeParse({
    title: form.get("title"),
    description: form.get("description"),
    startsAt: form.get("startsAt"),
    endsAt: form.get("endsAt") || null,
    location: form.get("location"),
    track: form.get("track") ?? "",
    activation: form.get("activation") ?? "",
    participants,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  const payload = {
    title: data.title,
    description: data.description,
    startsAt: data.startsAt,
    endsAt: data.endsAt ?? null,
    location: data.location,
    track: data.track ?? null,
    activation: data.activation ?? null,
    participants: data.participants,
  };

  const ref = id
    ? adminDb.collection(COLLECTIONS.sessions).doc(id)
    : adminDb.collection(COLLECTIONS.sessions).doc();

  if (id) {
    await ref.update(payload);
  } else {
    await ref.set({ ...payload, createdAt: FieldValue.serverTimestamp() });
  }

  revalidate("sessions");
  return okResult(ref.id);
}

export async function deleteSession(id: string): Promise<SaveResult> {
  await requireAdmin();
  await adminDb.collection(COLLECTIONS.sessions).doc(id).delete();
  revalidate("sessions");
  return okResult(id);
}
