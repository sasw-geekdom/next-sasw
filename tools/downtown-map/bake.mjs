/**
 * Bakes lib/downtown-map.ts from OpenStreetMap.
 *
 *   node tools/downtown-map/bake.mjs
 *
 * The /faq map is an SVG of downtown drawn in the week's own colours, and its
 * geometry is a file rather than a tile request. This is what makes that file:
 * it asks Overpass for the named streets and the water inside a bounding box,
 * projects them to metres around the centroid of the pins, clips them to the
 * frame, simplifies each run to a 5 m tolerance and writes the paths out.
 *
 * Run it when the frame changes, when a pin moves outside it, or when the
 * streets do. It is not part of the build — nothing about a page render should
 * depend on a third party's API being up, which is the whole point of baking.
 *
 * ─── The two numbers that matter ────────────────────────────────────────────
 *
 * PAD is how much air sits around the outermost pin, in metres, and it is the
 * only framing control: the frame is the pins' bounding box plus this.
 *
 * It is not symmetric, and the map is taller than it is wide, because downtown
 * is: the five rooms and three garages sit inside three blocks, and Central
 * Library is half a mile north of them. A wider frame only buys empty middle —
 * the first pass ran 220 on x and put every pin but the library's in the
 * bottom fifth of the picture.
 *
 * TOLERANCE is the simplifier. At 5 m a downtown block keeps its shape and the
 * file lands around 15 KB; at 1 m it triples for a difference no one can see at
 * a thousand metres across.
 *
 * ─── Licence ───────────────────────────────────────────────────────────────
 *
 * OpenStreetMap data is ODbL. The map component carries the credit line, and
 * it has to stay there — see `DowntownMap`.
 */

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");

/**
 * Two views, because downtown is two places.
 *
 * Five rooms and three garages sit inside three blocks; Central Library is
 * half a mile north of them. One frame holding both is 860 x 940 m — taller
 * than a laptop viewport, with six hundred metres of empty middle that is
 * real and useless. So the main map is the tight block and the library gets
 * an inset, which is what an atlas does with an island.
 */
const VIEWS = {
  DOWNTOWN: {
    pins: {
      tpr: [29.425941, -98.49713],
      rand: [29.426244, -98.4935],
      "city-tower": [29.426224, -98.494158],
      "st-marys": [29.42763, -98.491139],
      "houston-st": [29.425947, -98.491052],
      "legacy-park": [29.4263, -98.4947],
      // The partner venues — popups in lib/schedule, not the week's six —
      // that publish an address. Geocoded from OpenStreetMap (Nominatim) to
      // the house number. Alamo Angels' Merchant Ice Building is left off on
      // purpose: they have not given us an address to publish.
      "300-main": [29.427564, -98.493694],
      "centre-club": [29.4283812, -98.4923407],
      "san-pedro-ii": [29.4240727, -98.4966465],
    },
    // Wide, because this one has to fit above the fold on a laptop. San
    // Pedro II sits 250 m south-west of TPR and Centre Club a block north of
    // The Rand, which took the pins from 190 m tall to 480; the vertical
    // padding came down from 175 to 80 — past the outer pins it was a block
    // of empty street at each end — so the picture grew by a fifth rather
    // than by half.
    pad: { x: 150, y: 80 },
  },
  NORTH: {
    pins: {
      library: [29.432316, -98.492844],
      "library-garage": [29.431889, -98.492835],
    },
    // Wider than it needs for the streets: the two pins sit mid-frame and
    // their names are long, so the air is for the labels.
    pad: { x: 250, y: 150 },
  },
};
const TOLERANCE = 5;

/** The streets that get a name on the map, and the name they get. */
const LABELLED = {
  "West Houston Street": "Houston",
  "East Houston Street": "Houston",
  "West Commerce Street": "Commerce",
  "East Commerce Street": "Commerce",
  "North Flores Street": "Flores",
  "Soledad Street": "Soledad",
  "Navarro Street": "Navarro",
  "North Saint Mary's Street": "St Mary's",
  "East Travis Street": "Travis",
  "North Main Avenue": "Main",
  "Dolorosa Street": "Dolorosa",
  "North Santa Rosa Street": "Santa Rosa",
  "West Market Street": "Market",
  "College Street": "College",
  "Camaron Street": "Camaron",
};

