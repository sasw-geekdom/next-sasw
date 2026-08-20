"use client";

import * as React from "react";
import { TOOL_MARKS } from "@/lib/tool-marks";
import { cn } from "@/lib/utils";

// A little life inside two event rows, and only two.
//
// Startup Bash is the week's one Social activation and The Model is the one
// with mascots of its own, so they are the two that earn a flourish. Everything
// else on the grid stays still, which is what keeps this from reading as a page
// that fidgets.
//
// ── Why not WebGL ───────────────────────────────────────────────────────────
//
// ShaderCanvas renders one bolt silhouette — a colour flow clipped to a CSS
// mask — not a particle system, so confetti would have meant either a canvas
// per bolt or a new shader written from scratch. It would also have put a
// second WebGL context on a page that already runs one in the hero, and a
// browser silently drops the oldest context when it runs out, which would cost
// the hero its bolt to decorate a row.
//
// ── Why not the RAF simulation next door ────────────────────────────────────
//
// ModelMascots does run a real simulation, and has to: its mascots wander a
// whole band, spawn on click and steer. These live in a 90px row, follow a
// fixed path and never need to know where anything else is. A keyframe does
// that for none of the per-frame cost, and `motion-safe:` gates it without a
// line of script.
//
// ── The rule this deliberately sets aside ───────────────────────────────────
//
// model-mascots.tsx states the house rule: "Nothing moves until somebody
// clicks." These two rows are a considered exception, not an oversight. Both
// run on their own — the bolts continuously, the mascots after a one-time
// burst — because the two activations they belong to are the week's party and
// the week's AI afternoon, and a schedule that is still everywhere except
// those two says something true about them.
//
// It stays an exception because it stays contained: two rows out of nine,
// clipped to their own boxes, and both gone entirely under
// `prefers-reduced-motion`. Every other row on the grid is still.

/**
 * Fixed, not random.
 *
 * `Math.random()` at render gives the server one arrangement and the client
 * another, and React replaces the whole subtree on the mismatch. These are
 * hand-scattered instead: uneven enough to look unplanned, identical on both
 * sides of hydration.
 */
const BOLTS = [
  { left: "6%", size: 11, delay: "0ms", dur: "2600ms", drift: "14px", peak: 0.55 },
  { left: "19%", size: 8, delay: "420ms", dur: "3100ms", drift: "-10px", peak: 0.4 },
  { left: "31%", size: 13, delay: "180ms", dur: "2400ms", drift: "8px", peak: 0.6 },
  { left: "44%", size: 9, delay: "700ms", dur: "2900ms", drift: "-16px", peak: 0.45 },
  { left: "57%", size: 12, delay: "300ms", dur: "3300ms", drift: "12px", peak: 0.5 },
  { left: "69%", size: 8, delay: "900ms", dur: "2500ms", drift: "-8px", peak: 0.38 },
  { left: "81%", size: 14, delay: "540ms", dur: "2800ms", drift: "16px", peak: 0.58 },
  { left: "92%", size: 10, delay: "120ms", dur: "3000ms", drift: "-12px", peak: 0.42 },
] as const;

/**
 * Bolts rising through the row, always.
 *
 * A keyframe, unlike the mascots below, and that difference is the point: a
 * bolt rises, drifts and fades on a path decided in advance, and never has to
 * know where anything else is. No state, no listener, no script — eight
 * elements the compositor runs off the main thread. The row is
 * `overflow-hidden`, which is what clips them to the box.
 */
export function BoltDrift() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded"
    >
      {BOLTS.map((bolt, i) => (
        <span
          key={i}
          style={
            {
              left: bolt.left,
              width: bolt.size,
              height: bolt.size,
              "--drift": bolt.drift,
              "--peak": bolt.peak,
              "--spin-from": `${i % 2 ? -14 : 10}deg`,
              "--spin-to": `${i % 2 ? 16 : -12}deg`,
              animationDelay: bolt.delay,
              animationDuration: bolt.dur,
              // Masked rather than an <img> per bolt: eight requests for one
              // shape, and a mask takes `currentColor` so the magenta comes
              // from the class rather than from eight recoloured files.
              maskImage: "url(/brand/sastw-bolt.svg)",
              WebkitMaskImage: "url(/brand/sastw-bolt.svg)",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            } as React.CSSProperties
          }
          className={cn(
            "absolute bottom-0 bg-magenta opacity-0",
            "motion-safe:animate-[boltDrift_linear_infinite]",
          )}
        />
      ))}
    </span>
  );
}

