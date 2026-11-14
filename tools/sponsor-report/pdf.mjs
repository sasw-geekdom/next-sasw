/**
 * Saves the 2026 sponsor report as a PDF.
 *
 * Renders /sponsor-report/print — the report laid out as US Letter pages —
 * with headless Chrome, and writes public/SASTW-2026-Sponsor-Report.pdf, the
 * file the report's "Save as PDF" button hands out. One designed document,
 * the same for every sponsor, where printing the web page gave each browser
 * its own page breaks and margins.
 *
 * Needs the app running (`pnpm dev`):
 *
 *   pnpm report:pdf                              # against localhost:3000
 *   pnpm report:pdf --url http://localhost:3002  # another port
 *
 * Re-run it when the report changes. The sponsor and partner marks come live
 * from the CMS, so the PDF holds them as they were when it was saved — a
 * replaced logo needs a re-run to reach the file.
 *
 * Playwright is not a dependency of this repo, for the reason
 * tools/social-cards gives: a 300MB browser download in service of a tool
 * nobody runs during a build. Install it when you need it:
 *
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 *
 * or point PLAYWRIGHT_MODULE at an install elsewhere (its index.mjs).
 */

import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "public", "SASTW-2026-Sponsor-Report.pdf");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};
const base = (arg("--url") ?? "http://localhost:3000").replace(/\/$/, "");

let chromium;
try {
  const from = process.env.PLAYWRIGHT_MODULE;
  ({ chromium } = await import(from ? pathToFileURL(from).href : "playwright"));
} catch {
  console.error(
    "playwright is not installed. It is not a dependency of this repo:\n" +
      "  pnpm add -D playwright && pnpm exec playwright install chromium",
  );
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const url = `${base}/sponsor-report/print`;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  if (!res?.ok()) throw new Error(`${url} answered ${res?.status()} — is the app running?`);

  // Every photo and mark drawn, and the type loaded, before anything is
  // captured: a PDF saved a beat early has grey holes where pictures go.
  // `complete` is true for a finished image whether it loaded or failed, and
  // a failed one never fires again — waiting on it would wait forever, so it
  // counts as done here and is caught by the broken-image check below.
  await page.evaluate(async () => {
    await document.fonts.ready;
    const settle = Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((done) => {
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            }),
      ),
    );
    await Promise.race([settle, new Promise((done) => setTimeout(done, 60_000))]);
  });
  const broken = await page.evaluate(() =>
    [...document.images].filter((img) => !img.naturalWidth).map((img) => img.currentSrc || img.src),
  );
  if (broken.length) throw new Error(`images failed to load:\n  ${broken.join("\n  ")}`);

  await page.emulateMedia({ media: "print" });
  await mkdir(dirname(OUT), { recursive: true });
  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });

  const { size } = await stat(OUT);
  console.log(`saved ${OUT} (${(size / 1024 / 1024).toFixed(1)} MB)`);
} finally {
  await browser.close();
}
