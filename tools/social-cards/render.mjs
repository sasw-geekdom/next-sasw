/**
 * Renders the speaker cards in cards.mjs to PNGs.
 *
 * 1080x1350 unless a card or its event says otherwise. The second size is
 * 1200x630, for Meetup and anywhere else that wants the OG ratio — see
 * `size` in cards.mjs.
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
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
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
  await stage(work, join(REPO, "public/brand/sastw-bolt.svg"), "bolt.svg");
  // The homepage's bolt, not the silhouette above it. `sastw-bolt.svg` is a
  // flat #ff32a0 shape the cards use as a ground at 0.17; this is the still of
  // the live WebGL hero that lib/og.tsx puts on every share card, so a card
  // drawing the bolt as a subject rather than a ground draws the same one the
  // site does.
  await stage(
    work,
    join(REPO, "public/brand/bolt-current-og.png"),
    "bolt-current.png",
  );
  await stage(
    work,
    join(REPO, "public/access-granted/orgs/devsa.png"),
    "devsa.png",
  );

  const browser = await chromium.launch();
  /**
   * One page per device pixel ratio.
   *
   * `deviceScaleFactor` is fixed when a page is created — `setViewportSize`
   * cannot change it — so a card that wants 2x needs a page of its own. Kept
   * in a map rather than made per card, because a browser page is expensive
   * and the set only ever holds one or two.
   *
   * 1 is the default and stays the default: every approved card was rendered
   * at it, and the check that a refactor changed nothing is that they still
   * reproduce byte for byte.
   */
  const pages = new Map();
  const pageAt = async (scale, size) => {
    let entry = pages.get(scale);
    if (!entry) {
      entry = {
        page: await browser.newPage({
          viewport: size,
          deviceScaleFactor: scale,
        }),
        viewport: size,
      };
      pages.set(scale, entry);
      return entry.page;
    }
    if (
      size.width !== entry.viewport.width ||
      size.height !== entry.viewport.height
    ) {
      await entry.page.setViewportSize(size);
      entry.viewport = size;
    }
    return entry.page;
  };

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
      // `white` knocks a mark back to a white silhouette — see OrganizerLogo,
      // which does the same thing with the same two filters so a mark drawn
      // white on the site is drawn white here too.
      const tone = l.white ? ";filter:brightness(0) invert(1)" : "";
      logos.push(
        `<img src="${as}" style="height:${l.height}px${tone}" alt="" />`,
      );
    }

    // The group's own mark, where the event has one.
    let mark = "";
    if (event.mark) {
      const src = join(REPO, event.mark.repo);
      mark = `mark${extname(src)}`;
      await stage(work, src, mark);
    }

    // Headshots, always by slug. A card need not have one: College Night is
    // a room rather than a person, so it names no speaker and resolves none.
    const slugs = card.speakers ?? (card.speaker ? [card.speaker] : []);
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

    /**
     * The marks in a field: every activation and every partner behind them.
     *
     * `repo` for one vendored here, `url` for one that is not — Alamo Python
     * and PyTexas live on DEVSA's own S3 and are read by lib/pysa.ts from
     * there, so the card reads them from there too rather than committing a
     * second copy that can go stale against the site. `html` for the three
     * activations that own no logo at all.
     *
     * No height per mark. The grid gives every cell the same box and each
     * mark takes what it can of it, which is what "equal size" has to mean
     * across ratios running 1:1 to 10:1 — matched on height a wordmark draws
     * five times a badge's width, and matched on width a badge draws five
     * times a wordmark's height.
     */
    const markFiles = [];
    for (const [i, m] of (card.marks ?? []).entries()) {
      if (m.html) {
        markFiles.push({ mark: m, file: null });
        continue;
      }
      let src;
      if (m.repo) src = join(REPO, m.repo);
      else if (m.partner) {
        const url = byPartner.get(m.partner.toLowerCase());
        if (!url) throw new Error(`${card.id}: no partner "${m.partner}"`);
        src = await fetchCached(url);
      } else src = await fetchCached(m.url);
      const as = `mark-${i}${extname(src) || ".png"}`;
      await stage(work, src, as);
      markFiles.push({ mark: m, file: as });
    }
    const cells = markFiles.map(({ mark, file }) => {
      if (!file) return `<li class="cell">${mark.html}</li>`;
      // Two per-mark overrides, and both are properties of a *file* rather
      // than of the design — which is why they live on the mark and not in
      // the template.
      //
      // `scale` is the answer to a logo drawn small inside its own canvas:
      // Alamo City Locksport is a thin line drawing with wide transparent
      // margin, so at the same box as its neighbours it reads as half their
      // size. `shift` is the answer to ink that is not centred in its canvas
      // — the AWS mark hangs its smile below the letters, so a box centred on
      // the file sits "aws" above the wordmarks either side of it.
      const style = [
        mark.scale && `max-width:${100 * mark.scale}%`,
        mark.scale && `max-height:${100 * mark.scale}%`,
        mark.shift && `transform:translateY(${mark.shift}px)`,
      ]
        .filter(Boolean)
        .join(";");
      return `<li class="cell"><img src="${file}"${style ? ` style="${style}"` : ""} alt="" /></li>`;
    });

    /**
     * The event's own artwork, where a card names no speaker.
     *
     * These templates were drawn around a figure — the portrait column is
     * half the composition — so an event card with the slot empty is a hole
     * rather than a simpler card. Access Granted has its padlock, The Model
     * its key art and PySanAntonio its mascot, all already in the repo and
     * all portrait-ish, so the slot takes the event's art instead of a
     * person's. Staged as `face` so the templates need no second code path:
     * as far as the layout is concerned it is the same picture in the same
     * place, sized by the same two numbers.
     */
    if (card.art && people.length === 0) {
      const src = join(REPO, card.art);
      const as = `face-art${extname(src) || ".png"}`;
      await stage(work, src, as);
      people.push({ file: as, name: "", title: "", company: "" });
    }

    const facts = card.facts ?? event.facts;

    const [a, b] = people;
    const html = await readFile(
      // A card may override its event's template. The wide Meetup cards are
      // the same event's data in a different shape, so they share everything
      // except the layout.
      join(HERE, "templates", card.template ?? event.template),
      "utf8",
    );

    const data = {
      week: WEEK,
      eyebrow: card.eyebrow ?? "",
      headline: card.headline,
      headlineSize: card.headlineSize ?? 88,
      subtitle: card.subtitle ?? "",
      circuit: card.circuit ?? "",
      // A card may carry its own facts. TPR needs it: every other event runs
      // on one day at one hour, so the day is the event's, but TPR's speakers
      // sit on different days and its times are not set yet.
      fact1: facts[0],
      fact2: facts[1] ?? "",
      fact3: facts[2] ?? "",
      // Give-a-LOT's transform table, built here so the card draws the same
      // four pairs the band does rather than a copy that can drift — see
      // GIVE_A_LOT_STATES in lib/give-a-lot.ts.
      //
      // Bare spans, not rows: the template lays the whole table out as one
      // grid so the column heads and the pairs share column widths. Wrapping
      // each pair in its own element gave every row its own grid, and `auto`
      // columns sized per-row — the arrows stopped lining up.
      states: (event.states ?? [])
        .map(
          ([before, after]) =>
            `<span class="b">${before}</span><span class="x">&#10230;</span><span class="a">${after}</span>`,
        )
        .join("\n        "),
      // A bill: several talks in one card, built here the way `states` is,
      // because the template engine substitutes and branches but does not
      // loop. Each entry is a title, an optional second line and an optional
      // speaker — the same three the speaker cards carry, at the size two of
      // them share a frame.
      // The circuit's nodes, staged and built here for the same reason
      // `talks` and `states` are: the engine substitutes and branches, it
      // does not loop. A node is either a file — most of the community
      // marks — or a scrap of type, which is what the three house-branded
      // activations are: The Model, Access Granted and College Night own no
      // logo, their mark *is* the display face in their own accent, and
      // rebuilding those here would be a fourth copy of a treatment
      // components/site/calendar/marks.tsx already owns.
      // Split where the card says to, so a template can label each group.
      // One undifferentiated field of twenty-two marks says less than three
      // labelled bands — and on the DEVSA card the labels are the argument:
      // what it built, what it invited, and who stands behind both.
      // How many across, and how tall a cell, where a template lets the card
      // decide. A slide carrying six marks and a poster carrying twenty-three
      // want different grids out of the same layout.
      // Whether the card is drawn for compositing rather than for viewing.
      // A motion card's PNG is an overlay: no ground, so the footage shows
      // through wherever the design does not paint.
      transparent: card.video ? "1" : "",
      // Whether the card's art is a block rather than a cutout — an opaque
      // ground the bloom has to be carried over. See `pysanantonio-event`.
      artBlock: card.artBlock ? "1" : "",
      // Where the footage's top edge lands, so the overlay can feather it.
      videoTop: card.video ? card.video.y : 0,
      cols: card.cols ?? 4,
      cellH: card.cellH ?? 66,
      marksA: cells
        .slice(0, card.splits?.[0] ?? cells.length)
        .join("\n            "),
      marksB: cells
        .slice(
          card.splits?.[0] ?? cells.length,
          card.splits?.[1] ?? cells.length,
        )
        .join("\n            "),
      marksC: cells
        .slice(card.splits?.[1] ?? cells.length)
        .join("\n            "),
      talks: (card.talks ?? [])
        .map(
          (t) =>
            `<div class="talk"><span class="t">${t.title}</span>` +
            (t.subtitle ? `<span class="s">${t.subtitle}</span>` : "") +
            (t.who ? `<span class="w">${t.who}</span>` : "") +
            `</div>`,
        )
        .join("\n        "),
      logos: logos.join("\n          "),
      mark,
      // A card may resize the mark. The wide card has to: the portrait card
      // sets these against a wordmark slot, and beside the SASTW lockup the
      // same height reads as the group being the senior partner.
      markHeight: card.markHeight ?? event.mark?.height ?? 0,
      // The house lockup's height, where a template sizes it per card.
      // Defaults to the group's, which is what "the same size" means on the
      // bill cards — but it cannot be forced there, because the marks are not
      // the same shape: matched at a height, a 10:1 wordmark draws twice the
      // lockup's width and the co-brand stops reading as a pair.
      lockupHeight: card.lockupHeight ?? card.markHeight ?? 0,
      // Vertical nudge on the group's mark, where its letterforms do not sit
      // on its file's centre. See `markShift` on the AWS meetup card.
      markShift: card.markShift ?? 0,

      // Per card, not per template: TPR greyscales every portrait because its
      // bolt runs at full charge, but a community card is a colour card and
      // this is one speaker's choice inside it.
      greyscale: card.greyscale ? "1" : "",
      // A pull quote, where a card leads on a line rather than on a person.
      quote: card.quote ?? "",
      // The line under the title, where the page runs one — College Night's
      // `detail.headline`, which is the deck on its hero.
      deck: card.deck ?? "",
      // The small print. Data rather than template text so it sits beside the
      // rest of the card's copy and can be diffed against the page's.
      access: card.access ?? "",

      // Everything below is absent on a card with no speaker.
      face: a?.file ?? "",
      // Split after the first word unless the card says otherwise. That is
      // right for two- and three-word names and wrong for four: "Daniel" over
      // "Felipe Morales Yusty" runs the second line into the portrait.
      first: card.name?.[0] ?? a?.name.split(" ")[0] ?? "",
      last: card.name?.[1] ?? a?.name.split(" ").slice(1).join(" ") ?? "",
      // A card may override what the CMS says — see mason-egger.
      role: card.role ?? a?.role ?? "",
      org: card.org ?? a?.org ?? "",
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

    // The size travels with the card, and the filename says which it is —
    // the same speaker now has a portrait card and a wide one, and a name
    // that does not distinguish them is a paste-the-wrong-file waiting to
    // happen.
    const size = card.size ?? event.size ?? SIZE;
    /**
     * How many device pixels a CSS pixel draws.
     *
     * 1 everywhere the card is going straight into an unfurl at its own
     * dimensions, which is what these were all built for. A card a group is
     * going to post, resize and re-crop is a different thing: 1200x630 is the
     * platform's minimum rather than a target, and 17px mono at 1x has about
     * eleven pixels of x-height to draw a letter in. At 2 the type is drawn
     * from twice the information and every downscale after that resamples
     * from it instead of from the eleven.
     *
     * The layout is unchanged — the CSS box is still `size`. Only the sample
     * rate moves, and the filename reports what the file actually holds.
     */
    const scale = card.scale ?? 1;
    const page = await pageAt(scale, size);

    const missing = [];
    const onFail = (r) => missing.push(r.url().split("/").pop());
    page.on("requestfailed", onFail);
    await page.goto("file://" + file, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    page.off("requestfailed", onFail);

    const out = join(
      outDir,
      `${card.id}-${size.width * scale}x${size.height * scale}.png`,
    );
    // `omitBackground` only reaches transparent where the page actually is:
    // every template paints `body` black, so a motion card's own CSS has to
    // clear it. See the `if:transparent` block in pysanantonio.html.
    await page.screenshot({ path: out, omitBackground: !!card.video });

    /**
     * A motion card: the same design, composited over its event's own footage.
     *
     * PySanAntonio is the one activation with a video asset, and a still cut
     * from it would only repeat `mascot-block.webp`, which its event card
     * already uses — the value in the file is the movement. So the PNG above
     * is rendered without a ground and ffmpeg lays it over the clip.
     *
     * Two overlays, not one. The clip is landscape (1114x720) and the card is
     * portrait, so it is first placed on a canvas at the size and offset the
     * card names — which is how the figure lands in the right half where the
     * still card puts it — and the design goes over that.
     *
     * `-stream_loop` rather than a longer source: the file is a 7-second loop
     * and repeating it is free, where re-encoding a longer cut would not be.
     *
     * The ground above the clip is the clip's own top rows, stretched, and
     * that is the whole of the background story — four attempts' worth,
     * recorded because three of them were wrong.
     *
     * The card's ground was a blue bloom and the clip's is flat, so
     * composited the tint stopped at the clip's top edge and the card went
     * from graded to flat in one line. Crushing the clip's blacks matched
     * the two sides at black — it threw the gradient away rather than
     * continuing it, and darkened the luchador to do it. Growing the bloom
     * over the whole frame continued the gradient and hazed him blue. So the
     * bloom goes (see `if:transparent` in pysanantonio.html) and both sides
     * are flat — except that the clip's ground is not one value: across its
     * top edge it runs #040404 to #0b0b0b, brighter behind the figure and
     * darker at the corners. No flat canvas matches a ground that moves, and
     * the fourth attempt, feathering the clip's top edge into the canvas,
     * turned out to be the worst of them: the clip has no headroom. At the
     * top of the luchador's bob his sombrero reaches within 10px of the
     * frame, so an alpha ramp deep enough to hide the seam faded the crown
     * of his hat for part of the loop.
     *
     * Replicating the edge needs none of that. The clip's own top rows are
     * stretched to fill the space above it, so at the seam the background is
     * the footage's ground by construction — the same value in every column,
     * with nothing done to the picture and nothing to line up by eye. What
     * fills the card above the figure is the footage's own near-black,
     * #040404 to #0b0b0b left to right, and the scrim covers the copy side
     * of it.
     */
    if (card.video) {
      const v = card.video;
      const mp4 = out.replace(/\.png$/, ".mp4");
      const W = size.width * scale;
      const H = size.height * scale;
      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-stream_loop",
        String(v.loops ?? 1),
        "-i",
        join(REPO, v.src),
        "-i",
        out,
        "-filter_complex",
        `[0:v]scale=-2:${v.height * scale},split[clip][edge];` +
          `[edge]crop=iw:4:0:0,scale=iw:${v.y * scale}[fill];` +
          `[fill][clip]vstack[fig];` +
          `color=c=${v.canvas ?? "black"}:s=${W}x${H}[bg];` +
          `[bg][fig]overlay=${v.x * scale}:0[b];` +
          `[b][1:v]overlay=0:0,format=yuv420p[o]`,
        "-map",
        "[o]",
        "-t",
        String(v.seconds ?? 14),
        "-r",
        "24",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-movflags",
        "+faststart",
        mp4,
      ]);
      console.log(`${card.id}  -> ${mp4.split("/").pop()}`);
    }
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
