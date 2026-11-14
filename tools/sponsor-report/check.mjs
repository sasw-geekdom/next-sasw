/**
 * Says whether the sponsor report PDF is out of date with the report.
 *
 *   pnpm report:check            # warn, exit 0
 *   pnpm report:check --strict   # exit 1 when stale
 *
 * Runs ahead of `pnpm build`, warn-only: a deploy should never fail because a
 * PDF needs re-saving, but it should say so where someone will see it. See
 * source.mjs for what's covered (and the one thing that isn't: CMS logos).
 */

import { readFile } from "node:fs/promises";
import { RECORD, sourceHash } from "./source.mjs";

const strict = process.argv.includes("--strict");

try {
  const now = await sourceHash();
  let saved;
  try {
    saved = JSON.parse(await readFile(RECORD, "utf8"));
  } catch {
    saved = null;
  }
  if (saved?.hash === now.hash) {
    console.log(`sponsor report PDF: up to date (saved ${saved.savedAt})`);
  } else {
    const bar = "─".repeat(64);
    console.warn(
      `\n${bar}\n  The sponsor report PDF is out of date with the report.\n` +
        `  Its words, layout, photos or marks changed since it was saved` +
        (saved ? ` (${saved.savedAt}).` : ".") +
        `\n  Re-save it with the dev server running:  pnpm report:pdf\n${bar}\n`,
    );
    if (strict) process.exit(1);
  }
} catch (err) {
  // A check that can't run must not stop a build.
  console.warn(`sponsor report PDF check skipped: ${err?.message ?? err}`);
}
