"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AudioLines, Film, ImageIcon, Type } from "lucide-react";
import {
  FLOW_EDGES,
  FLOW_NODES,
  FLOW_PATH,
  FLOW_PORT_R,
  FLOW_WIRE,
  FLOW_EDGE_SIDES,
  type FlowNode,
  type Side,
} from "@/lib/the-model-flow";
import {
  MODEL_BLUE,
  MODEL_CYAN,
  MODEL_LAVENDER,
  MODEL_LAVENDER_LIT,
} from "@/lib/the-model";
import { TOOL_MARKS } from "@/lib/tool-marks";
import { useMascots } from "@/components/site/model-mascots";
import { cn } from "@/lib/utils";

// The Model's hero as a node graph — see the header of lib/the-model-flow.ts
// for why this shape, and why it is only four nodes.
//
// ── The pointer walks the graph ─────────────────────────────────────────────
//
// One continuous gesture from the inputs, through the model, to the output, and
// each node switches on as the pointer reaches it. Nothing wipes and nothing
// fades halfway: `--step` is a whole number, so a node is on or off, and the
// only thing moving is the cursor.
//
// One animation, both placements: a single eased walk that plays once and
// stops. It used to be two — scroll-linked on /schedule, one-shot on the slug
// page — and the scroll version is gone. Tying a diagram's legibility to scroll
// position means it is half-drawn at whatever offset the reader happens to
// stop, and reverses if they scroll back, which reads as a glitch rather than a
// gesture.
//
// It fires when the graph is actually on screen rather than on mount. On the
// slug page that is immediately, since the band is the masthead; on /schedule
// the band is well below the fold, so firing on mount would run the whole thing
// before anyone reached it. One IntersectionObserver serves both, and it
// disconnects itself afterwards — there is nothing to see twice.
//
// It ends with the whole graph lit, which is also the server-rendered state: if
// JS never arrives the diagram is complete. Reduced motion goes straight there
// and never moves.
//
// ── Two layers, one coordinate space ────────────────────────────────────────
//
// Edges are SVG on a `0 0 160 90` viewBox — the canvas's own 16:9 — with the
// data's percentages scaled into it. The obvious alternative,
// `preserveAspectRatio="none"` on a square viewBox, was tried and is what broke
// the first build of this: an anisotropic viewBox distorts the coordinate
// system that `pathLength` and `stroke-dasharray` are measured in, so the
// draw-on animation rendered as a scatter of short dashes instead of one
// advancing line. Matching the aspect keeps the scaling uniform and the dash
// maths honest.
//
// Nodes are HTML on top. They have to be: they carry real type at the site's
// own scale, and SVG text would not take the font stack or the size logic.
//
// ── The anchors are measured, not written down ──────────────────────────────
//
// An edge has to leave the right edge of one card and meet the left edge of
// another, and a card is as wide as its text — which changes with the copy and
// with the font size at every breakpoint. Hand-placed anchor percentages were
// tried first and were wrong at every width except the one they were eyeballed
// at, with curves starting underneath their own node.
//
// So the cards are measured after layout and the edges drawn from the result.
// It costs one pass on mount and one per resize, which is nothing — this is not
// in the scroll path, where the only thing that changes is a custom property.

/** Seconds of the one-shot intro. */
const DURATION = 1500;

/** Steps in the walk: inputs, model, output. */
const STEPS = 3;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** A card's box in canvas percent, so any side of it can be addressed. */
interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
  cx: number;
  cy: number;
}

/** The midpoint of one side of a card. */
function port(box: Box, side: Side) {
  switch (side) {
    case "top":
      return { x: box.cx, y: box.t };
    case "bottom":
      return { x: box.cx, y: box.b };
    case "left":
      return { x: box.l, y: box.cy };
    default:
      return { x: box.r, y: box.cy };
  }
}

/**
 * A cubic between two anchors, flattened horizontally.
 *
 * Control points sit two-thirds of the horizontal gap from each end, on their
 * own end's `y` — which is what produces the flat-then-turn curve every
 * node editor draws, rather than a symmetrical arc.
 */
const VB_W = 160;
const VB_H = 100;
/** Percent of the canvas into the edge layer's own 16:9 coordinate space. */
const sx = (x: number) => (x / 100) * VB_W;
const sy = (y: number) => (y / 100) * VB_H;

/** Push a control point out along the normal of the side it leaves. */
function ctrl(p: { x: number; y: number }, side: Side, d: number) {
  if (side === "top") return { x: p.x, y: p.y - d };
  if (side === "bottom") return { x: p.x, y: p.y + d };
  if (side === "left") return { x: p.x - d, y: p.y };
  return { x: p.x + d, y: p.y };
}

