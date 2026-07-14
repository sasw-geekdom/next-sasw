import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { COLLECTIONS, GALLERY_SETTINGS_DOC } from "@/lib/firebase/collections";
import { getGalleryManifest, type GalleryManifestItem } from "@/lib/gallery";

// Source originals (behind deny-all; read via the Admin SDK) → resized WebP
// thumbnails on public Vercel Blob. Content-addressed by the original's MD5 so
// re-runs skip unchanged photos and the URLs stay stable (CDN-cacheable).
const PREFIX = "15-years/";
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i;
const THUMB_WIDTH = 900; // display max on the masonry wall
const THUMB_QUALITY = 72;
const BLUR_WIDTH = 16;
const BLOB_PREFIX = "gallery/15-years";
// Cap per run so a big first batch can't blow the request timeout — the admin
// re-runs until `remaining` hits 0. Unchanged photos don't count toward this.
const MAX_PER_RUN = 40;
const CONCURRENCY = 4;

export interface SyncResult {
  total: number; // originals in the folder
  generated: number; // thumbnails (re)built this run
  skipped: number; // unchanged, reused
  removed: number; // manifest entries whose original is gone
  remaining: number; // still needing a thumbnail after this run
}

/** Build a WebP thumbnail + blur placeholder, upload to Blob. `name` is filled by the caller. */
async function buildThumb(
  buf: Buffer,
  md5: string,
): Promise<Omit<GalleryManifestItem, "name">> {
  const thumb = await sharp(buf, { failOn: "none" })
    .rotate() // honor EXIF orientation
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer({ resolveWithObject: true });

  const blurBuf = await sharp(buf, { failOn: "none" })
    .rotate()
    .resize({ width: BLUR_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  // Stable, content-addressed key → same photo overwrites, URL never churns.
  const { url } = await put(`${BLOB_PREFIX}/${md5}.webp`, thumb.data, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return {
    url,
    width: thumb.info.width,
    height: thumb.info.height,
    blurDataURL,
    md5,
  };
}

/** Map over items with bounded concurrency. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function syncGalleryThumbnails(): Promise<SyncResult> {
  const [files] = await adminStorage.bucket().getFiles({ prefix: PREFIX });
  const originals = files.filter(
    (f) => f.name.length > PREFIX.length && IMAGE_EXT.test(f.name),
  );

  const manifest = await getGalleryManifest();
  const byName = new Map(manifest.map((m) => [m.name, m]));
  const liveNames = new Set(originals.map((f) => f.name.slice(PREFIX.length)));

  // Prune entries whose original was deleted; best-effort remove their Blob.
  const removedItems = manifest.filter((m) => !liveNames.has(m.name));
  await Promise.all(
    removedItems.map((m) => del(m.url).catch(() => {})),
  );

  // Which originals still need a (re)build? Compare MD5 from Storage metadata.
  const pending: { name: string; md5: string; file: (typeof originals)[number] }[] = [];
  for (const file of originals) {
    const name = file.name.slice(PREFIX.length);
    const md5 = (file.metadata?.md5Hash as string | undefined) ?? "";
    const existing = byName.get(name);
    if (existing && existing.md5 === md5 && existing.url) continue;
    pending.push({ name, md5, file });
  }

  const batch = pending.slice(0, MAX_PER_RUN);
  const built = (
    await mapLimit(batch, CONCURRENCY, async ({ name, md5, file }) => {
      try {
        const [buf] = await file.download();
        const md5Key = md5 || createHash("md5").update(buf).digest("hex");
        const item = await buildThumb(buf, md5Key);
        return { ...item, name };
      } catch (err) {
        // One unreadable file (e.g. a corrupt HEIC) shouldn't kill the run;
        // it's simply retried next sync since it never lands in the manifest.
        console.error(`Thumbnail failed for ${name}:`, err);
        return null;
      }
    })
  ).filter((b): b is GalleryManifestItem => b !== null);

  // Merge: keep unchanged live entries + freshly built ones; drop removed.
  const builtByName = new Map(built.map((b) => [b.name, b]));
  const next: GalleryManifestItem[] = [];
  for (const name of liveNames) {
    next.push(builtByName.get(name) ?? byName.get(name)!);
  }
  const items = next.filter(Boolean);

  await adminDb
    .collection(COLLECTIONS.settings)
    .doc(GALLERY_SETTINGS_DOC)
    .set(
      { items, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  return {
    total: originals.length,
    generated: built.length,
    skipped: originals.length - pending.length,
    removed: removedItems.length,
    remaining: Math.max(0, pending.length - batch.length),
  };
}