const BBOX = "29.4225,-98.5005,29.4345,-98.4880";

async function overpass(query) {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    headers: { "User-Agent": "sastw-downtown-map/1.0" },
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  return (await res.json()).elements;
}

function geometryFor(PINS, PAD) {
  const lats = Object.values(PINS).map((p) => p[0]);
  const lons = Object.values(PINS).map((p) => p[1]);
  const lat0 = lats.reduce((a, b) => a + b) / lats.length;
  const lon0 = lons.reduce((a, b) => a + b) / lons.length;
  const mLat = 111320;
  const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const project = (lat, lon) => [(lon - lon0) * mLon, -(lat - lat0) * mLat];

  const xs = Object.values(PINS).map((p) => project(...p)[0]);
  const ys = Object.values(PINS).map((p) => project(...p)[1]);
  const X0 = Math.min(...xs) - PAD.x;
  const X1 = Math.max(...xs) + PAD.x;
  const Y0 = Math.min(...ys) - PAD.y;
  const Y1 = Math.max(...ys) + PAD.y;

  /** Keep the parts of a way inside the frame, splitting where it leaves. */
  const clip = (pts, slack = 60) => {
    const out = [];
    let run = [];
    for (const [x, y] of pts) {
      const inside =
        x >= X0 - slack &&
        x <= X1 + slack &&
        y >= Y0 - slack &&
        y <= Y1 + slack;
      if (inside) run.push([x, y]);
      else {
        if (run.length > 1) out.push(run);
        run = [];
      }
    }
    if (run.length > 1) out.push(run);
    return out;
  };

  /** Douglas–Peucker. */
  const rdp = (pts, eps) => {
    if (pts.length < 3) return pts;
    const [x1, y1] = pts[0];
    const [x2, y2] = pts[pts.length - 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const n = Math.hypot(dx, dy) || 1;
    let worst = 0;
    let idx = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const d = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n;
      if (d > worst) {
        worst = d;
        idx = i;
      }
    }
    if (worst <= eps) return [pts[0], pts[pts.length - 1]];
    return rdp(pts.slice(0, idx + 1), eps)
      .slice(0, -1)
      .concat(rdp(pts.slice(idx), eps));
  };

  const path = (pts) =>
    "M" + pts.map(([x, y]) => `${round(x)} ${round(y)}`).join("L");
  const round = (v) => Math.round(v * 10) / 10;

  return { lat0, lon0, mLat, mLon, project, X0, X1, Y0, Y1, clip, rdp, path };
}

const streets = await overpass(`
[out:json][timeout:60];
(way["highway"~"^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"]["name"](${BBOX}););
out geom;`);

const water = await overpass(`
[out:json][timeout:60];
(way["waterway"="river"](${BBOX}); way["water"="river"](${BBOX}); way["natural"="water"](${BBOX}););
out geom;`);

/** One view's worth of paths, labels and frame. */
function build(M) {
  const major = [];
  const minor = [];
  const runsByLabel = new Map();
  for (const w of streets) {
    const short = LABELLED[w.tags.name];
    for (const run of M.clip(w.geometry.map((g) => M.project(g.lat, g.lon)))) {
      const s = M.rdp(run, TOLERANCE);
      if (s.length < 2) continue;
      (short ? major : minor).push(M.path(s));
      if (!short) continue;
      const len = s
        .slice(1)
        .reduce((a, p, i) => a + Math.hypot(p[0] - s[i][0], p[1] - s[i][1]), 0);
      const best = runsByLabel.get(short);
      if (!best || len > best.len) runsByLabel.set(short, { len, pts: s });
    }
  }

  const rivers = [];
  for (const w of water) {
    const t = w.tags ?? {};
    const keep =
      t.name === "San Antonio River" ||
      t.name === "San Pedro Creek" ||
      t.waterway === "river";
    if (!keep) continue;
    for (const run of M.clip(
      (w.geometry ?? []).map((g) => M.project(g.lat, g.lon)),
    )) {
      const s = M.rdp(run, 4);
      if (s.length > 1) rivers.push(M.path(s));
    }
  }

  /** A label sits at the midpoint of its street's longest run, at its angle. */
  const labels = [];
  const minRun = Math.min(M.X1 - M.X0, M.Y1 - M.Y0) * 0.22;
  for (const [t, { len, pts }] of runsByLabel) {
    if (len < minRun) continue;
    let acc = 0;
    let a = pts[0];
    let b = pts[pts.length - 1];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(
        pts[i + 1][0] - pts[i][0],
        pts[i + 1][1] - pts[i][1],
      );
      if (acc + d >= len / 2) {
        a = pts[i];
        b = pts[i + 1];
        break;
      }
      acc += d;
    }
    const f =
      (len / 2 - acc) / Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 1e-6);
    let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    labels.push({
      t,
      x: Math.round((a[0] + (b[0] - a[0]) * f) * 10) / 10,
      y: Math.round((a[1] + (b[1] - a[1]) * f) * 10) / 10,
      a: Math.round(ang * 10) / 10,
    });
  }
  labels.sort((p, q) => p.t.localeCompare(q.t));
  const r = (v) => Math.round(v * 10) / 10;
  return {
    frame: [r(M.X0), r(M.Y0), r(M.X1 - M.X0), r(M.Y1 - M.Y0)],
    origin: {
      lat: Number(M.lat0.toFixed(6)),
      lon: Number(M.lon0.toFixed(6)),
      mLat: r(M.mLat),
      mLon: r(M.mLon),
    },
    major,
    minor,
    rivers,
    labels,
  };
}

