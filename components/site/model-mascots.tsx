"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { TOOL_MARKS } from "@/lib/tool-marks";

// Click the Claude Code node in The Model's hero graph and a mascot shoots out
// of it and wanders. Click again and another joins it.
//
// ── Why this lives above the artwork rather than inside it ──────────────────
//
// They roam the whole band — across the copy column, behind the wordmark, out
// to the bleed edge — so the layer that holds them has to be the section, not
// the graph's own canvas. The graph is a client component nested several levels
// down inside a server one, so it reaches this through context rather than
// through props threaded past a server boundary.
//
// The provider renders its children untouched and adds one absolutely
// positioned layer over the top. `ModelBand`'s section is the positioned
// ancestor, which is what makes `inset-0` mean "the whole band".
//
// ── The rules it keeps ──────────────────────────────────────────────────────
//
// Nothing moves until somebody clicks — the same rule the rest of this hero
// follows, which is why an easter egg can exist here at all after three rounds
// of cutting ambient motion. Reduced motion still spawns them; they just stand
// where they land, because the feature is a response to a click rather than an
// animation playing at a reader.

/** How many the band will hold. Past this a click is ignored. */
const MAX = 12;

/** Cruising speed, px/sec. Slow enough to read as a walk. */
const WALK = 52;

/** Launch speed, px/sec — the "shoots out" part. Decays to WALK. */
const BURST = 460;

/** How quickly the burst bleeds off. Higher settles sooner. */
const DRAG = 3.4;

interface Mascot {
  id: number;
  x: number;
  y: number;
  /** Heading, radians. */
  a: number;
  /** Current speed, px/sec — starts at BURST and decays toward WALK. */
  v: number;
  /** Offset into the bob cycle, so they don't bounce in step. */
  phase: number;
  el: HTMLDivElement | null;
}

type Spawn = (from: DOMRect) => void;

const MascotContext = createContext<Spawn | null>(null);

/** Null outside the provider, so the graph can render anywhere. */
export function useMascots() {
  return useContext(MascotContext);
}

