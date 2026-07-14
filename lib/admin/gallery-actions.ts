"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { syncGalleryThumbnails, type SyncResult } from "@/lib/gallery-sync";

export type GallerySyncResult =
  | { ok: true; result: SyncResult }
  | { ok: false; error: string };

/** Rebuild 15-years thumbnails from whatever's in the Storage folder. */
export async function syncGallery(): Promise<GallerySyncResult> {
  await requireAdmin();
  try {
    const result = await syncGalleryThumbnails();
    revalidatePath("/admin/content/gallery");
    revalidatePath("/15-years");
    return { ok: true, result };
  } catch (err) {
    console.error("Gallery sync failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sync failed.",
    };
  }
}