const built = Object.fromEntries(
  Object.entries(VIEWS).map(([k, v]) => [k, build(geometryFor(v.pins, v.pad))]),
);

const view = (k) => `export const ${k}: MapView = ${JSON.stringify(built[k])};`;

const out = `/**
 * Downtown, drawn once and baked in.
 *
 * The map on /faq is an SVG of the blocks the week happens in, and this is its
 * geometry: street centrelines and the river, from OpenStreetMap, clipped to
 * each frame, simplified to ${TOLERANCE} m and projected to metres — so the
 * file is coordinates rather than a tile request.
 *
 * Baked rather than fetched for the reason the card tool bakes its bolt field:
 * a map that asks a tile server for twelve images is a third party on a page
 * whose job is to answer a question in one screen, it fails when that server
 * does, and it cannot be drawn in the week's own colours. A few KB of paths
 * can.
 *
 * Two views, because downtown is two places: the block the week happens in,
 * and Central Library half a mile north of it. One frame holding both was
 * taller than a laptop viewport with six hundred metres of empty middle.
 *
 * Generated by tools/downtown-map/bake.mjs — edit that, not this.
 *
 * OpenStreetMap data is ODbL: the credit line in DowntownMap is the licence's
 * condition, not decoration.
 */

export interface MapView {
  /** An SVG viewBox: x, y, width, height, all in metres. */
  frame: number[];
  origin: { lat: number; lon: number; mLat: number; mLon: number };
  /** The named streets this view labels — drawn a shade heavier. */
  major: string[];
  /** Everything else in frame, so the grid reads as a grid. */
  minor: string[];
  /** The San Antonio River and San Pedro Creek. */
  rivers: string[];
  /** Street names, at the midpoint of each street's longest run in frame. */
  labels: { t: string; x: number; y: number; a: number }[];
}

/** The three blocks with five rooms and three garages in them. */
${view("DOWNTOWN")}

/** Central Library and its garage, half a mile north. */
${view("NORTH")}

/**
 * Where a latitude and longitude land on a view.
 *
 * Equirectangular around the centroid of that view's pins, which over a
 * kilometre of downtown is within a metre of the truth — and it is the one
 * place lat/lon becomes x/y, so a pin added later lands where the streets say
 * it should.
 */
export function project(
  view: MapView,
  lat: number,
  lon: number,
): { x: number; y: number } {
  return {
    x: Math.round((lon - view.origin.lon) * view.origin.mLon * 10) / 10,
    y: Math.round(-(lat - view.origin.lat) * view.origin.mLat * 10) / 10,
  };
}
`;

await writeFile(join(REPO, "lib/downtown-map.ts"), out);
for (const [k, v] of Object.entries(built)) {
  console.log(
    `${k}: ${Math.round(v.frame[2])}x${Math.round(v.frame[3])} m · ` +
      `${v.major.length + v.minor.length} street runs · ${v.rivers.length} water · ${v.labels.length} labels`,
  );
}
console.log(`${(out.length / 1024).toFixed(1)} KB`);
