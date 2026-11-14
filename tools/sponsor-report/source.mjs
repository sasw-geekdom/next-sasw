/**
 * The fingerprint of everything the sponsor report PDF is built from.
 *
 * pdf.mjs records it beside the PDF when it saves one; check.mjs recomputes
 * it and says when the two differ — that is, when the report's words,
 * layout, photos or marks have changed since the PDF was saved, so the file
 * the "Save as PDF" button hands out no longer matches the page.
 *
 * What it can't see: the sponsor and partner marks that come live from the
 * CMS. A replaced logo still needs a re-run of `pnpm report:pdf`.
 */

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RECORD = join(REPO, "tools", "sponsor-report", "pdf-source.json");

const FILES = [
  "lib/sponsor-report.ts",
  "lib/recap.ts",
  "lib/sponsor-marks.ts",
  "lib/circuit-sponsors.ts",
  "app/(print)/sponsor-report/print/page.tsx",
];
const DIRS = ["public/sponsor-report", "public/home/recap", "public/brand"];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(join(REPO, dir), { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** sha256 over the inputs' paths and bytes, in a stable order. */
export async function sourceHash() {
  const files = [...FILES, ...(await Promise.all(DIRS.map(walk))).flat()].sort();
  const h = createHash("sha256");
  for (const f of files) {
    h.update(relative(REPO, join(REPO, f)));
    h.update("\0");
    h.update(await readFile(join(REPO, f)));
    h.update("\0");
  }
  return { hash: h.digest("hex"), files: files.length };
}
