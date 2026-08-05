// Client-safe image upload rules. Shared by the server (Blob upload, the
// public headshot route) and the admin forms, so the browser can reject a
// file before it's sent instead of after.
//
// Why 4 MB and not 5: Vercel caps a function's request body at **4.5 MB**
// (413 FUNCTION_PAYLOAD_TOO_LARGE) and that's a platform limit, not a setting
// — no config raises it. `serverActions.bodySizeLimit` in next.config.ts is
// set to 4mb to match, leaving room for the boundary/header bytes multipart
// adds on top of the file itself. Anything above this has to bypass the
// function entirely via a client-side upload straight to Blob.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

/** Types accepted for a person's photo — no SVG, it's a raster headshot. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_IMAGE_LABEL = "4 MB";

/**
 * Validation message for a picked file, or null if it's fine. Runs in the
 * browser before submit and on the server before upload — same rule, so the
 * two can't drift.
 */
export function imageFileError(
  file: File,
  types: string[] = IMAGE_TYPES,
): string | null {
  if (!types.includes(file.type)) {
    const names = types
      .map((t) => t.replace("image/", "").replace("svg+xml", "SVG"))
      .join(", ")
      .toUpperCase();
    return `Image must be ${names}.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `Image must be under ${MAX_IMAGE_LABEL} — this one is ${mb} MB.`;
  }
  return null;
}