/**
 * A cubic that leaves and arrives perpendicular to the cards.
 *
 * Control points offset along each end's own normal, which is what makes a
 * wire look plugged into an edge rather than aimed at a point — and it is why
 * the sides have to be declared rather than inferred from the geometry: two
 * cards stacked vertically and two side by side need different curves through
 * the same pair of coordinates.
 */
function edgePath(
  a: { x: number; y: number },
  aSide: Side,
  b: { x: number; y: number },
  bSide: Side,
) {
  const p1 = { x: sx(a.x), y: sy(a.y) };
  const p2 = { x: sx(b.x), y: sy(b.y) };
  const d = Math.min(
    Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.45, 6),
    26,
  );
  const c1 = ctrl(p1, aSide, d);
  const c2 = ctrl(p2, bSide, d);
  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

/** Where the pointer is at progress `p`, walking FLOW_PATH end to end. */
function pointAt(p: number) {
  const n = FLOW_PATH.length - 1;
  const t = Math.min(Math.max(p, 0), 1) * n;
  const i = Math.min(Math.floor(t), n - 1);
  const f = t - i;
  const a = FLOW_PATH[i];
  const b = FLOW_PATH[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** The modality glyphs, keyed by the data's own names. */
const GLYPHS = {
  text: Type,
  image: ImageIcon,
  film: Film,
  audio: AudioLines,
} as const;

function Node({
  node,
  cardRef,
  onActivate,
}: {
  node: FlowNode;
  cardRef: (el: HTMLDivElement | null) => void;
  /** Present only on the node that spawns mascots. See `Walkers`. */
  onActivate?: () => void;
}) {
  const mark = node.icon ? TOOL_MARKS[node.icon] : null;
  const Glyph = node.glyph ? GLYPHS[node.glyph] : null;
  const wire = FLOW_WIRE[node.id as keyof typeof FLOW_WIRE];

  return (
    <div
      className={cn("absolute", node.anchor === "center" && "-translate-x-1/2")}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        // 1 once the walk has reached this node's step. The floor is higher for
        // the field than for the rest: those are meant to be legible before the
        // pointer arrives, because they are context rather than a reveal.
        opacity: `clamp(${node.variant === "sea" ? "0.42" : "0.24"}, calc(var(--step) - ${node.step}), 1)`,
      }}
    >
      <div
        ref={cardRef}
        onClick={onActivate}
        className={cn(
          "flex items-center gap-[0.6ch] whitespace-pre rounded-[0.4em] font-mono",
          // The only clue that this one does anything.
          //
          // Nothing shows at rest, deliberately: there are fourteen nodes and
          // one of them is live, so a marker visible from across the section
          // would promise the same of the other thirteen and buy one discovery
          // with thirteen dead clicks. Both of these appear only once the
          // pointer is already on the node — near-discovery, not advertising.
          //
          // Desktop only, and free: Tailwind v4 compiles `hover:` inside
          // `@media (hover:hover)`, so touch never sticks in the lit state
          // after a tap. `cursor-pointer` is likewise inert without a pointer.
          // The cost is that this is the whole affordance, so on touch the
          // mascots are undiscoverable — accepted, because the alternative is
          // the thirteen-dead-clicks trade above.
          onActivate && "cursor-pointer hover:bg-(--node-lit)",
          node.variant === "modality" &&
            "border border-white/20 bg-white/[0.05] px-[0.9ch] py-[0.45em] text-white/85",
          // `bg-(--node-bg)` rather than an inline `backgroundColor`, which is
          // what this was: an inline background beats any class on specificity,
          // so the hover above would never have applied. Both spotlights carry
          // the variable; only the live one carries the hover.
          node.variant === "spotlight" &&
            "bg-(--node-bg) px-[1ch] py-[0.55em] text-[1.14em] text-[#09090B]",
          // No border, no ground. The grid is a list of names in the space, not
          // eight more cards competing with the two above them — and nothing
          // runs behind them now, so there is nothing for a ground to hide.
          node.variant === "sea" && "px-[0.2ch] text-[0.94em] text-white/48",
        )}
        style={
          node.variant === "spotlight"
            ? ({
                "--node-bg": MODEL_LAVENDER,
                "--node-lit": MODEL_LAVENDER_LIT,
              } as React.CSSProperties)
            : undefined
        }
      >
        {Glyph && (
          <Glyph
            className="h-[1.05em] w-[1.05em] shrink-0"
            strokeWidth={2}
            style={wire ? { color: wire } : undefined}
          />
        )}
        {mark && (
          <svg
            viewBox={mark.viewBox}
            fill="currentColor"
            className="h-[1.05em] w-[1.05em] shrink-0"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: mark.inner }}
          />
        )}
        {node.t}
      </div>
    </div>
  );
}

