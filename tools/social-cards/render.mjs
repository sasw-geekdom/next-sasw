/**
 * Renders the speaker cards in cards.mjs to 1080x1350 PNGs.
 *
 *   node --env-file=.env.local tools/social-cards/render.mjs            # all
 *   node --env-file=.env.local tools/social-cards/render.mjs <id> [id…] # some
 *   node --env-file=.env.local tools/social-cards/render.mjs --out ~/Downloads
 *
 * `--env-file` is not optional: headshots are resolved from Firestore by
 * speaker slug rather than pinned as URLs, because a replaced photo gets a new
 * blob URL and a pinned one keeps rendering the old picture. That has happened
 * twice.
 *
 * Playwright is deliberately not a dependency of this repo — it is a 300MB
 * browser download in service of a tool nobody runs during a build. Install it
 * when you need it:
 *
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 */

import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { CARDS, EVENTS, WEEK } from "./cards.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const CACHE = join(HERE, ".cache");

const SIZE = { width: 1080, height: 1350 };

// ─── CMS ────────────────────────────────────────────────────────────────────

async function loadSpeakers() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is missing. Run with:\n" +
        "  node --env-file=.env.local tools/social-cards/render.mjs",
    );
  }
  const json = key.trim().startsWith("{")
    ? key
    : Buffer.from(key, "base64").toString("utf8");

  const { cert, initializeApp, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(json)) });

  const db = getFirestore();
  const [speakers, partners] = await Promise.all([
    db.collection("speakers").get(),
    db.collection("partners").get(),
  ]);

  const bySlug = new Map();
  for (const d of speakers.docs) {
    // `slug` is stored once an admin has saved the speaker; derived from the
    // name before that. See lib/admin/cms-queries.
    const slug =
      d.get("slug") ||
      (d.get("name") || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    bySlug.set(slug, {
      name: d.get("name") || "",
      role: d.get("title") || "",
      org: d.get("company") || "",
      imageUrl: d.get("imageUrl") || "",
    });
  }

  const byPartner = new Map();
  for (const d of partners.docs)
    byPartner.set((d.get("name") || "").toLowerCase(), d.get("imageUrl") || "");

  return { bySlug, byPartner };
}

// ─── assets ─────────────────────────────────────────────────────────────────

