import "server-only";

import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export class ImageError extends Error {}

/** Upload an image to Vercel Blob under `prefix/`. Returns the public URL. */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new ImageError("Image must be JPEG, PNG, WebP, or SVG.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageError("Image must be under 5 MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const blob = await put(`${prefix}/${randomUUID()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

/** Delete a Blob object by URL. Best-effort — never throws. */
export async function deleteImage(url: string | undefined | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("Blob delete failed:", err);
  }
}
