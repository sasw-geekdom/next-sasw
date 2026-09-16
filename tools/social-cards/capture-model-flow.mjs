/**
 * Captures The Model's node-graph intro as a PNG sequence, for the motion
 * poster (`the-model-motion` in cards.mjs).
 *
 *   pnpm dev                                                   # in another shell
 *   node tools/social-cards/capture-model-flow.mjs [baseUrl]   # default localhost:3000
 *
 * Writes .cache/model-flow/frame-000.png … — gitignored, like every other
 * thing this tool fetches or derives. Run it before rendering the card, and
 * again whenever ModelFlow or its data changes.
 *
 * ─── Frames, not a screen recording ─────────────────────────────────────────
 *
 * ModelFlow's intro is four custom properties and nothing else: `--step`
 * switches nodes on, `--draw` runs the wires' dash offset, `--px`/`--py` move
 * the pointer. No CSS transition sits on any of them (see the component), so a
 * frame is a pure function of one number, the eased progress `p`. That makes
 * it deterministic to film: load the page with reduced motion — the component
 * paints the finished state once and starts no loop that could fight us — then
 * set the four properties for each `p` and screenshot.
 *
 * A screen recording of the live intro was the alternative, and it would have
 * been worse on every axis: WebM at whatever quality the recorder picks,
 * timing at the mercy of the machine, and 1.5 seconds of a 60Hz rAF loop
 * captured at 25fps.
 *
 * ─── Kept in step with the site, not copied from it ─────────────────────────
 *
 * The pointer's path is read out of lib/the-model-flow.ts at run time, and the
 * ease, the step count and the draw rate are the component's own numbers. If
 * any of those change there, change them here — this is the one place outside
 * the component that has to know them.
 *
 * The crop is the one `public/the-model/node-graph.png` was cut at — found by
 * searching the live graph for that still, which matched to a mean difference
 * of 0.02 levels. So the motion poster's first frame and its last are the
 * still poster's picture, at the same size, in the same place.
 */

import { readFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const OUT = join(HERE, ".cache", "model-flow");

/** The component's numbers — see model-flow.tsx. */
const STEPS = 3;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * How many frames the 1.5s intro is sampled into. 60 at the poster's 24fps
 * plays it over 2.5s — two-thirds speed. The site's pace is right for a page
 * someone has already chosen to look at; in a feed the walk is the hook, and
 * at full speed it is over before a scroll has stopped.
 */
const FRAMES = 60;

async function flowPath() {
  const src = await readFile(join(REPO, "lib/the-model-flow.ts"), "utf8");
  const block = src.match(/export const FLOW_PATH[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error("FLOW_PATH not found in lib/the-model-flow.ts");
  const points = [...block[1].matchAll(/x:\s*([\d.]+),\s*y:\s*([\d.]+)/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]) }),
  );
  if (points.length < 2) throw new Error("FLOW_PATH has fewer than two points");
  return points;
}

function pointAt(path, p) {
  const n = path.length - 1;
  const t = Math.min(Math.max(p, 0), 1) * n;
  const i = Math.min(Math.floor(t), n - 1);
  const f = t - i;
  const a = path[i];
  const b = path[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

async function main() {
  const base = process.argv[2] ?? "http://localhost:3000";
  const path = await flowPath();

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("playwright is not installed — see render.mjs for how.");
    process.exit(1);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  // 1470 wide at 2x — the MacBook Air width the still was cut at. The graph
  // is 636px CSS at every desktop width from 1280 up, so this only has to be
  // a width where the band is laid out side by side.
  const page = await (
    await browser.newContext({
      viewport: { width: 1470, height: 1000 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    })
  ).newPage();
  await page.goto(`${base}/schedule/the-model`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const box = await page.evaluate(() => {
    const el = document.querySelector('[aria-hidden="true"].aspect-\\[8\\/5\\]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  if (!box) throw new Error("ModelFlow not found on /schedule/the-model");
  const clip = { x: box.x + 10.5, y: box.y - 4, width: 633, height: 347 };

  for (let i = 0; i < FRAMES; i++) {
    const p = easeInOut(i / (FRAMES - 1));
    const { x, y } = pointAt(path, p);
    await page.evaluate(
      ({ step, draw, px, py }) => {
        const el = document.querySelector(
          '[aria-hidden="true"].aspect-\\[8\\/5\\]',
        );
        el.style.setProperty("--step", step);
        el.style.setProperty("--draw", draw);
        el.style.setProperty("--px", px);
        el.style.setProperty("--py", py);
        // Two frames, so the style has been applied and painted before the
        // screenshot is taken rather than merely queued.
        return new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
      },
      {
        step: String(Math.floor(p * STEPS)),
        draw: String(Math.min(p * 1.35, 1)),
        px: x.toFixed(2),
        py: y.toFixed(2),
      },
    );
    await page.screenshot({
      path: join(OUT, `frame-${String(i).padStart(3, "0")}.png`),
      clip,
    });
  }

  await browser.close();
  console.log(`${FRAMES} frames -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