/** Remote files land in a gitignored cache so a re-render costs no network. */
async function fetchCached(url) {
  await mkdir(CACHE, { recursive: true });
  const ext = extname(new URL(url).pathname) || ".png";
  const file = join(
    CACHE,
    createHash("sha1").update(url).digest("hex").slice(0, 16) + ext,
  );
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

/** Everything the page loads is copied flat into the working dir. */
async function stage(dir, src, as) {
  const dest = join(dir, as);
  await copyFile(src, dest);
  return as;
}

// ─── templating ─────────────────────────────────────────────────────────────

/**
 * `{{key}}` substitutes; `<!--if:key-->…<!--/if:key-->` includes when truthy
 * and `<!--ifnot:key-->…<!--/ifnot:key-->` when falsy. Values are inserted raw
 * — headlines carry `<br />` and `<code>` on purpose.
 */
function fill(html, data) {
  let out = html;
  for (const [k, v] of Object.entries(data)) {
    const yes = new RegExp(`<!--if:${k}-->([\\s\\S]*?)<!--/if:${k}-->`, "g");
    const no = new RegExp(
      `<!--ifnot:${k}-->([\\s\\S]*?)<!--/ifnot:${k}-->`,
      "g",
    );
    out = out.replace(yes, v ? "$1" : "").replace(no, v ? "" : "$1");
  }
  return out.replace(/\{\{(\w+)\}\}/g, (_, k) => String(data[k] ?? ""));
}

// ─── render ─────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf("--out");
  const outDir =
    outIdx === -1
      ? join(HERE, "out")
      : argv[outIdx + 1].replace(/^~/, process.env.HOME);
  const ids = argv.filter((a, i) => !a.startsWith("--") && i !== outIdx + 1);

  const wanted = ids.length ? CARDS.filter((c) => ids.includes(c.id)) : CARDS;
  if (!wanted.length) {
    console.error(
      `No card matched. Known ids:\n  ${CARDS.map((c) => c.id).join("\n  ")}`,
    );
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "playwright is not installed. It is not a dependency of this repo:\n" +
        "  pnpm add -D playwright && pnpm exec playwright install chromium",
    );
    process.exit(1);
  }

  const { bySlug, byPartner } = await loadSpeakers();
  await mkdir(outDir, { recursive: true });

  const work = join(HERE, ".work");
  await rm(work, { recursive: true, force: true });
  await mkdir(work, { recursive: true });

  // Fonts and the week lockup are the same on every card.
  await stage(
    work,
    join(REPO, "public/brand/oswald-700-latin.woff"),
    "oswald.woff",
  );
  await stage(
    work,
    join(REPO, "public/brand/sastw-horizontal-white.png"),
    "sastw.png",
  );
  await stage(work, join(REPO, "public/pysa/wordmark-dark.svg"), "pysa.svg");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });

  for (const card of wanted) {
    const event = EVENTS[card.event];
    if (!event) throw new Error(`${card.id}: unknown event ${card.event}`);

    // Logos, resolved from wherever each one lives.
    const logos = [];
    for (const [i, l] of event.logos.entries()) {
      let src;
      if (l.repo) src = join(REPO, l.repo);
      else if (l.url) src = await fetchCached(l.url);
      else if (l.partner) {
        const url = byPartner.get(l.partner.toLowerCase());
        if (!url) throw new Error(`${card.id}: no partner "${l.partner}"`);
        src = await fetchCached(url);
      }
      const as = `logo-${i}${extname(src) || ".png"}`;
      await stage(work, src, as);
      logos.push(`<img src="${as}" style="height:${l.height}px" alt="" />`);
    }

    // Headshots, always by slug.
    const slugs = card.speakers ?? [card.speaker];
    const people = [];
    for (const [i, slug] of slugs.entries()) {
      const s = bySlug.get(slug);
      if (!s) throw new Error(`${card.id}: no speaker "${slug}" in the CMS`);
      if (!s.imageUrl) throw new Error(`${card.id}: ${slug} has no headshot`);
      const src = await fetchCached(s.imageUrl);
      const as = `face-${i}${extname(src) || ".png"}`;
      await stage(work, src, as);
      people.push({ ...s, file: as });
    }

    const [a, b] = people;
    const html = await readFile(
      join(HERE, "templates", event.template),
      "utf8",
    );

    const data = {
      week: WEEK,
      headline: card.headline,
      headlineSize: card.headlineSize ?? 88,
      subtitle: card.subtitle ?? "",
      fact1: event.facts[0],
      fact2: event.facts[1],
      logos: logos.join("\n          "),

      face: a.file,
      first: a.name.split(" ")[0],
      last: a.name.split(" ").slice(1).join(" "),
      // A card may override what the CMS says — see mason-egger.
      role: card.role ?? a.role,
      org: card.org ?? a.org,
      portraitHeight: card.portrait?.height,
      portraitLeft: card.portrait?.left,

      ...(b
        ? {
            faceA: a.file,
            firstA: a.name.split(" ")[0],
            lastA: a.name.split(" ").slice(1).join(" "),
            roleA: a.role,
            orgA: a.org,
            heightA: card.portraits[0].height,
            topA: card.portraits[0].top,
            faceB: b.file,
            firstB: b.name.split(" ")[0],
            lastB: b.name.split(" ").slice(1).join(" "),
            roleB: b.role,
            orgB: b.org,
            heightB: card.portraits[1].height,
            topB: card.portraits[1].top,
          }
        : {}),
    };

    const file = join(work, `${card.id}.html`);
    await writeFile(file, fill(html, data));

    const missing = [];
    const onFail = (r) => missing.push(r.url().split("/").pop());
    page.on("requestfailed", onFail);
    await page.goto("file://" + file, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    page.off("requestfailed", onFail);

    const out = join(outDir, `${card.id}-1080x1350.png`);
    await page.screenshot({ path: out });
    console.log(
      `${card.id}${missing.length ? `  !! failed: ${missing.join(", ")}` : ""}`,
    );
  }

  await browser.close();
  await rm(work, { recursive: true, force: true });
  console.log(`\n${wanted.length} card(s) -> ${outDir}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