export function ModelMascots({ children }: { children: React.ReactNode }) {
  const layer = useRef<HTMLDivElement>(null);
  const mascots = useRef<Mascot[]>([]);
  /**
   * Spawn positions, in state.
   *
   * The simulation lives in `mascots` — a ref, because it is rewritten sixty
   * times a second and none of it should re-render anything. But the *initial*
   * position has to be readable at render time to place each mascot on its
   * first paint, and reading a ref during render is both a lint error and a
   * correctness trap. So the launch point is duplicated here, where it is
   * written once per click and never again.
   */
  const [seeds, setSeeds] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );
  const raf = useRef(0);

  const spawn = useCallback<Spawn>((from) => {
    const el = layer.current;
    if (!el || mascots.current.length >= MAX) return;
    const box = el.getBoundingClientRect();

    // They come out of the wordmark, not the node that was clicked.
    //
    // That started as an accident — the first paint landed every mascot at the
    // layer's origin before the animation loop moved it, which is the top-left
    // of the band and reads as "out of THE MODEL". It looked better than the
    // intent, so it is the intent now: they burst from the name and scatter
    // across the section, which is a stronger image than leaking out of one
    // small card in a diagram.
    //
    // Found by attribute rather than passed in, because the wordmark lives in
    // `ModelBand` — a server component, which cannot hold a ref. Measured live
    // on every click, so it lands on the same glyphs at every breakpoint
    // regardless of where the stacked layout puts them.
    // `closest("section")` rather than `parentElement`: the layer is a direct
    // child of the band's section today, and a single wrapper added anywhere
    // between them would break a parent lookup silently — the mascots would
    // fall back to the click point with nothing to show it had happened.
    const origin =
      el.closest("section")?.querySelector("[data-mascot-origin]") ??
      document.querySelector("[data-mascot-origin]");
    const rect = origin ? origin.getBoundingClientRect() : from;
    const x = rect.left + rect.width / 2 - box.left;
    const y = rect.top + rect.height / 2 - box.top;
    mascots.current.push({
      id: Date.now() + mascots.current.length,
      x,
      y,
      // Any direction, so a dozen clicks scatter rather than forming a queue.
      a: Math.random() * Math.PI * 2,
      v: BURST,
      phase: Math.random() * Math.PI * 2,
      el: null,
    });
    setSeeds(mascots.current.map((m) => ({ id: m.id, x: m.x, y: m.y })));
  }, []);

  useEffect(() => {
    if (seeds.length === 0) return;
    const el = layer.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bounds = el.getBoundingClientRect();
    const remeasure = () => {
      bounds = el.getBoundingClientRect();
    };
    window.addEventListener("resize", remeasure);

    let last = 0;
    const tick = (now: number) => {
      raf.current = requestAnimationFrame(tick);
      // Capped, so a backgrounded tab does not resume with one enormous step
      // that flings everything into a wall.
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      for (const m of mascots.current) {
        if (!m.el) continue;
        if (!still) {
          // Ease the launch down to a walk rather than cutting to it.
          m.v += (WALK - m.v) * Math.min(DRAG * dt, 1);
          // A small random turn each frame, so the path meanders instead of
          // running dead straight until it hits an edge. Suppressed while the
          // burst is still hot, or the shot out of the box looks drunk.
          if (m.v < WALK * 2) m.a += (Math.random() - 0.5) * 0.3;
          m.x += Math.cos(m.a) * m.v * dt;
          m.y += Math.sin(m.a) * m.v * dt;
          // Turn back at the edges rather than clamping, or they pile into the
          // corners and stay there.
          const pad = 18;
          if (m.x < pad || m.x > bounds.width - pad) {
            m.a = Math.PI - m.a;
            m.x = Math.min(Math.max(m.x, pad), bounds.width - pad);
          }
          if (m.y < pad || m.y > bounds.height - pad) {
            m.a = -m.a;
            m.y = Math.min(Math.max(m.y, pad), bounds.height - pad);
          }
          m.phase += dt * 9;
        }
        const bob = still ? 0 : Math.sin(m.phase) * 2;
        const facing = Math.cos(m.a) < 0 ? -1 : 1;
        m.el.style.transform = `translate(-50%, -50%) translate(${m.x.toFixed(1)}px, ${(m.y + bob).toFixed(1)}px) scaleX(${facing})`;
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", remeasure);
    };
  }, [seeds.length]);

  const mark = TOOL_MARKS.claudecode;

  return (
    <MascotContext.Provider value={spawn}>
      {children}
      {/* Over the whole band and above everything in it, so they walk across
          the copy as readily as the graph. `pointer-events-none` — they are
          scenery, and a moving click target would make the node underneath
          them hard to hit again. */}
      <div
        ref={layer}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      >
        {seeds.map((seed, i) => (
          <div
            key={seed.id}
            ref={(node) => {
              const m = mascots.current[i];
              if (m) m.el = node;
            }}
            // Positioned inline for the very first paint. `useEffect` runs
            // after the browser paints, so without this each mascot is visible
            // at the layer's top-left corner for one frame before the loop
            // moves it — a flash that reads as it appearing in the wrong place.
            style={{
              transform: `translate(-50%, -50%) translate(${seed.x.toFixed(1)}px, ${seed.y.toFixed(1)}px)`,
            }}
            className="absolute left-0 top-0 h-7 w-7"
          >
            {/*
              The pop is on its own element, and has to stay there.

              `modelPop` animates the standalone `scale` property, and CSS
              applies `translate`/`rotate`/`scale` *before* `transform` — the
              used matrix is scale × transform, not the other way round. On the
              same element as the positioning transform, `scale(0.4)` therefore
              multiplies the translation as well as the glyph: a mascot bound
              for (x, y) renders at 0.4 of that offset from the layer's
              top-left, then slides out to its real spot as the pop finishes.
              It read as every mascot launching from the black above the
              eyebrow rather than from the wordmark. Nested, the scale has
              nothing but itself to act on.
            */}
            <div className="h-full w-full text-(--model-lavender) drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] motion-safe:animate-[modelPop_320ms_ease-out]">
              <svg
                viewBox={mark.viewBox}
                fill="currentColor"
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: mark.inner }}
              />
            </div>
          </div>
        ))}
      </div>
    </MascotContext.Provider>
  );
}
