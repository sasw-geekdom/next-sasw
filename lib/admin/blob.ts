import "server-only";

import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { imageFileError } from "@/lib/images";

export class ImageError extends Error {}

/** Upload an image to Vercel Blob under `prefix/`. Returns the public URL. */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  // The admin form checks this too, so a rejection is usually an inline
  // message rather than a round trip — but the action is directly callable,
  // so it can't be the only gate.
  const problem = imageFileError(file);
  if (problem) throw new ImageError(problem);
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const blob = await put(`${prefix}/${randomUUID()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

/** Delete a Blob object by URL. Best-effort — never throws. */
export async function deleteImage(
  url: string | undefined | null,
): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("Blob delete failed:", err);
  }
}