/**
 * The five, and where each starts.
 *
 * Fixed rather than random: `Math.random()` at render gives the server one
 * arrangement and the client another, and React throws away the subtree on the
 * mismatch. The simulation randomises afterwards, on the client only, where it
 * cannot disagree with anything.
 *
 * `a` is the launch heading in radians, fanned right so they come out of the
 * wordmark into the box rather than into the border behind it. `rest` is where
 * each stands under reduced motion, spread by hand because a burst that cannot
 * animate would otherwise pile all five on one pixel.
 */
const MASCOTS = [
  { size: 22, a: -0.88, phase: 0.0, rest: [0.16, 0.34] },
  { size: 18, a: -0.32, phase: 1.3, rest: [0.31, 0.62] },
  { size: 20, a: 0.02, phase: 2.6, rest: [0.47, 0.28] },
  { size: 16, a: 0.4, phase: 3.9, rest: [0.62, 0.58] },
  { size: 19, a: 0.92, phase: 5.2, rest: [0.76, 0.4] },
] as const;

/**
 * Launch speed, px/sec.
 *
 * ModelMascots uses 460, which is right for a band six hundred pixels tall —
 * here it crossed the row before the eye caught it and read as a glitch rather
 * than a launch. 165 covers this box in about a second, which is what makes it
 * legible as a projection.
 */
const BURST = 190;

/**
 * Cruising speed, px/sec.
 *
 * Slow enough to read as a drift, fast enough to actually cross the row: at 26
 * they were still bunched in the left quarter after eight seconds, which is
 * milling about rather than living in the box.
 */
const WALK = 40;

/**
 * How quickly the launch bleeds off. Lower glides for longer.
 *
 * 1.9 spent the burst inside half a second and dumped them into the drift
 * almost immediately — the projection was over before it read as one.
 */
const DRAG = 1.3;

/** Half a mascot, so a sprite turns before any of it leaves the box. */
const PAD = 12;

/** Where they come out of — inside The Model's wordmark, vertically centred. */
const ORIGIN_X = 64;

interface Mascot {
  x: number;
  y: number;
  /** Heading, radians. */
  a: number;
  /** Current speed, px/sec — starts at BURST and decays toward WALK. */
  v: number;
  phase: number;
  el: HTMLSpanElement | null;
}

/**
 * A burst of Claude marks out of The Model's wordmark, then five of them
 * living in the row.
 *
 * A simulation rather than a keyframe, unlike the bolts above, and the reason
 * is bouncing. A keyframe follows a path written in advance; it can be shaped
 * to stay inside a box but it cannot *react* to one, so a mascot reaching an
 * edge either stops short of it or is clipped by it. Turning at a wall means
 * knowing where the wall is and what the heading was, which is a per-frame
 * calculation and nothing else.
 *
 * Ported from model-mascots.tsx rather than reinvented — the reflection, the
 * decaying launch, the capped delta and the meander suppression while the
 * burst is hot are all its solutions to problems this has too. What differs is
 * scale: that band is six hundred pixels tall and this row is ninety, so the
 * speeds come down by roughly a third and the padding to half.
 *
 * `TOOL_MARKS.claudecode` and `--model-lavender` are the same mark and ink the
 * band uses, so this reads as a smaller echo of that easter egg.
 */
