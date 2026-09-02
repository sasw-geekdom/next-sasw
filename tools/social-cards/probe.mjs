/**
 * Suggests `portrait.height` and the offset for a speaker's headshot.
 *
 *   node --env-file=.env.local tools/social-cards/probe.mjs <slug> [slug…]
 *
 * Two slugs are read as a pair for the two-up template: the first is the
 * reference and the second is solved against it, so both heads draw the same
 * size with their crowns level.
 *
 * ─── Read the height with suspicion ────────────────────────────────────────
 *
 * The crown comes off the alpha channel and is exact. The chin does not: it is
 * found by watching the silhouette widen into the shoulders, and hair covering
 * the neck delays that — so a subject with long hair measures a longer head
 * than they draw.
 *
 * Which way the suggestion errs depends on whose neck is hidden. Against a
 * long-haired reference it oversizes the other by ~15%; as the reference, it
 * undersizes itself by about the same. Take the offset, which is exact. Check
 * the height by eye against the card it will sit beside.
 */

async function speakers() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("Run with --env-file=.env.local");
  const json = key.trim().startsWith("{")
    ? key
    : Buffer.from(key, "base64").toString("utf8");
  const { cert, initializeApp, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(json)) });
  const snap = await getFirestore().collection("speakers").get();
  const out = new Map();
  for (const d of snap.docs) out.set(d.get("slug"), d.get("imageUrl"));
  return out;
}

/** Crown from the alpha channel; chin from where the silhouette widens. */
async function measure(url) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());

  // No image library is a dependency here either, so the PNG is decoded by the
  // one thing this repo already ships that can: a headless browser.
  const { chromium } = await import("playwright");
  const b = await chromium.launch();
  const p = await b.newPage();
  const data = "data:image/png;base64," + buf.toString("base64");
  const r = await p.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const { data: px } = x.getImageData(0, 0, img.width, img.height);
    const widths = [];
    let crown = null;
    for (let y = 0; y < img.height; y++) {
      let n = 0;
      for (let i = 0; i < img.width; i++)
        if (px[(y * img.width + i) * 4 + 3] > 10) n++;
      widths.push(n);
      if (crown === null && n > 0) crown = y;
    }
    const head = widths.slice(crown, crown + 200).sort((a, b) => a - b);
    const typical = head[Math.floor(head.length / 2)];
    let chin = null;
    for (let y = crown; y < img.height; y++)
      if (widths[y] > typical * 1.7) {
        chin = y;
        break;
      }
    return { crown, chin, height: img.height };
  }, data);
  await b.close();
  return r;
}

const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slugs.length) {
  console.error("usage: probe.mjs <speaker-slug> [second-slug]");
  process.exit(1);
}

const urls = await speakers();
const seen = [];
for (const slug of slugs) {
  const url = urls.get(slug);
  if (!url) throw new Error(`no speaker "${slug}"`);
  const m = await measure(url);
  seen.push({ slug, ...m });
  console.log(
    `${slug}: crown ${m.crown}px into ${m.height}, head+neck ${m.chin - m.crown}px (${(((m.chin - m.crown) / m.height) * 100).toFixed(1)}% of frame)`,
  );
}

if (seen.length === 1) {
  const [s] = seen;
  // The single-speaker templates bottom-anchor the image, so height alone
  // places it; 903 suits the head-and-shoulders crops most of the set uses.
  const ratio = (s.chin - s.crown) / s.height;
  console.log(
    `\n  portrait: { height: ${Math.round(284 / ratio)}, left: 439 }   // check the height by eye`,
  );
} else {
  const [a, b] = seen;
  const H = 740; // whatever the first is set to on the card
  const headA = ((a.chin - a.crown) / a.height) * H;
  const crownA = -28 + (a.crown * H) / a.height;
  const h = headA / ((b.chin - b.crown) / b.height);
  console.log(
    `\n  { height: ${H}, top: -28 },  // ${a.slug}, the reference` +
      `\n  { height: ${Math.round(h)}, top: ${Math.round(crownA - (b.crown * h) / b.height)} },  // ${b.slug} — check the height by eye`,
  );
}
