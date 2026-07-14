"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireAdmin } from "@/lib/auth/session";
import { uploadImage, deleteImage, ImageError } from "@/lib/admin/blob";
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
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form.", issues: parsed.error.flatten().fieldErrors };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await nextImageUrl(form, entity);
  } catch (e) {
    return { ok: false, error: e instanceof ImageError ? e.message : "Upload failed." };
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
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  revalidate(entity);
  return okResult(ref.id);
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
    bio: form.get("bio"),
    linkedin: form.get("linkedin"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form.", issues: parsed.error.flatten().fieldErrors };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await nextImageUrl(form, "speakers");
  } catch (e) {
    return { ok: false, error: e instanceof ImageError ? e.message : "Upload failed." };
  }

  const ref = id
    ? adminDb.collection(COLLECTIONS.speakers).doc(id)
    : adminDb.collection(COLLECTIONS.speakers).doc();

  if (id) {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "Not found." };
    if (imageUrl) await deleteImage(snap.get("imageUrl"));
    await ref.update({ ...parsed.data, ...(imageUrl ? { imageUrl } : {}) });
  } else {
    if (!imageUrl) return { ok: false, error: "A headshot is required." };
    await ref.set({
      ...parsed.data,
      imageUrl,
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
    participants,
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form.", issues: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const payload = {
    title: data.title,
    description: data.description,
    startsAt: data.startsAt,
    endsAt: data.endsAt ?? null,
    location: data.location,
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
