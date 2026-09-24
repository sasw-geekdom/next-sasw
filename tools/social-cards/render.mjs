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

import {
  readFile,
  readdir,
  writeFile,
  mkdir,
  copyFile,
  rm,
} from "node:fs/promises";
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

/**
 * Circuit colours, copied from lib/tracks.ts.
 *
 * Copied rather than imported: this is a plain .mjs tool and lib/tracks.ts is
 * TypeScript with no build step in front of it — the same reason every other
 * fact about the week is restated in cards.mjs. If a circuit is retuned there,
 * it is retuned here.
 *
 * "Social" is not one of the five. It is what the schedule calls the evening
 * hours that belong to no track — Startup Bash, Open Circuit — and it is white
 * here on purpose: a sixth hue would read as a sixth circuit, and the whole
 * point of those hours is that everyone is meant at them.
 */
const CIRCUIT_COLORS = {
  Founder: "#ff32a0",
  "Tech & Builders": "#4d7cff",
  "AI & Applied Innovation": "#19c8c8",
  "Small Business & Solopreneur": "#b45cff",
  Capital: "#ff6b57",
  Social: "#e8e8e8",
};

/** "13:30" to minutes past midnight. */
function minutesOf(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * A range as the week writes it: one meridiem, on the end that needs it.
 *
 * "12:05 - 12:25 PM", not "12:05 PM - 12:25 PM", and "11:30 AM - 1 PM" when
 * the range crosses noon. Same rule `compactRange` follows in lib/schedule.ts.
 */
/**
 * One room's day, as rows for venue-day.html.
 *
 * `card.venueDay` is `{ venue, day }` — a room slug and an ISO date — and the
 * list is whatever /schedule/day/<day> puts in that room's lane. That comes
 * from day-source.ts, which runs the page's own `dayCalendar`, so the curated
 * blocks in lib/schedule arrive with the CMS talks. Reading the sessions
 * collection alone is what left Cup of Capital off the first TPR card.
 *
 * People come from the CMS rows where there is one, matched on the talk's
 * slug, because the calendar joins them into one string and a moderator needs
 * telling apart. A curated block has no row and uses the calendar's string.
 *
 * `titles` maps a slug to the words the card should use. Otherwise a title over
 * 60 characters with a colon is cut there — the half before it is the half
 * that reads at a glance, and the full title is one tap away. The PySA Short
 * settled the same question the same way. 60 rather than the 44 this started
 * at: under it, a cut threw away the half that says what the talk is —
 * "Glyph", "Behind the Answer" — for a title that would have fitted anyway.
 */
const escapeHtml = (v) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * day-source.ts, bundled once per run.
 *
 * esbuild is not a dependency of this repo, for the reason Playwright is not:
 * it serves a tool nobody runs during a build. Only venue-day cards need it,
 * so it is imported here rather than at the top and every other card renders
 * without it. Bare imports stay external and resolve from the repo's own
 * node_modules — firebase-admin is the app's, pinned where AGENTS.md says it
 * must be — and `server-only` is stubbed, since outside Next it throws on
 * import by design.
 */
let daySourceModule;
async function daySource() {
  if (daySourceModule) return daySourceModule;
  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    throw new Error(
      "venue-day cards need esbuild, which is not a dependency of this repo.\n" +
        "  pnpm add -D esbuild   (and leave it out of the commit)",
    );
  }
  const out = join(CACHE, "day-source.mjs");
  await esbuild.build({
    entryPoints: [join(HERE, "day-source.ts")],
    outfile: out,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    packages: "external",
    tsconfig: join(REPO, "tsconfig.json"),
    logLevel: "error",
    plugins: [
      {
        name: "server-only",
        setup(b) {
          b.onResolve({ filter: /^server-only$/ }, () => ({
            path: "server-only",
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents: "",
          }));
        },
      },
    ],
  });
  daySourceModule = await import(out + "?" + Date.now());
  return daySourceModule;
}

