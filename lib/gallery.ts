import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, GALLERY_SETTINGS_DOC } from "@/lib/firebase/collections";

// The public gallery reads a manifest of pre-generated thumbnails (see
// lib/gallery-sync.ts). Each entry is a small, CDN-hosted WebP on Vercel Blob
// with known dimensions and a blur placeholder — so next/image renders them
// fast, without layout shift, and with a blur-up while loading.
export interface GalleryImage {
  name: string;
  url: string;
  width: number;
  height: number;
  blurDataURL: string;
}

/** One thumbnail record as stored in the Firestore manifest. */
export interface GalleryManifestItem extends GalleryImage {
  /** MD5 of the source original — lets a re-sync skip unchanged photos. */
  md5: string;
}

const manifestDoc = () =>
  adminDb.collection(COLLECTIONS.settings).doc(GALLERY_SETTINGS_DOC);

// Deterministic pseudo-random key (FNV-1a) so the wall looks shuffled but
// stays in a consistent order across reloads — no matter how photos are named.
function shuffleKey(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function getGalleryManifest(): Promise<GalleryManifestItem[]> {
  try {
    const snap = await manifestDoc().get();
    const items = snap.exists ? snap.get("items") : null;
    return Array.isArray(items) ? (items as GalleryManifestItem[]) : [];
  } catch (err) {
    console.error("Gallery manifest read failed:", err);
    return [];
  }
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const items = await getGalleryManifest();
  return items
    .map(({ name, url, width, height, blurDataURL }) => ({
      name,
      url,
      width,
      height,
      blurDataURL,
    }))
    .sort((a, b) => shuffleKey(a.name) - shuffleKey(b.name));
}