export function MascotBurst() {
  const layer = React.useRef<HTMLSpanElement>(null);
  const mascots = React.useRef<Mascot[]>([]);
  const raf = React.useRef(0);
  const [fired, setFired] = React.useState(false);
  const done = React.useRef(false);

  // Fire once, when most of the row is on screen — a burst that goes off one
  // pixel into view happens where nobody is looking.
  React.useEffect(() => {
    const node = layer.current;
    if (!node || done.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          setFired(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!fired) return;
    const el = layer.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bounds = el.getBoundingClientRect();
    const remeasure = () => {
      bounds = el.getBoundingClientRect();
    };
    window.addEventListener("resize", remeasure);

    mascots.current = MASCOTS.map((seed) => ({
      x: still ? seed.rest[0] * bounds.width : ORIGIN_X,
      y: still ? seed.rest[1] * bounds.height : bounds.height / 2,
      a: seed.a,
      v: BURST,
      phase: seed.phase,
      el: mascots.current[MASCOTS.indexOf(seed)]?.el ?? null,
    }));

    // Placed once and left alone. The loop below never starts.
    if (still) {
      for (const m of mascots.current) {
        if (m.el) m.el.style.transform = `translate(-50%,-50%) translate(${m.x}px,${m.y}px)`;
      }
      return () => window.removeEventListener("resize", remeasure);
    }

    // Paused while the row is off screen. Five sprites is cheap, but a loop
    // running for a row nobody is looking at is cheaper still not to run.
    let visible = true;
    const vis = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    vis.observe(el);

    let last = 0;
    const tick = (now: number) => {
      raf.current = requestAnimationFrame(tick);
      // Capped, so a backgrounded tab does not resume with one enormous step
      // that flings everything into a wall.
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!visible) return;

      for (const m of mascots.current) {
        if (!m.el) continue;
        // Ease the launch down to a drift rather than cutting to it.
        m.v += (WALK - m.v) * Math.min(DRAG * dt, 1);
        // A small random turn each frame, so the path meanders instead of
        // running dead straight into an edge. Suppressed while the burst is
        // still hot, or the shot out of the wordmark looks drunk.
        // Scaled by dt, unlike model-mascots.tsx, which turns by a fixed
        // amount every frame — at 60fps that is ±9 radians a second, and in a
        // band six hundred pixels tall it reads as character. In a 90px row it
        // is a random walk that never gets anywhere: they jittered in place
        // instead of crossing. ±0.6 rad/sec meanders without erasing the
        // heading.
        if (m.v < WALK * 2) m.a += (Math.random() - 0.5) * 1.2 * dt;
        m.x += Math.cos(m.a) * m.v * dt;
        m.y += Math.sin(m.a) * m.v * dt;

        // Reflect off the walls rather than clamp against them — a clamp
        // leaves them pressed into a corner for as long as the heading points
        // that way, which is the "cut off by the wall" this replaces.
        if (m.x < PAD) {
          m.a = Math.PI - m.a;
          m.x = PAD;
        } else if (m.x > bounds.width - PAD) {
          m.a = Math.PI - m.a;
          m.x = bounds.width - PAD;
        }
        if (m.y < PAD) {
          m.a = -m.a;
          m.y = PAD;
        } else if (m.y > bounds.height - PAD) {
          m.a = -m.a;
          m.y = bounds.height - PAD;
        }

        m.phase += dt * 7;
        const bob = Math.sin(m.phase) * 1.6;
        const facing = Math.cos(m.a) < 0 ? -1 : 1;
        m.el.style.transform = `translate(-50%,-50%) translate(${m.x.toFixed(1)}px,${(m.y + bob).toFixed(1)}px) scaleX(${facing})`;
      }
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      vis.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [fired]);

  const mark = TOOL_MARKS.claudecode;

  return (
    <span
      ref={layer}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded"
    >
      {fired &&
        MASCOTS.map((seed, i) => (
          <span
            key={i}
            ref={(node) => {
              const m = mascots.current[i];
              if (m) m.el = node;
            }}
            style={{
              width: seed.size,
              height: seed.size,
              // Placed for the very first paint. The effect runs after the
              // browser paints, so without this each mascot is visible at the
              // layer's top-left for one frame before the loop moves it.
              transform: `translate(-50%,-50%) translate(${ORIGIN_X}px,50%)`,
            }}
            className="absolute left-0 top-0"
          >
            {/* The pop is on its own element, and has to stay there.
                `modelPop` animates the standalone `scale` property, which CSS
                applies *before* `transform` — on the same element, scale(0.4)
                would multiply the loop's translation too and every mascot
                would launch from the wrong place. Nested, it has only itself
                to act on. The same trap model-mascots.tsx documents. */}
            <span className="block h-full w-full text-(--model-lavender) drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] motion-safe:animate-[modelPop_320ms_ease-out]">
              <svg
                viewBox={mark.viewBox}
                fill="currentColor"
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: mark.inner }}
              />
            </span>
          </span>
        ))}
    </span>
  );
}