async function venueDay(card, sessions, work) {
  const { venue, day } = card.venueDay;
  const { venueDayItems } = await daySource();
  const list = await venueDayItems(day, venue);
  if (!list.length) {
    throw new Error(`${card.id}: nothing at ${venue} on ${day}`);
  }
  const cms = new Map(sessions.map((x) => [x.slug, x]));

  const title = (x) => {
    if (card.titles?.[x.slug]) return card.titles[x.slug];
    const t = (x.longTitle || x.title).replace(/\s+/g, " ").trim();
    // " : " as well as ": " — "AI Steering Wheel : Giving Humans Control…".
    const cut = t.search(/\s?:\s/);
    return t.length > 60 && cut > 0 ? t.slice(0, cut).trim() : t;
  };
  // Speakers by name; a moderator last and marked, because the person
  // chairing is not one of the people the session is about.
  const people = (x) => {
    const row = cms.get(x.slug);
    if (!row) {
      return x.people
        ? x.people.split(/\s*[·,]\s*/).map((n) => `<b>${escapeHtml(n)}</b>`).join("")
        : "";
    }
    const on = row.people.filter((p) => p.role !== "moderator").map((p) => p.name);
    const mod = row.people.filter((p) => p.role === "moderator").map((p) => p.name);
    return [
      ...on.map((n) => `<b>${escapeHtml(n)}</b>`),
      ...mod.map(
        (n) => `<span class="mod">Moderated by <b>${escapeHtml(n)}</b></span>`,
      ),
    ].join("");
  };
  // Minutes past midnight, local, as the calendar keeps them.
  const clock = (m) => {
    const h = Math.floor(m / 60);
    return [`${h % 12 || 12}:${String(m % 60).padStart(2, "0")}`, h < 12 ? "AM" : "PM"];
  };
  const short = (m) => {
    const [t, ap] = clock(m);
    return `${t.replace(":00", "")} ${ap}`;
  };

  /**
   * A company's wordmark in place of its name inside a title.
   *
   * The site already does this for the Nopalera talk on every calendar
   * surface — `TITLE_MARKS` in components/site/calendar/marks.tsx — and the
   * card borrows the same file and the same seating: 0.78em tall against the
   * cap, nudged 0.08em below the baseline, because the mark's box is its ink.
   * Matched on the word as well as the slug, so a retitled talk falls back to
   * type rather than dropping a logo into a sentence without the name in it.
   */
  const marks = {};
  for (const [slug, m] of Object.entries(card.titleMarks ?? {})) {
    marks[slug] = {
      ...m,
      file: await stage(work, join(REPO, m.repo), `title-mark-${slug}${extname(m.repo)}`),
    };
  }
  const titleHtml = (x) => {
    const t = title(x);
    const m = marks[x.slug];
    const at = m ? t.toLowerCase().indexOf(m.word.toLowerCase()) : -1;
    if (at < 0) return escapeHtml(t);
    return (
      escapeHtml(t.slice(0, at)) +
      `<img class="word" src="${m.file}" alt="${escapeHtml(m.word)}" />` +
      escapeHtml(t.slice(at + m.word.length))
    );
  };

  /**
   * A community block, and what runs inside it.
   *
   * On the day page a group's hour is one block — the CMS talks that belong
   * to it (`activation` on the session) fold into it rather than drawing
   * beside it. A card that did the same would list "AITX Community" and never
   * say what AITX are talking about, which is the thing a reader decides on.
   *
   * One talk in the block: one row, the group's mark over the talk. More than
   * one — The Model, Access Granted, PySanAntonio, Linux San Antonio — and the
   * mark heads the block once and every talk takes its own row with its own
   * time, because under one clock six talks read as six things at 1 PM.
   *
   * Marks are the site's: `brand` off the calendar item, a lockup file where
   * there is one and otherwise the typeset wordmark marks.tsx sets. Lockups
   * are sized between equal height and equal area — at one height an 8:1
   * wordmark (.NET) drew twice the ink of a 4:1 lockup (AITX); at equal area
   * (all four measured 26–31% ink, so box area is ink area) the compact ones
   * went tall and AITX shouted instead. Aspect to the 0.3 is the optical
   * middle, and is what reads as one size stacked in a column.
   *
   * A block with nothing inside it (College Night, Open Circuit) is its own
   * title, with the page's one-liner under it.
   */
  const localDay = (ms) =>
    new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const inside = (x) =>
    sessions
      .filter(
        (s) =>
          s.activation === x.slug &&
          s.location === venue &&
          localDay(s.startsAt) === day,
      )
      .sort((a, b) => a.startsAt - b.startsAt);
  const minuteOf = (ms) => {
    const [h, m] = new Date(ms)
      .toLocaleTimeString("en-GB", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit" })
      .split(":")
      .map(Number);
    return h * 60 + m;
  };
  const MARK_H = 30; // at a 5:1 mark; see above
  const markFor = async (x) => {
    const b = x.brand;
    if (b?.lockup?.src) {
      const src = join(REPO, "public", b.lockup.src);
      const file = await stage(work, src, `group-${x.slug}${extname(src)}`);
      const aspect = b.lockup.width / b.lockup.height;
      const h = MARK_H * Math.pow(5 / aspect, 0.3);
      return `<img class="group-mark" src="${file}" alt="" style="height:calc(${h.toFixed(1)}px * var(--s))" />`;
    }
    // The typeset ones, as marks.tsx sets them.
    if (b?.wordmark === "access-granted")
      return `<span class="wm wm-display"><span style="color:${b.accent}">Access</span> Granted</span>`;
    if (b?.wordmark === "the-model")
      return `<span class="wm wm-mono">The <span class="hl" style="background:${b.accent};color:${b.ink}">Model</span></span>`;
    return "";
  };
  const talkBody = (s) => {
    const x = { slug: s.slug, title: s.title, longTitle: s.title, people: "" };
    const who = people(x);
    return (
      `<div class="title">${titleHtml(x)}</div>` +
      (who ? `<div class="people">${who}</div>` : "")
    );
  };
  const slot = (min, body, cls = "") => {
    const [t, m] = min == null ? ["", ""] : clock(min);
    return (
      `<div class="slot${cls}">` +
      `<div class="at">${t}${m ? `<span>${m}</span>` : ""}</div>` +
      `<div class="body">${body}</div></div>`
    );
  };

  let count = 0;
  const rows = [];
  for (const x of list) {
    const talks = inside(x);
    const extra = x.continuous ?? [];
    const mark = talks.length ? await markFor(x) : "";
    const head = mark || `<span class="group-name">${escapeHtml(x.longTitle)}</span>`;
    if (talks.length === 1 && !extra.length) {
      count += 1;
      rows.push(slot(x.startMin, `<div class="group">${head}</div>` + talkBody(talks[0])));
    } else if (talks.length) {
      count += talks.length;
      const range = x.timeLabel ?? "";
      rows.push(
        slot(null, `<div class="group">${head}<span class="range">${escapeHtml(range)}</span></div>`, " head"),
      );
      for (const t of talks) rows.push(slot(minuteOf(t.startsAt), talkBody(t), " in"));
      // The continuous things last and flagged: no start time, so the block's
      // own hours where the clock would be — "1 – 6", not "all day", which it
      // is not.
      const [from, to] = (x.timeLabel ?? "").split(" \u2013 ");
      for (const c of extra) {
        rows.push(
          `<div class="slot in open"><div class="at">${escapeHtml(from ?? "")}\u2013${escapeHtml((to ?? "").replace(/ (AM|PM)$/, ""))}<span>${escapeHtml((to ?? "").slice(-2))}</span></div>` +
            `<div class="body"><div class="title">${escapeHtml(c.name)}</div>` +
            (c.by ? `<div class="people"><span class="mod">Powered by <b>${escapeHtml(c.by)}</b></span></div>` : "") +
            `</div></div>`,
        );
      }
    } else {
      count += 1;
      const who = people(x);
      rows.push(
        slot(
          x.startMin,
          `<div class="title">${titleHtml(x)}</div>` +
            (who
              ? `<div class="people">${who}</div>`
              : x.blurb && !cms.has(x.slug)
                ? `<div class="blurb">${escapeHtml(x.blurb)}</div>`
                : ""),
        ),
      );
    }
  }

  const last = Math.max(...list.map((x) => x.endMin));
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // Talks, not blocks: a day that is one activation is still eight sessions.
  const n = count;
  // The first time drops its meridiem when the last one shares it —
  // "1 – 5 PM", the way every fact line in this set is written.
  const a = short(list[0].startMin);
  const b = short(last);

  return {
    slots: rows.join("\n        "),
    slotCount: n,
    span: `${a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a} \u2013 ${b}`,
    count: `${words[n] ?? n} session${n === 1 ? "" : "s"}`,
  };
}

function clockRange(fromMin, toMin) {
  const one = (m) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const h12 = h % 12 || 12;
    return mm ? `${h12}:${String(mm).padStart(2, "0")}` : `${h12}`;
  };
  const ap = (m) => (Math.floor(m / 60) < 12 ? "AM" : "PM");
  return ap(fromMin) === ap(toMin)
    ? `${one(fromMin)} - ${one(toMin)} ${ap(toMin)}`
    : `${one(fromMin)} ${ap(fromMin)} - ${one(toMin)} ${ap(toMin)}`;
}

/**
 * A deterministic PRNG, so a field of bolts is the same field every render.
 *
 * startup-bash.html solves this by pasting its 78 positions into the file;
 * here the field belongs to whichever set asks for one, on a card whose
 * layout is computed, so it is generated — and seeded, because a card that
 * reshuffles its own weather on every render cannot be diffed against HEAD,
 * which is how every regression in this tool has been caught.
 */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The bolt field, inside one block.
 *
 * The Startup Bash card's field is the reference and the reasoning carries:
 * depth comes from size, opacity and a sub-pixel blur at once, because size
 * alone reads as bolts of different sizes rather than one size at different
 * distances. Scaled down hard — this is a 168px column, not half a poster, so
 * it is a texture inside a block rather than weather across a card.
 *
 * `left` is a percentage because a lane's width is decided by flex at render
 * time and this runs before that; `top` is pixels because the block's height
 * is the one number here that is known.
 */
