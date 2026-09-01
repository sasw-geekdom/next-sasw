"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ACCESS_GREEN } from "@/lib/access-granted";
import { PYSA } from "@/lib/pysa";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { TOOL_MARKS } from "@/lib/tool-marks";
import { cn } from "@/lib/utils";

// A little life inside three event blocks, and only three.
//
// Startup Bash is the week's one Social activation and The Model is the one
// with mascots of its own, so they are the two that earn a flourish.
// PySanAntonio has a mascot of its own too, and a five-hour block with a lot
// of empty middle to put him in. Everything else on the grid stays still,
// which is what keeps this from reading as a page that fidgets.
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
  {
    left: "6%",
    size: 11,
    delay: "0ms",
    dur: "2600ms",
    drift: "14px",
    peak: 0.55,
  },
  {
    left: "19%",
    size: 8,
    delay: "420ms",
    dur: "3100ms",
    drift: "-10px",
    peak: 0.4,
  },
  {
    left: "31%",
    size: 13,
    delay: "180ms",
    dur: "2400ms",
    drift: "8px",
    peak: 0.6,
  },
  {
    left: "44%",
    size: 9,
    delay: "700ms",
    dur: "2900ms",
    drift: "-16px",
    peak: 0.45,
  },
  {
    left: "57%",
    size: 12,
    delay: "300ms",
    dur: "3300ms",
    drift: "12px",
    peak: 0.5,
  },
  {
    left: "69%",
    size: 8,
    delay: "900ms",
    dur: "2500ms",
    drift: "-8px",
    peak: 0.38,
  },
  {
    left: "81%",
    size: 14,
    delay: "540ms",
    dur: "2800ms",
    drift: "16px",
    peak: 0.58,
  },
  {
    left: "92%",
    size: 10,
    delay: "120ms",
    dur: "3000ms",
    drift: "-12px",
    peak: 0.42,
  },
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
      data-particles=""
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
  /**
   * The sprite nodes, kept beside the simulation rather than inside it.
   *
   * They used to be a field on each Mascot, and the ref callback looked the
   * mascot up to assign it: `const m = mascots.current[i]; if (m) m.el = node`.
   * That runs during commit, and `mascots.current` is not built until the
   * effect below — which runs *after* commit. So on the pass where `fired`
   * flips true every lookup missed, the effect then created five mascots with
   * `el: null`, and the loop skipped all five forever. The sprites sat on
   * their initial inline transform at the layer's top-left.
   *
   * It only ever worked by accident: any later re-render re-runs these inline
   * ref callbacks, and by then the array exists. React's StrictMode gives you
   * that extra render in development for free, which is exactly why this was
   * invisible until it hit production.
   *
   * Indexed by position, so the callback needs nothing to exist first.
   */
  const els = React.useRef<(HTMLSpanElement | null)[]>([]);
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
    }));

    // Placed once and left alone. The loop below never starts.
    if (still) {
      mascots.current.forEach((m, i) => {
        const el = els.current[i];
        if (el)
          el.style.transform = `translate(-50%,-50%) translate(${m.x}px,${m.y}px)`;
      });
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

      for (let i = 0; i < mascots.current.length; i++) {
        const m = mascots.current[i];
        const el = els.current[i];
        if (!el) continue;
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
        el.style.transform = `translate(-50%,-50%) translate(${m.x.toFixed(1)}px,${(m.y + bob).toFixed(1)}px) scaleX(${facing})`;
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
      data-particles=""
      className="pointer-events-none absolute inset-0 overflow-hidden rounded"
    >
      {fired &&
        MASCOTS.map((seed, i) => (
          <span
            key={i}
            ref={(node) => {
              els.current[i] = node;
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

/**
 * PySanAntonio's mariachi, standing in the empty middle of his own block.
 *
 * A still in the week view, the loop in the day view — `animated` picks.
 *
 * Not `motion`: this module imports `motion/react` under that name, and a prop
 * called `motion` would shadow it inside this component.
 *
 * The week keeps the still on the original reasoning: `PYSA.video` is already
 * on /schedule for the band, so a second `<video>` costs no download, but it
 * costs a second decode of a 1114x720 clip inside a cell 224px wide, and the
 * other two flourishes on that grid are cheap by construction (CSS keyframes,
 * and a handful of sprites on one RAF).
 *
 * The day view is not that cell and the band is not on that page. There is one
 * PySA block on 2026-10-02, it is roughly 1016x495, and nothing else on the
 * route decodes anything — so the argument that kept the still here does not
 * reach it, and at that size a frozen frame is the weaker picture.
 *
 * The plate carries its own feathered alpha rather than a CSS mask. The frame
 * is a studio shot on near-black and the block's ground is PySA blue at 10%
 * over black — close, but not the same, so an unfeathered rectangle showed its
 * edge. Baking the fade into the file means it composites the same way
 * wherever it is drawn, including the day view where the block is twice as
 * tall.
 *
 * Sized as a percentage of the block, not in pixels, for that same reason: the
 * week draws this block 300px tall and the day view 660.
 */
export function PysaMascot({ animated = false }: { animated?: boolean }) {
  const reduce = useReducedMotion();
  const clip = React.useRef<HTMLVideoElement>(null);

  // `autoPlay` is an initial-render attribute, and `useReducedMotion` returns
  // `false` on the server and the first client render before it returns the
  // truth. So a reader who asks for reduced motion gets `autoPlay` on the
  // frame that matters, the clip starts, and React flipping the attribute
  // afterwards does not stop it — measured under Playwright's `reduce`
  // emulation, the video was still playing. Drive the element instead.
  React.useEffect(() => {
    const v = clip.current;
    if (!v) return;
    if (reduce) {
      v.pause();
      v.currentTime = 0;
    } else {
      void v.play().catch(() => {});
    }
  }, [reduce, animated]);
  return (
    <div
      aria-hidden="true"
      data-particles=""
      // Lifted clear of the meta rows rather than laid behind them. Sitting on
      // the block's floor, the guitar's body ran under "TECH & BUILDERS" and
      // the strand lost its contrast against a bright blue soundboard. 36px is
      // the two rows plus their leading, so the type keeps the plain ground it
      // is legible on and he stands on top of it.
      //
      // Keyed against the block, on the wrapper so the still and the clip are
      // composited the same way.
      //
      // The plate carries feathered alpha, but only at its edges — inside the
      // feather it is opaque studio black, tone-matched to the block's resting
      // ground. That held exactly as long as the ground held still. The block
      // paints its hover as an accent layer *under* the flourishes, so on
      // hover the ground lifted to rgb(17,33,50) while the plate stayed at
      // rgb(14,26,40) and the mascot appeared to be standing on a dark square.
      //
      // `lighten` takes the per-channel max, so the plate's black resolves to
      // whatever the block is currently painting — matched at rest, matched on
      // hover, and matched again if the accent ever changes. The mascot is the
      // bright half of a high-contrast studio shot and passes through.
      style={{ mixBlendMode: "lighten" }}
      className="pointer-events-none absolute inset-x-0 bottom-9 top-0 flex items-end justify-center overflow-hidden rounded"
    >
      {animated ? (
        <video
          ref={clip}
          src={PYSA.video}
          // The plate, not the clip's own first frame: it is what shows before
          // metadata lands and on reduced motion, and it is already the right
          // crop and already feathered.
          poster="/pysa/mascot-block.webp"
          autoPlay={!reduce}
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          // Cropped to the man, not letterboxed. The clip is 1114x720 of which
          // he occupies about 610x690 centred at 56% across — drawn whole in a
          // portrait box he would be a third the height of the still he
          // replaces, with black bars for the rest. `object-cover` against an
          // aspect close to his own bounding box scales him to fill it and
          // throws away the empty studio either side.
          //
          // Keyed, then feathered. The still carries alpha in its own file; a
          // video cannot, so the clip arrives as a rectangle of studio black
          // over the block's PySA-blue ground — measured, rgb(12,13,14) inside
          // against rgb(8,15,22) outside. Four points of red and eight of blue
          // is close enough to look like a mistake and far enough to draw a
          // box, and no amount of masking fixes a tone difference in the
          // middle of the shot.
          //
          // The `lighten` that resolves it is on the wrapper, which composites
          // the still and the clip as one group — see the note there. It does
          // lift his suit slightly toward the ground colour; against a ground
          // this dark that costs a couple of points on an area that was
          // already near-black.
          //
          // The ellipse stays here rather than moving up: it is the clip's
          // problem alone, for the corners where `object-cover` can put a lit
          // edge of studio floor against the block's border. The plate has its
          // own alpha and needs none.
          style={{
            maskImage:
              "radial-gradient(ellipse 78% 88% at 50% 46%, #000 52%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 78% 88% at 50% 46%, #000 52%, transparent 100%)",
          }}
          // 74% of the wrapper rather than the still's flat 190px ceiling.
          //
          // That cap exists to draw the mascot the same size in the week and
          // the day, which is the right call for a still standing in a 224px
          // lane. It is the wrong one here: this block is roughly 1016x495 and
          // 190px left him a stamp in the middle of it.
          //
          // A percentage and not a second pixel number, because the wrapper is
          // the block minus its meta rows and a percentage tracks that on its
          // own. 74% leaves the lockup above him its full height at every
          // block size instead of only at this one. Height also happens to be
          // the axis a second venue column cannot touch — Launch SA joining
          // this day narrows The Rand's column, and a width-led size would
          // have had to be re-picked when it did.
          className="aspect-[61/69] h-full max-h-[74%] w-auto rounded object-cover [object-position:56%_50%]"
        />
      ) : (
        <Image
          src="/pysa/mascot-block.webp"
          alt=""
          width={420}
          height={441}
          // Sized by height against a capped ceiling, not by the block's width.
          // Width-led sizing made him a function of the column: 166px in the
          // week, where that is most of the block, and the same 166 in the day
          // view where the block is 1175px across and he read as a stamp
          // floating in it. A height cap draws him the same size in both, which
          // is the thing a mascot should be.
          //
          // Bottom-anchored by the wrapper's flex rather than by his own box, so
          // he stands on the meta rows whatever height is left above him.
          className="h-full max-h-[190px] w-auto object-contain opacity-90 motion-safe:animate-[pysaSway_7s_ease-in-out_infinite]"
        />
      )}
    </div>
  );
}

/**
 * The board inside Open Circuit's block, in a 320×120 space that gets sliced.
 *
 * Short runs with 45° elbows and pads, which is the vocabulary of the
 * activation's own mark. Every one enters off the right edge on purpose: a
 * trace that starts and stops inside the box reads as a squiggle, one that
 * runs off the edge reads as a board the block is a window onto.
 *
 * All of it lives in the right half. The first cut ran the routing across the
 * full width, which put copper behind the mark and behind the time row and
 * made the block busy — the type is the content, and a board underneath it is
 * texture competing with the thing it is supposed to be decorating. Here the
 * traces stop before they reach the type, and the mask below dissolves
 * anything that gets close, so the left half of every block stays clean
 * ground for "OPEN CIRCUIT" and "5 – 6 PM · THE RAND" to sit on.
 *
 * `pathLength={100}` normalises every path to 100 units, so `lit` below is a
 * literal [start, length] percentage of its trace regardless of how long the
 * trace actually is.
 */
/** Keeps the board off the type, at any lane width. */
const MASK =
  "linear-gradient(90deg, transparent 0%, transparent 30%, rgba(0,0,0,0.55) 52%, #000 72%, #000 100%)";

const CIRCUIT = [
  { d: "M 340 24 H 268 l -22 22 H 186", lit: [8, 16] },
  { d: "M 340 60 H 262 l -22 -22 H 224", lit: [55, 18] },
  { d: "M 340 96 H 292 l -22 -22 H 236 l -22 22 H 196", lit: [26, 14] },
  { d: "M 300 -12 V 32 l 22 22 V 132", lit: [62, 15] },
] as const;

/** Terminals, off the runs above. Filled pads and one hollow via. */
const PADS = [
  { x: 186, y: 46, r: 3.4, fill: true },
  { x: 224, y: 38, r: 3, fill: false },
  { x: 196, y: 96, r: 3.4, fill: true },
] as const;

/**
 * A circuit under Open Circuit's block, with current in it.
 *
 * The one activation on the grid whose mark cannot be drawn in a one-hour
 * block — 1.65:1 against a 20px height cap is 33px of unreadable smudge — so
 * the block falls back to type, and type alone left it the flattest rectangle
 * on a Thursday that has a penguin and a bolt storm on it. This gives it the
 * subject of its own name instead.
 *
 * Drawn only where the lockup is *not*, which the caller decides and passes
 * in. That restriction is the whole lesson from the version of this that went
 * behind the hero mark and was thrown away: the logo already contains circuit
 * traces, and a second set around it at a different weight reads as the logo
 * being blurred. There is no such clash here, because in these blocks the logo
 * is not on screen at all.
 *
 * Keyframes, like BoltDrift and for the same reasons — three paths the
 * compositor runs off the main thread, no state, no listener, nothing to
 * hydrate. The block's own `overflow-hidden` is what clips them.
 */
export function CircuitTrace() {
  return (
    <span
      aria-hidden="true"
      data-particles=""
      className="pointer-events-none absolute inset-0 overflow-hidden rounded text-magenta"
      // Dissolves the board toward the type rather than ending it on a cut.
      // The routing already stops short, but a block narrower than Thursday's
      // lane crops differently, and this guarantees the left side stays clear
      // whatever width the lane turns out to be.
      style={{
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    >
      <svg
        viewBox="0 0 320 120"
        // Sliced, so the routing keeps its 45° angles at any block shape and
        // the box crops it. `none` would stretch the elbows to whatever the
        // block's aspect happens to be, and a 45° elbow drawn at 20° is not a
        // circuit trace, it is a wobble.
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeOpacity={0.22}
          strokeLinejoin="round"
        >
          {CIRCUIT.map((t) => (
            <path key={t.d} d={t.d} />
          ))}
        </g>

        <g stroke="currentColor" strokeWidth={1.4}>
          {PADS.map((p) => (
            <circle
              key={`${p.x},${p.y}`}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={p.fill ? "currentColor" : "none"}
              fillOpacity={0.3}
              strokeOpacity={p.fill ? 0 : 0.28}
            />
          ))}
        </g>

        {/* A lit run on each trace, and it does not move.
          
          It used to: a pulse travelling each trace on its own duration, which
          is what "current" wants to be. It came out at the wrong volume. The
          note at the top of this file sets the grid's rule — two rows carry
          motion and the other seven are still — and a third moving block on a
          Thursday that already has Startup Bash's bolts and The Model's
          mascots on it made the schedule busy rather than alive. Three moving
          things is not one more than two; it is the point where a reader stops
          being drawn to any of them.

          Still, the lit run is still worth having: it is what stops the board
          reading as a texture and makes it read as a circuit with something in
          it. `lit` is [start, length] as a percentage of the trace, which is
          what `pathLength={100}` buys — offsets chosen so the three do not
          line up in a column, since a still highlight that repeats at the same
          x on every row reads as a rendering artefact rather than as design.

          Kept inside the visible band as well as the visible half. The viewBox
          is sliced, so a 60px block shows roughly y 15-105 of the 120 authored
          — an offset that lands a highlight at y 4 is not subtle, it is
          absent. */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeOpacity={0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {CIRCUIT.map((t) => (
            <path
              key={t.d}
              d={t.d}
              pathLength={100}
              strokeDasharray={`${t.lit[1]} 100`}
              strokeDashoffset={-t.lit[0]}
            />
          ))}
        </g>
      </svg>
    </span>
  );
}

// ─── Access Granted ─────────────────────────────────────────────────────────

/** The ciphertext's own alphabet, the same one the band's field uses. */
const CIPHER_ALPHABET =
  "ABCDEF0123456789abcdef!<>/\\|=+*#$%&?^~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** 7px mono at 1.35 leading — the metrics the fill count is derived from. */
const CIPHER_SIZE = 7;
const CIPHER_CHAR_W = CIPHER_SIZE * 0.6;
const CIPHER_LINE_H = CIPHER_SIZE * 1.35;
/** A ceiling, so a full-width agenda row cannot ask for a novel. */
const CIPHER_MAX = 8000;

/**
 * How wide the beam is.
 *
 * The band on the activation's own page uses 190px against a field over a
 * thousand pixels tall. These are much smaller surfaces — a five-hour week
 * block is 143x294 and an agenda row is 83px high — and a 190px circle on
 * either is not a spotlight, it is the whole box lit at once. 72 reads as a
 * beam on both: about a quarter of the block's height, and a little under the
 * full height of a row.
 */
const CIPHER_BEAM = 72;

function scrambleCipher(n: number) {
  let out = "";
  for (let i = 0; i < n; i++)
    out += CIPHER_ALPHABET.charAt(
      Math.floor(Math.random() * CIPHER_ALPHABET.length),
    );
  return out;
}

/**
 * Access Granted's ciphertext, decrypted under the cursor.
 *
 * The band on the activation's own page hides a field of characters behind the
 * padlock and lets a pointer read a patch of it. This is that, at block scale,
 * on the two surfaces where the activation has a box of its own: the week and
 * day axis, and the agenda row. On an activation about lockpicking, a beam that
 * decrypts a patch of noise is the subject rather than an effect borrowed from
 * somewhere else.
 *
 * ─── What it costs ──────────────────────────────────────────────────────────
 *
 * Nothing until a pointer arrives. The characters are written straight to a ref
 * on a ~11fps timer, never through React state, and the pointer only ever
 * writes to motion values, which by design do not re-render. So neither this
 * component nor the block around it re-renders while the beam moves — the same
 * two tricks the band uses, for the same reason. The timer is created on enter
 * and cleared on leave; a schedule sitting open costs one listener pair.
 *
 * ─── Why it listens on the block rather than on itself ──────────────────────
 *
 * It cannot hear its own pointer events. Every figure here renders before the
 * block's link, whose stretched `::after` covers the whole box, and among
 * positioned siblings the later one paints on top — which is exactly what makes
 * the whole block clickable. So the pointer never reaches this layer, and the
 * listeners go on the parent instead. The parent is also the box the beam is
 * measured against, which is the same box this layer fills.
 *
 * Reduced motion keeps the beam and drops the scramble: the field is written
 * once and holds still, so the spotlight becomes a plain reveal. Touch never
 * sees it at all — `pointerenter` does fire on a tap, so the hover query is
 * what keeps a phone from being given an effect it cannot dismiss.
 */
export function CipherField() {
  const host = React.useRef<HTMLSpanElement>(null);
  const text = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<number | null>(null);
  const count = React.useRef(0);
  const [lit, setLit] = React.useState(false);

  // Parked off-box until a pointer arrives, so the first frame after `lit`
  // turns on never flashes a beam at the top-left corner.
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const mask = useMotionTemplate`radial-gradient(${CIPHER_BEAM}px circle at ${x}px ${y}px, #000 0%, rgba(0,0,0,0.65) 55%, transparent 78%)`;

  React.useEffect(() => {
    const el = host.current;
    const block = el?.parentElement;
    if (!el || !block) return;

    if (!window.matchMedia("(hover: hover)").matches) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fill = () => {
      const box = el.getBoundingClientRect();
      if (!text.current || !box.width) return;
      count.current = Math.min(
        CIPHER_MAX,
        Math.ceil(
          (box.width / CIPHER_CHAR_W) * (box.height / CIPHER_LINE_H) * 1.15,
        ),
      );
      text.current.textContent = scrambleCipher(count.current);
    };

    const stop = () => {
      if (timer.current !== null) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      x.set(e.clientX - box.left);
      y.set(e.clientY - box.top);
    };

    const enter = (e: PointerEvent) => {
      fill();
      move(e);
      setLit(true);
      if (still || timer.current !== null) return;
      timer.current = window.setInterval(() => {
        if (text.current)
          text.current.textContent = scrambleCipher(count.current);
      }, 90);
    };

    const leave = () => {
      setLit(false);
      stop();
      x.set(-9999);
      y.set(-9999);
    };

    block.addEventListener("pointerenter", enter);
    block.addEventListener("pointermove", move);
    block.addEventListener("pointerleave", leave);
    return () => {
      block.removeEventListener("pointerenter", enter);
      block.removeEventListener("pointermove", move);
      block.removeEventListener("pointerleave", leave);
      stop();
    };
  }, [x, y]);

  return (
    <motion.span
      ref={host}
      aria-hidden="true"
      data-particles=""
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded transition-opacity duration-300",
        lit ? "opacity-100" : "opacity-0",
      )}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <span
        ref={text}
        className="absolute inset-0 break-all p-1 font-mono text-[7px] leading-[1.35] font-medium whitespace-pre-wrap"
        // Dimmer than the band's field, which has only artwork behind it.
        // A block has type in it, and the beam crosses that type wherever the
        // cursor goes — at the band's weight the ciphertext competed with
        // "1 – 6 PM · THE RAND" instead of running under it.
        style={{ color: `${ACCESS_GREEN}9c` }}
      />
    </motion.span>
  );
}