export function ModelFlow({ className }: { className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const spawnMascot = useMascots();
  const cards = useRef(new Map<string, HTMLDivElement>());
  const [boxes, setBoxes] = useState<Record<string, Box>>({});

  /** Card boxes as percentages of the canvas, so the edges can find them. */
  const measure = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const next: Record<string, Box> = {};
    for (const [id, card] of cards.current) {
      const r = card.getBoundingClientRect();
      const l = ((r.left - box.left) / box.width) * 100;
      const rt = ((r.right - box.left) / box.width) * 100;
      const t = ((r.top - box.top) / box.height) * 100;
      const b = ((r.bottom - box.top) / box.height) * 100;
      next[id] = { l, r: rt, t, b, cx: (l + rt) / 2, cy: (t + b) / 2 };
    }
    setBoxes(next);
  }, []);

  // Layout effect, so the edges are drawn on the same frame the cards land —
  // otherwise the first paint shows nodes with nothing joining them.
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (frame.current) ro.observe(frame.current);
    window.addEventListener("resize", measure);
    // Re-measure once the webfont swaps in: the cards are `ch`-padded monospace
    // and every one of them changes width when Geist Mono replaces the fallback.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;

    /**
     * `--step` is how far the walk has got, as a whole number, so nodes switch
     * rather than fade through a half-lit state. `--px`/`--py` are the pointer,
     * continuous, so it slides. `--draw` runs the edges' dash offset, which is
     * what makes a connector appear to be drawn rather than to fade in.
     */
    const paint = (p: number) => {
      const { x, y } = pointAt(p);
      el.style.setProperty("--step", String(Math.floor(p * STEPS)));
      el.style.setProperty("--draw", String(Math.min(p * 1.35, 1)));
      el.style.setProperty("--px", x.toFixed(2));
      el.style.setProperty("--py", y.toFixed(2));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }

    let raf = 0;
    const play = () => {
      let start = 0;
      raf = requestAnimationFrame(function tick(now) {
        if (!start) start = now;
        const t = Math.min((now - start) / DURATION, 1);
        paint(easeInOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      });
    };

    // Held at zero until it is worth watching. A third of the graph on screen
    // is enough to have arrived without demanding the whole thing fit first —
    // this canvas is tall, and `threshold: 1` would never fire on a short
    // viewport.
    paint(0);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        play();
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // Decorative in full: the graph is a picture of how the work gets made, and
    // everything this page states is beside it as text.
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-[8/5] w-full select-none",
        "text-[11px] sm:text-caption md:text-[15px] lg:text-[13px] xl:text-[16px] 2xl:text-[19px]",
        className,
      )}
      ref={frame}
      style={
        {
          "--step": STEPS,
          "--draw": 1,
          "--px": FLOW_PATH[FLOW_PATH.length - 1].x,
          "--py": FLOW_PATH[FLOW_PATH.length - 1].y,
        } as React.CSSProperties
      }
    >
      {/* The canvas the reference is drawn on, inverted. A dot grid rather than
          a ruled one: it says "workspace" without adding lines that would
          compete with the edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[0.6em]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          maskImage:
            "radial-gradient(ellipse 92% 66% at 48% 50%, black 36%, transparent 84%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 66% at 48% 50%, black 36%, transparent 84%)",
        }}
      />

      {/*
        Three lights, one per node that has a colour on the graph — lavender on
        the model, cyan on the reference, blue on the output. Tying them to the
        nodes rather than scattering them means the glow says the same thing the
        wires do, and the picture reads as lit from inside rather than washed.
        The model's is the strongest because it is the subject.

        Wide horizontally, contained vertically — and the second half of that is
        the point. The band bleeds to the right edge of the screen from `lg`, so
        the light has to reach into that space or it leaves a hard black column
        beside the graph. But the sections above and below this one are plain
        black, and light running to the top and bottom edges turned those seams
        into visible gradients — the band stopped reading as a black section
        with something lit inside it and started reading as a coloured panel.
        The mask fades it out well before either edge, so the transition either
        side is black-to-black again.

        Masking after the blur, not instead of it: `filter` is applied to the
        element and `mask` clips the result, so the fade lands on the finished
        glow rather than on the gradients that feed it.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-6%] left-[-35%] right-[-45%] blur-[100px]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 26%, black 74%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 26%, black 74%, transparent 100%)",
          background: [
            // One under each spotlight, so the light marks the two models the
            // afternoon leads with rather than the middle of the box.
            // Under the two columns that lead, so the light marks where to
            // start reading rather than the middle of the box.
            `radial-gradient(ellipse 22% 34% at 12% 42%, ${MODEL_LAVENDER}59 0%, transparent 72%)`,
            `radial-gradient(ellipse 22% 34% at 62% 42%, ${MODEL_LAVENDER}59 0%, transparent 72%)`,
            `radial-gradient(ellipse 46% 22% at 50% 10%, ${MODEL_CYAN}33 0%, transparent 76%)`,
            `radial-gradient(ellipse 46% 24% at 50% 74%, ${MODEL_BLUE}30 0%, transparent 76%)`,
            // A broad, very faint wash so the whole panel sits a step off pure
            // black rather than the colour arriving only in three spots.
            `radial-gradient(ellipse 70% 70% at 55% 50%, ${MODEL_LAVENDER}1a 0%, transparent 80%)`,
          ].join(", "),
        }}
      />

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {FLOW_EDGES.map(([from, to]) => {
          const fb = boxes[from];
          const tb = boxes[to];
          if (!fb || !tb) return null;
          const sides = FLOW_EDGE_SIDES[`${from}-${to}`];
          const a = port(fb, sides.from);
          const b = port(tb, sides.to);
          return (
            <path
              key={`${from}-${to}`}
              d={edgePath(a, sides.from, b, sides.to)}
              fill="none"
              stroke={
                FLOW_WIRE[from as keyof typeof FLOW_WIRE] ??
                "rgba(255,255,255,0.34)"
              }
              strokeOpacity={0.55}
              // No `vector-effect="non-scaling-stroke"`. It moves dash maths
              // into screen space, which silently defeats `pathLength` — the
              // draw-on animation came out as a scatter of short dashes. The
              // viewBox already matches the box's aspect, so the stroke scales
              // evenly without it; 0.28 user units lands near 1px on screen.
              strokeWidth={0.28}
              // Drawn rather than faded: the dash is the whole path length, and
              // `--draw` pulls its offset back to zero as the walk advances.
              // `pathLength` normalises that to 1 so the numbers stay readable
              // whatever the curve actually measures.
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset: `calc(1 - var(--draw))` }}
            />
          );
        })}

        {/* Ports. The reference canvas puts a small ring at every connection,
            and they do more than decorate: they say the line is attached rather
            than passing behind, which is the one thing a bare curve between two
            cards fails to communicate. Filled with the ground so the edge
            appears to stop at them. */}
        {FLOW_EDGES.flatMap(([from, to]) => {
          const fb = boxes[from];
          const tb = boxes[to];
          if (!fb || !tb) return [];
          const sides = FLOW_EDGE_SIDES[`${from}-${to}`];
          const pts = [port(fb, sides.from), port(tb, sides.to)];
          return pts.map((pt, i) => (
            <circle
              key={`${from}-${to}-${i}`}
              cx={sx(pt.x)}
              cy={sy(pt.y)}
              r={FLOW_PORT_R}
              fill="#09090B"
              stroke={
                FLOW_WIRE[from as keyof typeof FLOW_WIRE] ??
                "rgba(255,255,255,0.4)"
              }
              strokeWidth={0.34}
              style={{ opacity: `clamp(0, calc(var(--draw) * 3 - 0.4), 1)` }}
            />
          ));
        })}
      </svg>

      {FLOW_NODES.map((n) => (
        <Node
          key={n.id}
          node={n}
          cardRef={(el) => {
            if (el) cards.current.set(n.id, el);
            else cards.current.delete(n.id);
          }}
          onActivate={
            n.id === "claude-code" && spawnMascot
              ? () => {
                  // The card's own rect, so they launch from wherever the node
                  // actually is. This was a hardcoded percentage once and the
                  // node moved out from under it — they came out of the `text`
                  // input for a build.
                  const card = cards.current.get("claude-code");
                  if (card) spawnMascot(card.getBoundingClientRect());
                }
              : undefined
          }
        />
      ))}

      {/* The pointer, oversized, walking the graph. The one element that has to
          read instantly as an instrument rather than as content. */}
      <svg
        viewBox="0 0 16 20"
        className="pointer-events-none absolute z-10 h-[2.6em] w-auto drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]"
        style={{
          left: "calc(var(--px) * 1%)",
          top: "calc(var(--py) * 1%)",
        }}
      >
        <path
          d="M1 1 L1 17.5 L5.2 13.4 L8.1 19.4 L10.9 18.1 L8.1 12.3 L14 12.3 Z"
          fill="#FAFAFA"
        />
      </svg>
    </div>
  );
}