function boltField(height, seed) {
  const rnd = mulberry32(seed);
  const n = Math.max(6, Math.round(height / 14));
  const out = [];
  for (let i = 0; i < n; i++) {
    const size = 7 + Math.round(rnd() * 15);
    // Far ones small, dim and softened; near ones larger and sharper. One
    // scalar drives all three so they cannot disagree.
    const near = (size - 7) / 15;
    out.push(
      `<img src="bolt.svg" alt="" style="left:${(rnd() * 96).toFixed(1)}%;` +
        `top:${(rnd() * (height - size)).toFixed(1)}px;width:${size}px;height:${size}px;` +
        `opacity:${(0.22 + near * 0.5).toFixed(2)};` +
        `filter:blur(${((1 - near) * 0.8).toFixed(2)}px)" />`,
    );
  }
  return `<div class="field">${out.join("")}</div>`;
}

function lineup(d, marks = {}) {
  const from = minutesOf(d.axis.from);
  const to = minutesOf(d.axis.to);
  const gridHeight = d.gridHeight ?? 920;
  const headHeight = d.headHeight ?? 54;
  // Pixels per minute, from the axis rather than a constant, so a quiet day
  // and a dense one both fill the same grid.
  const ppm = gridHeight / (to - from);
  const colour = (c) => CIRCUIT_COLORS[c] ?? "#e8e8e8";

  const hours = [];
  const rules = [];
  // Ticks on the hour, the last one included: the foot of the axis is a real
  // boundary — it is when the last thing ends — and a grid that stops ruling
  // an hour early reads as cropped.
  for (let m = Math.ceil(from / 60) * 60; m <= to; m += 60) {
    const y = (m - from) * ppm;
    const h = Math.floor(m / 60);
    // Plus the lane heading, because the label is absolutely positioned and
    // `.clock`'s padding does not move it: an absolute child resolves `top`
    // against the padding box, so the whole clock read one heading too high
    // and every hour pointed at the block above the one it names.
    hours.push(
      `<div class="hr" style="top:${(y + headHeight).toFixed(1)}px">${h % 12 || 12} ${h < 12 ? "AM" : "PM"}</div>`,
    );
    if (m > from && m < to)
      rules.push(`<div class="rule" style="top:${y.toFixed(1)}px"></div>`);
  }

  /**
   * The height under which a block stops stating its own hour.
   *
   * A 20-minute talk is 52px on the tall card and 38 on the feed one, and at
   * 38 a two-line title and a time do not both fit. The time is what goes:
   * the block's place against the ruled hours already says when it is, to the
   * nearest few minutes, and a title clipped in half says nothing at all.
   */
  const timeFloor = d.compact ? 46 : 0;

  let seed = 1;
  const lanes = d.rooms
    .map((room) => {
      const sets = (room.sets ?? [])
        .map((s) => {
          const a = minutesOf(s.from);
          const b = minutesOf(s.to);
          // Clamped, not dropped. The library opens at nine and is still
          // going at noon; that block belongs on the grid, cut off at the top
          // with `early` saying so, and its label still says nine.
          const top = Math.max(0, (a - from) * ppm);
          const bottom = Math.min(gridHeight, (b - from) * ppm);
          const h = bottom - top;
          const early = a < from ? " early" : "";
          // The group's mark, where a set has one and the block is tall
          // enough to hold it under the type. Bottom-anchored, so it reads as
          // the room's sign rather than as part of the title.
          const logo =
            s.logo && h > 120
              ? `<img class="mk" src="${marks[s.logo]}" alt="" />`
              : "";
          // Each talk inside an activation's hour: the time it starts, what
          // it is, and who has it. An hour that is really two talks was the
          // one thing the first grid could not say, and it is the thing a
          // reader picking a room most wants.
          const bill = (s.bill ?? [])
            .map(
              (t) =>
                `<div class="bl"><span class="bt">${t.at}</span>` +
                `<span class="bn">${t.title}</span>` +
                // No speaker on the feed card. Datanauts' hour is 98px there
                // and its two talks with names under them want 101, so the
                // second name was clipped by the block below. The names are
                // the part of a bill a reader can do without — what is on at
                // 1:30 is not.
                (t.who && !d.compact
                  ? `<span class="bw">${t.who}</span>`
                  : "") +
                `</div>`,
            )
            .join("");
          return (
            `<div class="set${early}" style="top:${top.toFixed(1)}px;` +
            `height:${h.toFixed(1)}px;--c:${colour(s.circuit)}">` +
            (s.bolts ? boltField(h, seed++) : "") +
            `<div class="sc">` +
            `<div class="st">${s.title}</div>` +
            (h > timeFloor ? `<div class="sw">${clockRange(a, b)}</div>` : "") +
            (s.who ? `<div class="sp">${s.who}</div>` : "") +
            (s.hook && h > 90 ? `<div class="sh">${s.hook}</div>` : "") +
            (bill ? `<div class="bill">${bill}</div>` : "") +
            `</div>${logo}</div>`
          );
        })
        .join("");
      return (
        `<div class="lane"><div class="lane-head">` +
        `<div class="n">${room.short}</div>` +
        (room.note ? `<div class="k">${room.note}</div>` : "") +
        `</div><div class="lane-body">${sets}` +
        `<div class="rules">${rules.join("")}</div></div></div>`
      );
    })
    .join("");

  /**
   * The morning, as rows or as one line.
   *
   * Three rows cost 130px, which the tall card has and the feed card spends
   * on the axis instead. Same three facts either way — the compact form drops
   * only the alignment.
   */
  const railRows = d.compact
    ? `<div class="rail-line">` +
      (d.rail ?? [])
        .map(
          (r) =>
            `<span class="one" style="--c:${colour(r.circuit)}">` +
            `<i></i>${r.title}<b>${r.room}</b>` +
            `<u>${clockRange(minutesOf(r.from), minutesOf(r.to))}</u></span>`,
        )
        .join("") +
      `</div>`
    : (d.rail ?? [])
        .map(
          (r) =>
            `<div class="rail-row" style="--c:${colour(r.circuit)}">` +
            `<span class="pip"></span><span class="t">${r.title}</span>` +
            `<span class="r">${r.room}</span>` +
            `<span class="w">${clockRange(minutesOf(r.from), minutesOf(r.to))}</span></div>`,
        )
        .join("\n        ");

  const weekItems = (d.allWeek ?? [])
    .map(
      (w) =>
        `<div class="it" style="--c:${colour(w.circuit)}">` +
        `<div class="t">${w.title}</div><div class="w">${w.note}</div></div>`,
    )
    .join("");

  // Only the circuits on the grid. A key naming five when the day ran three
  // is a key to the system, not to the poster in front of you.
  const shown = [];
  for (const r of d.rooms)
    for (const s of r.sets ?? [])
      if (!shown.includes(s.circuit)) shown.push(s.circuit);
  for (const r of d.rail ?? [])
    if (!shown.includes(r.circuit)) shown.push(r.circuit);

  return {
    gridHeight,
    headHeight,
    hours: hours.join("\n          "),
    lanes,
    railRows,
    railLabel: d.railLabel ?? "Before the grid",
    weekItems,
    weekLabel: d.weekLabel ?? "All week",
    legend: shown
      .map((c) => `<span class="c" style="--c:${colour(c)}"><i></i>${c}</span>`)
      .join(""),
    // One knob per size, set here rather than branched in the stylesheet.
    // The feed card is the tall one at about three quarters, and a dozen
    // `<!--if:compact-->` blocks would be a second layout to keep in step.
    ...(d.compact
      ? {
          h1Size: 44,
          eyebrowSize: 13,
          subSize: 12,
          setTitle: 13,
          setTime: 9,
          billSize: 9,
          laneName: 16,
          headPad: 40,
        }
      : {
          h1Size: 58,
          eyebrowSize: 16,
          subSize: 15,
          setTitle: 16,
          setTime: 11,
          billSize: 10,
          laneName: 19,
          headPad: 58,
        }),
  };
}

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
  const [speakers, partners, sponsors, sessionDocs] = await Promise.all([
    db.collection("speakers").get(),
    db.collection("partners").get(),
    db.collection("sponsors").get(),
    // For the venue-day cards, which list a room's day straight from the CMS
    // rather than from a copy typed into cards.mjs. See `venueDay` below.
    db.collection("sessions").get(),
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

  /**
   * Logos by name, from both walls.
   *
   * `partner:` on a card resolves against this, and it used to read the
   * partners collection alone — so a card crediting a sponsor could not find
   * one. H-E-B, whose contest Quest to Shelf is about, is a sponsor; the
   * alternative was pinning its blob URL on the card, which this file's own
   * `fetchCached` note warns against.
   *
   * Sponsors go in first so a name on both walls resolves to the partner
   * record, which is the one the site's own partner wall draws.
   */
  const byPartner = new Map();
  for (const d of [...sponsors.docs, ...partners.docs])
    byPartner.set((d.get("name") || "").toLowerCase(), d.get("imageUrl") || "");

  /**
   * Every dated session, with its people resolved to names.
   *
   * A venue-day card is a room's whole day, and the thing it must never do is
   * disagree with the schedule page an hour after it is posted. Reading the
   * CMS at render time is what the headshots already do for the same reason:
   * a card re-rendered after an edit picks the edit up, and a card whose list
   * was typed into cards.mjs would not.
   */
  const nameById = new Map(speakers.docs.map((d) => [d.id, d.get("name") || ""]));
  const sessions = sessionDocs.docs
    .map((d) => {
      const x = d.data();
      return {
        title: x.title || "",
        slug: x.slug || "",
        activation: x.activation || "",
        location: x.location || "",
        track: x.track || "",
        startsAt: x.startsAt?.toMillis?.() ?? null,
        endsAt: x.endsAt?.toMillis?.() ?? null,
        people: (x.participants || [])
          .map((p) => ({ name: nameById.get(p.speakerId) || "", role: p.role }))
          .filter((p) => p.name),
      };
    })
    .filter((x) => x.startsAt);

  return { bySlug, byPartner, sessions };
}

// ─── assets ─────────────────────────────────────────────────────────────────

/** Remote files land in a gitignored cache so a re-render costs no network. */
/**
 * Fetch once, then revalidate — not fetch once and trust it forever.
 *
 * The cache is keyed on the URL, and the blob store hands out URLs that are
 * stable across a replacement: Mason Egger's headshot was re-uploaded to the
 * same address, so every render after it kept drawing the old photograph and
 * nothing said so. The card comment in cards.mjs asserted that a replaced
 * photo changes its URL, which is what made this invisible — it was written
 * from two incidents where the URL *did* change, and the opposite case never
 * came up until it did.
 *
 * So each cached file keeps an `.etag` beside it and the next run asks the
 * server whether it still holds. A 304 costs one round trip and no transfer;
 * anything else rewrites the file. A server that sends no validator is
 * re-fetched every time, which is the safe way to be wrong.
 */
async function fetchCached(url) {
  await mkdir(CACHE, { recursive: true });
  const ext = extname(new URL(url).pathname) || ".png";
  const stem = join(
    CACHE,
    createHash("sha1").update(url).digest("hex").slice(0, 16),
  );
  const file = stem + ext;
  const tagFile = stem + ".etag";

  const tag =
    existsSync(file) && existsSync(tagFile)
      ? await readFile(tagFile, "utf8")
      : "";

  const res = await fetch(
    url,
    tag ? { headers: { "If-None-Match": tag } } : {},
  );
  if (res.status === 304) return file;
  if (!res.ok) {
    // A cached copy is better than a failed render when the network is the
    // thing that broke, but only when there is one.
    if (existsSync(file)) return file;
    throw new Error(`${res.status} fetching ${url}`);
  }
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  const etag = res.headers.get("etag");
  if (etag) await writeFile(tagFile, etag);
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

  const { bySlug, byPartner, sessions } = await loadSpeakers();
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

    /**
     * Logos, resolved from wherever each one lives.
     *
     * `card.logos` overrides the event's, for the same reason `card.template`
     * and `card.facts` do: the poster carries the coalition without DEVSA,
     * because DEVSA is in its co-brand row rather than its strip.
     *
     * `prefix` exists because a card can carry two strips. 1 Million Cups is
     * run by Launch SA and powered by PNC Bank, and those are not the same
     * claim — one strip holding both under either label says the bank runs
     * the morning or that Launch SA bought it. Two groups, each with its own
     * line. The staged filenames have to differ or the second group overwrites
     * the first in the working directory.
     */
    const build = async (list, prefix) => {
      const logos = [];
      for (const [i, l] of list.entries()) {
        let src;
        if (l.repo) src = join(REPO, l.repo);
        else if (l.url) src = await fetchCached(l.url);
        else if (l.partner) {
          const url = byPartner.get(l.partner.toLowerCase());
          if (!url) throw new Error(`${card.id}: no partner "${l.partner}"`);
          src = await fetchCached(url);
        }
        const as = `${prefix}-${i}${extname(src) || ".png"}`;
        await stage(work, src, as);
        // `white` knocks a mark back to a white silhouette — see OrganizerLogo,
        // which does the same thing with the same two filters so a mark drawn
        // white on the site is drawn white here too.
        const tone = l.white ? ";filter:brightness(0) invert(1)" : "";
        // `shift` is the strip's version of the one `marks` carries, and it is
        // needed here for the same reason: a mark with a caption under its
        // graphic — CyberJedis, Alamo City Locksport — has its file centre
        // below its visual mass, so a row that centres the files does not
        // centre what a reader sees.
        const nudge = l.shift ? `;transform:translateY(${l.shift}px)` : "";
        logos.push(
          `<img src="${as}" style="height:${l.height}px${tone}${nudge}" alt="" />`,
        );
      }
      return logos;
    };
    const logos = await build(card.logos ?? event.logos, "logo");
    // The second strip, where a card has one. Absent on every other card, and
    // `hosts: []` is how a card turns the event's off.
    const hosts = await build(card.hosts ?? event.hosts ?? [], "host");

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
     * The chair, where a talk has one — resolved by slug like a speaker, but
     * kept out of `people`. Everything downstream of `people` treats its
     * members as the subject of the card: the pair template gives each a
     * portrait, the single template names the first. A moderator is neither.
     *
     * Name only. The first pass staged her headshot as a thumbnail beside the
     * credit, and it read as a second speaker at a smaller size; a line of
     * text under the hook says what she is doing on the talk without putting
     * a face in competition with the one it is about.
     */
    let moderator = null;
    if (card.moderator) {
      moderator = bySlug.get(card.moderator);
      if (!moderator)
        throw new Error(
          `${card.id}: no speaker "${card.moderator}" in the CMS`,
        );
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
      // A URL as well as a repo path, because not every piece of event art is
      // in the repo: the venue illustrations live in the same Firebase bucket
      // the room photographs do and are hotlinked from lib/locations.ts, so
      // that a redrawn one reaches the site without a deploy. Fetched and
      // cached here the way PySanAntonio's logos are, and for the same
      // reason — a card should draw what the page draws.
      const src = card.art.startsWith("http")
        ? await fetchCached(card.art)
        : join(REPO, card.art);
      const as = `face-art${extname(src) || ".png"}`;
      await stage(work, src, as);
      people.push({ file: as, name: "", title: "", company: "" });
    }

    // `?? []`, because an event need not have any. Every event did until the
    // lineup poster, whose facts are the grid — a day, a room and an hour
    // stated once under a headline is exactly what it replaces.
    const facts = card.facts ?? event.facts ?? [];

    /**
     * A lineup's marks, staged like any other asset the card draws.
     *
     * Keyed by repo path so a mark used in two lanes is fetched once, and
     * named by index rather than by basename because two activations could
     * ship `logo.svg`. `lineup()` is pure and cannot await, so the files are
     * resolved here and handed to it.
     */
    const lineupMarks = {};
    for (const room of card.lineup?.rooms ?? [])
      for (const set of room.sets ?? [])
        if (set.logo && !lineupMarks[set.logo]) {
          const as = `lineup-${Object.keys(lineupMarks).length}${extname(set.logo)}`;
          await stage(work, join(REPO, set.logo), as);
          lineupMarks[set.logo] = as;
        }

    const [a, b] = people;
    const html = await readFile(
      // A card may override its event's template. The wide Meetup cards are
      // the same event's data in a different shape, so they share everything
      // except the layout.
      join(HERE, "templates", card.template ?? event.template),
      "utf8",
    );

    /**
     * An activation's lineup, one speaker to a scene — the Short that walks
     * the afternoon a face at a time. See `activationTalks` in day-source.ts
     * for why the running order is read rather than typed here.
     *
     * Each scene is the talk's first speaker, full height at the foot of the
     * frame, under the hour, the title, the name and the group that runs the
     * hour. `card.portraits` is keyed by speaker slug because every headshot
     * is cropped differently: the numbers are that speaker's own card's,
     * scaled to this frame.
     */
    let scenes = "";
    let sceneCount = 0;
    if (card.lineupOf) {
      const { activationTalks } = await daySource();
      const talks = await activationTalks(card.lineupOf);
      const hhmm = (ms) => {
        const [t, ap] = new Date(ms)
          .toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })
          .split(" ");
        return `${t}<span>${ap}</span>`;
      };
      const out = [];
      for (const [n, t] of talks.entries()) {
        const who = t.speakers[0];
        if (!who) continue;
        const sp = bySlug.get(who.slug);
        if (!sp?.imageUrl) throw new Error(`${card.id}: ${who.slug} has no headshot`);
        const as = `scene-${n}${extname(sp.imageUrl.split("?")[0]) || ".png"}`;
        await stage(work, await fetchCached(sp.imageUrl), as);
        const box = card.portraits?.[who.slug] ?? {};
        const name = t.speakers.map((p) => escapeHtml(p.name)).join(" &amp; ");
        const titleText = card.titles?.[t.slug] ?? t.title.replace(/\.$/, "");
        out.push(
          `<section class="scene talk">` +
            `<img class="figure" src="${as}" alt="" style="height:${box.height ?? 1240}px;` +
            `margin-left:${box.shift ?? 0}px;bottom:${box.bottom ?? 0}px" />` +
            `<div class="copy">` +
            `<div class="at">${hhmm(t.startsAt)}</div>` +
            `<h2>${escapeHtml(titleText)}</h2>` +
            `<div class="who">${name}</div>` +
            (t.poweredBy
              ? `<div class="by"><span>&gt;_</span> Powered by ${escapeHtml(t.poweredBy)}</div>`
              : "") +
            `</div></section>`,
        );
      }
      scenes = out.join("\n    ");
      sceneCount = out.length;
      if (card.village) {
        await stage(work, join(REPO, card.village.logo), "village-logo.png");
      }
    }

    const data = {
      ...(card.venueDay ? await venueDay(card, sessions, work) : {}),
      scenes,
      sceneCount,
      // The lineup Short's last scene before the outro — see `village` in
      // cards.mjs. Its logo is staged with the scenes above.
      villageWhen: card.village?.when ?? "",
      villageTitle: card.village?.title ?? "",
      villageLine: card.village?.line ?? "",
      villageBy: card.village?.by ?? "",
      dayLabel: card.dayLabel ?? "",
      // venue-day.html's Startup Bash field, in place of the one big bolt,
      // and the seed that fixes where it falls.
      field: card.boltField ? "1" : "",
      ramp: card.ramp === false ? "" : "1",
      // venue-day.html's third look: the room's ASCII portrait from
      // lib/locations.ts as a band across the top. Fetched through the cache,
      // like every remote asset here, so a replaced image is picked up.
      venueArt: card.venueArt
        ? await stage(work, await fetchCached(card.venueArt.url), "venue-art.png")
        : "",
      // Prefixed: `artWidth` already belongs to activation-poster.html, and a
      // later key of the same name in this object silently zeroed this one.
      venueArtHeight: card.venueArt?.height ?? 520,
      venueArtPosition: card.venueArt?.position ?? "50% 0%",
      venueArtGap: card.venueArt?.gap ?? 300,
      venueArtRight: card.venueArt?.side === "right" ? "1" : "",
      venueArtWidth: card.venueArt?.width ?? 1080,
      seed: [...card.id].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7),
      // Blank unless a card asks for it — `activation-poster` guards its dates
      // row on this token, and Access Granted's poster gives that corner to
      // DEVSA instead.
      week: card.week === false ? "" : WEEK,
      eyebrow: card.eyebrow ?? "",
      // The canvas, for a template that has to do arithmetic against it.
      // Every other template hardcodes 1080x1350 because every other card is
      // that; the lineup grid is taller and sizes its own rows.
      cardWidth: (card.size ?? event.size ?? SIZE).width,
      cardHeight: (card.size ?? event.size ?? SIZE).height,
      headline: card.headline,
      headlineSize: card.headlineSize ?? 88,
      // The blurb's measure. Defaults to the 760 the-model.html was written
      // with; a card whose portrait reaches further left needs the copy to
      // stop sooner, or the text runs into the speaker's face.
      blurbWidth: card.blurbWidth ?? 760,
      subtitle: card.subtitle ?? "",
      circuit: card.circuit ?? "",
      // A card may carry its own facts. TPR needs it: every other event runs
      // on one day at one hour, so the day is the event's, but TPR's speakers
      // sit on different days and its times are not set yet.
      fact1: facts[0],
      fact2: facts[1] ?? "",
      fact3: facts[2] ?? "",
      /**
       * A day's lineup, in the shape an ACL day flyer draws: rooms across
       * the top, the clock down the side, every session a block at its true
       * place on the axis.
       *
       * Built here for the reason `states` and `talks` are — the engine
       * substitutes and branches, it does not loop — but with arithmetic the
       * others do not need. A block's place is a function of the axis, so
       * the card gives clock times and this turns them into pixels. Times go
       * in as 24-hour "H:MM" and come out as the label the week writes
       * ("12:05 - 12:25 PM"), so a card never states the same hour twice and
       * the two cannot drift apart.
       *
       * The axis is the day's busy window, not the day: Thursday opens at
       * 7:30 and does nothing much until noon, and drawn to scale that is
       * four empty hours bought at the price of every afternoon block. What
       * falls outside goes on the rail above the grid, which is the trade
       * `dayCalendar` already makes for the same reason.
       */
      ...(card.lineup ? lineup(card.lineup, lineupMarks) : {}),
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
      // The activation's own colour, for the one template shared across two
      // brands. Every other template hardcodes its palette because it serves
      // one event; the poster serves Access Granted's green and The Model's
      // lavender off the same layout.
      accent: card.accent ?? "#ff32a0",
      // The poster's co-brand row and its hero. `cobrand` is a flag rather
      // than a mark, because the only partner that appears there is DEVSA and
      // the alternative is the dates — see `if:week` in activation-poster.
      cobrand: card.cobrand ? "1" : "",
      devsaHeight: card.devsaHeight ?? 0,
      artWidth: card.artWidth ?? 0,
      // Columns in the organiser strip. Three by default, which is what a
      // six-mark strip needs when a figure is standing beside it; a card
      // whose art clears the foot of the card can ask for one row.
      logoCols: card.logoCols ?? 3,
      // The typeset "Access Granted" wordmark's size. 92 on a speaker card,
      // where it is a standfirst over the talk's title; larger on a card
      // where the event's name is the title.
      wordmarkSize: card.wordmarkSize ?? 92,
      // The schematic field's reach, as the size-and-position half of a
      // radial-gradient mask. Default is where it has always sat: gathered
      // behind the figure on the right.
      gridMask: card.gridMask ?? "58% 62% at 68% 52%",
      // The schematic's ink. 0.055 behind a figure; more on a card that is
      // using the field to fill space rather than to sit behind something.
      gridInk: card.gridInk ?? 0.055,
      // The scrim's horizontal ramp, as the stop list of a left-to-right
      // gradient. Default is what every card here has always drawn: solid
      // black across the left fifth, clear by just past the middle.
      scrimLeft: card.scrimLeft ?? "#000 0%, #000 20%, rgba(0, 0, 0, 0) 52%",
      // The strip's own line. Every other template writes its label into the
      // markup because it serves one event; this one serves two, and Access
      // Granted's names the coalition where The Model's is the house "//".
      // Falls back to the event, the way `logos` does above: the label goes
      // with the strip, and the strip is usually the event's.
      poweredLabel: card.poweredLabel ?? event.poweredLabel ?? "",
      transparent: card.video ? "1" : "",
      // Whether the card's art is a block rather than a cutout — an opaque
      // ground the bloom has to be carried over. See `pysanantonio-event`.
      artBlock: card.artBlock ? "1" : "",
      // Where the footage's top edge lands, so the overlay can feather it.
      videoTop: card.video ? card.video.y : 0,
      /**
       * The room, beside the circuit on the ramp's caption.
       *
       * It read "Main Stage" in the markup while this template served one
       * room. It serves two now — TPR's stage and the standalone talks at The
       * Rand — and a card for a third-floor session that announces itself as
       * the main stage is telling a reader to walk into the wrong building.
       */
      stage: card.stage ?? event.stage ?? "Main Stage",
      /**
       * Where a template's ground bolt sits, in px.
       *
       * The defaults are tpr.html's, which is the template that asked for
       * this first. community-group.html has its own numbers and passes them
       * on the event, because one default cannot be right for two templates
       * whose bolts were placed independently — see `.bolt` in each.
       */
      boltLeft: card.boltLeft ?? event.boltLeft ?? -360,
      boltTop: card.boltTop ?? event.boltTop ?? 430,
      // The label over a single undifferentiated field of marks. The poster
      // splits into three and labels each; a card whose claim is the count
      // wants one field and one line saying what is in it.
      marksLabel: card.marksLabel ?? "",
      // The two halves of a before/after card. Separate tokens rather than a
      // second `subtitle`, because the label is the hinge: it is what tells a
      // reader the paragraph under it is answering the one above it.
      turnLabel: card.turnLabel ?? "",
      turnBody: card.turnBody ?? "",
      /**
       * A running order, one row per session, built here for the same reason
       * `logos` and `marks` are: the engine substitutes and branches but does
       * not loop.
       *
       * `at` / `who` / `what` rather than time / speaker / title, because the
       * last row is a quiz with no speaker — `who` is "Python Jeopardy" there
       * and the template golds it rather than special-casing a missing name.
       *
       * `flag` is a free class name for a row that is not like the others —
       * Access Granted's lockpicking village runs the whole afternoon and has
       * no start time, so it sits in the same list but must not read as a
       * seventh thing you can be late for. What the class *does* is the
       * template's business, as with `prize`.
       */
      rows: (card.rows ?? [])
        .map(
          (r) =>
            `<div class="row${r.prize ? " prize" : ""}${r.flag ? ` ${r.flag}` : ""}">` +
            `<div class="at">${r.at}</div>` +
            `<div><div class="who">${r.who}</div>` +
            (r.what ? `<div class="what">${r.what}</div>` : "") +
            `</div></div>`,
        )
        .join("\n        "),
      kicker: card.kicker ?? "",
      // The event page's own headline face, where a poster should read as
      // the page rather than as the speaker set — see activation-poster.
      headlineMono: card.headlineFont === "mono" ? "1" : "",
      // A bill's two talks. Named rather than folded into `headline`, because
      // this card carries both at once and the existing token is singular.
      talkA: card.talks?.[0]?.title ?? "",
      talkSubA: card.talks?.[0]?.subtitle ?? "",
      talkB: card.talks?.[1]?.title ?? "",
      talkSubB: card.talks?.[1]?.subtitle ?? "",
      ctaLine: card.ctaLine ?? "",
      ctaUrl: card.ctaUrl ?? "",
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
      hosts: hosts.join("\n          "),
      /**
       * A credit with no mark to draw, set as a name.
       *
       * Neither PNC Bank nor Active Capital is in `partners` or `sponsors`,
       * which is why components/site/powered-by-line.tsx prints their names
       * instead of marks — and why it sets them in the body face: a bank's
       * name in Oswald uppercase reads as a wordmark we invented for them.
       * The same rule, on the card. Delete this from a card the day the mark
       * lands in the CMS and give it `logos` instead.
       */
      poweredNames: (card.poweredNames ?? event.poweredNames ?? [])
        .map((n) => `<span>${n}</span>`)
        .join("\n            "),
      // The second strip's own line, the way `poweredLabel` is the first's.
      hostLabel: card.hostLabel ?? event.hostLabel ?? "",
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
      /**
       * The rest of that line, where a mark is set into the middle of it.
       *
       * 1 Million Cups' hook names Launch SA, who have a logo, and a sentence
       * cannot carry one through `quote` alone: `fill` substitutes in a single
       * pass, so a `{{hosts}}` written inside a card's own value is never
       * looked at again. The template holds the sentence's shape instead and
       * the card hands it the two halves.
       */
      quoteTail: card.quoteTail ?? "",
      // The line under the title, where the page runs one — College Night's
      // `detail.headline`, which is the deck on its hero.
      deck: card.deck ?? "",
      // The small print. Data rather than template text so it sits beside the
      // rest of the card's copy and can be diffed against the page's.
      access: card.access ?? "",

      // Everything below is absent on a card with no speaker.
      face: a?.file ?? "",
      /**
       * Declared even when there is no second speaker, which the pair block
       * below does not do.
       *
       * `fill` only resolves a guard whose key is in `data` — a key that is
       * absent leaves `<!--if:key-->…<!--/if:key-->` sitting in the HTML as
       * markup. tpr.html's pair layout is guarded on this one, so every
       * single-speaker card on that stage rendered the empty pair block and
       * its name column, which pushed the whole card down ten pixels.
       */
      // Exactly two, not "at least two": a panel has a `b` as well, and with
      // five speakers the pair layout drew its own name column underneath
      // the crowd's.
      faceB: people.length === 2 ? (b?.file ?? "") : "",
      /**
       * Three or more speakers, as one row of cutouts.
       *
       * The pair tokens above stop at two, which is the shape almost every
       * card here is: a talk, or a talk with a chair. A panel is a different
       * object — Quest to Shelf has five — and five sets of `faceA`-style
       * tokens would be five near-identical branches in every template that
       * ever takes one. So the figures are built here, the way `logos` and
       * `marks` are, and the template places the row rather than each person.
       *
       * `height` is the figure's height and `top` its distance from the right
       * edge, the same two numbers the TPR pair layout uses. Drawn in card
       * order with each one behind the last, so a row reading left to right
       * overlaps like people standing rather than like a stack of cards.
       */
      faces:
        people.length > 2
          ? people
              .map((pp, n) => {
                const box = card.portraits?.[n] ?? {};
                return (
                  `<img src="${pp.file}" alt="" style="height:${box.height ?? 520}px` +
                  `;right:${box.top ?? n * 180}px` +
                  // Lifts one figure off the row's baseline. 0 for everyone
                  // unless a card says otherwise, because a row is bottom-
                  // anchored so its crops line up at the foot.
                  //
                  // It exists for the case where a crop is tighter than its
                  // neighbours': shrinking that figure to match head sizes
                  // drops its crown, which reads as standing further back, so
                  // the height comes down and `bottom` puts the crown back.
                  // The cost is a gap under that figure at the card's foot.
                  `;bottom:${box.bottom ?? 0}px" />`
                );
              })
              // Reversed, and no z-index on the tag. Painting order comes from
              // the DOM — last sibling on top — so the row reads right to
              // left, each figure behind the one nearer the edge. An inline
              // z-index is what the first pass used, and it beat the
              // stylesheet's: the figures climbed over the frame and clipped
              // the venue line.
              .reverse()
              .join("\n      ")
          : "",
      /**
       * Their names, as one line rather than a stacked block.
       *
       * Five figures need the whole bottom band, so there is no column beside
       * them to put five names in — the first pass stacked them there and the
       * row covered every company line. A credits line under the hook clears
       * the band and still gives each person their name and where they build.
       */
      crowd:
        people.length > 2
          ? people
              .map(
                (pp) =>
                  `<span><b>${pp.name}</b>${pp.org ? ` &middot; ${pp.org}` : ""}</span>`,
              )
              .join("\n        ")
          : "",
      // Split after the first word unless the card says otherwise. That is
      // right for two- and three-word names and wrong for four: "Daniel" over
      // "Felipe Morales Yusty" runs the second line into the portrait.
      first: card.name?.[0] ?? a?.name.split(" ")[0] ?? "",
      last: card.name?.[1] ?? a?.name.split(" ").slice(1).join(" ") ?? "",
      // A card may override what the CMS says — see mason-egger.
      role: card.role ?? a?.role ?? "",
      org: card.org ?? a?.org ?? "",
      moderatorName: moderator?.name ?? "",
      portraitHeight: card.portrait?.height,
      portraitLeft: card.portrait?.left,
      // Lifts the figure off the bottom edge. 0 for every portrait — a person
      // is cropped at the frame and bleeding off it is the point — and set
      // only by an `art` card, where the figure is a logo. A lockup sitting
      // flush on the card's edge reads as artwork that did not fit.
      portraitBottom: card.portrait?.bottom ?? 0,

      ...(people.length === 2
        ? {
            faceA: a.file,
            firstA: a.name.split(" ")[0],
            lastA: a.name.split(" ").slice(1).join(" "),
            // `roles` overrides what the CMS says, the way `name` and `role`
            // already do for a single speaker. Needed the first time a pair
            // card met a 44-character job title: "AI Solution Architect &
            // Innovation Strategist" set under a name at this size runs into
            // the figures beside it.
            roleA: card.roles?.[0] ?? a.role,
            orgA: a.org,
            heightA: card.portraits[0].height,
            topA: card.portraits[0].top,
            bottomA: card.portraits[0].bottom ?? 0,
            faceB: b.file,
            firstB: b.name.split(" ")[0],
            lastB: b.name.split(" ").slice(1).join(" "),
            roleB: card.roles?.[1] ?? b.role,
            orgB: b.org,
            heightB: card.portraits[1].height,
            topB: card.portraits[1].top,
            bottomB: card.portraits[1].bottom ?? 0,
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
    // A template that sizes itself to its content does it here, once the
    // faces it measures with have loaded. Same seam as `reveal`: the renderer
    // only calls it, and what fitting means is the template's business.
    await page.evaluate(() => window.fit?.());
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
     * A card that reveals itself, for a Short.
     *
     * The still cards are one screenshot. This is a list that arrives a line
     * at a time, and the cheap way to film that is to shoot the states rather
     * than the frames: nine screenshots held for a couple of seconds each,
     * not 24 a second for twenty seconds. A 24fps capture of this would be
     * 513 screenshots to draw nine distinct pictures.
     *
     * What a step *means* is the template's business — it exposes
     * `window.reveal(n)` and this only counts. That seam is deliberate: the
     * next template to want motion can wipe, count down or move a figure
     * without the renderer learning what any of those are.
     *
     * The stills are written beside the mp4 and cleaned up after it, because
     * the only thing anyone wants out of this card is the video.
     */
    const stills = [];
    if (card.reveal) {
      for (const [i, hold] of card.reveal.entries()) {
        await page.evaluate((n) => window.reveal(n), i);
        const f = out.replace(/\.png$/, `-${String(i).padStart(2, "0")}.png`);
        // Transparent only where footage will show through. A card with no
        // clip behind it *is* the picture, and a transparent PNG there
        // composites over nothing and comes out as a black frame.
        await page.screenshot({ path: f, omitBackground: !!card.video });
        stills.push({ file: f, hold });
      }
    }

    /**
     * A card whose art is a sequence rather than a picture.
     *
     * The motion poster's art is a captured animation — The Model's node graph
     * walking itself on, from capture-model-flow.mjs — and the poster around
     * it does not move. So the card is shot once per frame with only the
     * art's `src` swapped, which keeps everything that is not the animation
     * pixel-identical from the first frame to the last, and costs one
     * screenshot a frame rather than any compositing geometry: the frames drop
     * into the same `<img>` a still poster uses, at the same size, sized by
     * the same CSS.
     *
     * The first and last frames hold. A walk that starts the instant a video
     * does is over before a feed has stopped scrolling, and one that ends the
     * instant it arrives never shows the finished graph, which is the poster.
     */
    if (card.artFrames) {
      const a = card.artFrames;
      const dir = join(REPO, a.dir);
      const frames = existsSync(dir)
        ? (await readdir(dir)).filter((n) => n.endsWith(".png")).sort()
        : [];
      if (frames.length < 2)
        throw new Error(
          `${card.id}: no frames in ${a.dir} — run tools/social-cards/capture-model-flow.mjs`,
        );
      const step = 1 / (a.fps ?? 24);
      for (const [i, name] of frames.entries()) {
        await page.evaluate(
          (src) =>
            new Promise((done) => {
              const img = document.querySelector(".art img");
              img.onload = () => requestAnimationFrame(() => done());
              img.src = src;
            }),
          "file://" + join(dir, name),
        );
        const f = out.replace(/\.png$/, `-${String(i).padStart(3, "0")}.png`);
        await page.screenshot({ path: f, omitBackground: !!card.video });
        const hold =
          i === 0
            ? (a.holdStart ?? 1)
            : i === frames.length - 1
              ? (a.holdEnd ?? 4)
              : step;
        stills.push({ file: f, hold });
      }
    }

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
    /**
     * Anything that comes out as an mp4: footage with a card over it, a
     * sequence of cards, or both.
     *
     * The two are not variants of one idea. PySanAntonio has seven seconds of
     * its own mascot and the card is an overlay on it; a community group has
     * two headshots and a bolt, and the card *is* the picture. So a card with
     * `reveal` and no `video` skips the compositing entirely and encodes its
     * own stills — which is also why those stills are shot opaque.
     */
    if (card.video || stills.length) {
      const v = card.video ?? {};
      const mp4 = out.replace(/\.png$/, ".mp4");
      const W = size.width * scale;
      const H = size.height * scale;
      /**
       * One overlay or a timed sequence of them.
       *
       * The concat demuxer turns the stills into a video stream with alpha
       * intact, each held for the seconds the card gave it. Its one quirk is
       * that the final entry's `duration` is ignored, so the last file is
       * listed twice — the second listing is what the duration attaches to.
       */
      // Index 0 is the footage when there is footage, and the sequence when
      // there is not — every later input shifts with it.
      let overlayIn = ["-i", out];
      let total = v.seconds ?? 14;
      if (stills.length) {
        const list = out.replace(/\.png$/, ".txt");
        await writeFile(
          list,
          stills
            .map((s2) => `file '${s2.file}'\nduration ${s2.hold}`)
            .join("\n") + `\nfile '${stills[stills.length - 1].file}'\n`,
        );
        overlayIn = ["-f", "concat", "-safe", "0", "-i", list];
        total = stills.reduce((a, s2) => a + s2.hold, 0);
        stills.push({ file: list });
      }
      /**
       * The soundtrack, measured rather than guessed at.
       *
       * A card names a file, a start and two fade lengths; the level is not
       * its business. ffmpeg runs `loudnorm` over the exact slice that will
       * be used, and the second pass applies that measurement linearly — a
       * constant gain, not the dynamic mode, which pumps a track with a
       * quiet bar in it. Swapping the track needs no numbers changed here.
       *
       * -14 LUFS is what YouTube normalises to, so a louder master only gets
       * turned back down at playback; -1.5 dBTP leaves room for the clipping
       * a lossy transcode adds on the way there. This particular track
       * arrived at -10.2 LUFS and +0.73 dBTP, which is over full scale.
       */
      const audio = [];
      if (card.audio) {
        const a = card.audio;
        const src = /^[~/]/.test(a.src)
          ? a.src.replace(/^~/, process.env.HOME)
          : join(REPO, a.src);
        if (!existsSync(src)) {
          console.warn(`${card.id}  !! no audio at ${src} — rendering silent`);
        } else {
          const slice = [
            "-ss",
            String(a.start ?? 0),
            "-t",
            String(total),
            "-i",
            src,
          ];
          const ai = card.video ? 2 : 1;
          const { stderr } = await run(
            "ffmpeg",
            [...slice, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
            { maxBuffer: 1 << 24 },
          );
          // ffmpeg keeps writing after the JSON block, so it has to be cut
          // at its own closing brace rather than at the end of the stream.
          const at = stderr.lastIndexOf("{");
          const m = JSON.parse(stderr.slice(at, stderr.indexOf("}", at) + 1));
          const fin = a.fadeIn ?? 0.2;
          const fout = a.fadeOut ?? 1.5;
          audio.push({
            in: slice,
            filter:
              `[${ai}:a]loudnorm=I=-14:TP=-1.5:LRA=11:linear=true` +
              `:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
              `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}` +
              `,aresample=48000` +
              `,afade=t=in:st=0:d=${fin}` +
              `,afade=t=out:st=${(total - fout).toFixed(3)}:d=${fout}[a]`,
          });
        }
      }

      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        ...(card.video
          ? ["-stream_loop", String(v.loops ?? 1), "-i", join(REPO, v.src)]
          : []),
        ...overlayIn,
        ...(audio[0]?.in ?? []),
        "-filter_complex",
        (card.video
          ? `[0:v]scale=-2:${v.height * scale},split[clip][edge];` +
            `[edge]crop=iw:4:0:0,scale=iw:${v.y * scale}[fill];` +
            `[fill][clip]vstack[fig];` +
            `color=c=${v.canvas ?? "black"}:s=${W}x${H}[bg];` +
            `[bg][fig]overlay=${v.x * scale}:0[b];`
          : ``) +
          /**
           * A sequence needs normalising; a single still must not be.
           *
           * The concat demuxer hands over frames on its own clock, so the
           * sequence is resampled to the output rate before it is laid down.
           * Running the same filter on a one-frame PNG turns it into a
           * one-frame *video* — and the composite then lasts one frame, which
           * is what `pysanantonio-motion` became the first time this was
           * written as one branch for both.
           *
           * Neither case wants `shortest`: overlay repeats its last frame at
           * EOF, which is exactly the hold a still card and a final reveal
           * state both want, and `-t` is what decides the length.
           */
          (!card.video
            ? `[0:v]fps=24`
            : stills.length
              ? `[1:v]fps=24,format=rgba[ov];[b][ov]overlay=0:0`
              : `[b][1:v]overlay=0:0`) +
          `,format=yuv420p[o]` +
          (audio[0] ? `;${audio[0].filter}` : ``),
        "-map",
        "[o]",
        ...(audio[0]
          ? ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
          : ["-an"]),
        "-t",
        String(total),
        "-r",
        "24",
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
      // The stills were scaffolding for the mp4 and nothing else reads them.
      for (const s2 of stills) await rm(s2.file, { force: true });
      if (stills.length) await rm(out, { force: true });
      console.log(`${card.id}  -> ${mp4.split("/").pop()}`);
    }
    console.log(
      `${card.id}${missing.length ? `  !! failed: ${missing.join(", ")}` : ""}`,
    );
  }

  await browser.close();
  // KEEP_WORK=1 leaves the filled pages behind, for when a card renders wrong
  // and the question is what the browser was actually given.
  if (!process.env.KEEP_WORK) await rm(work, { recursive: true, force: true });
  console.log(`\n${wanted.length} card(s) -> ${outDir}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
