"use client";

import { useEffect, useRef } from "react";
import {
  MODEL_CYAN,
  MODEL_LAVENDER,
  MODEL_MODELS,
  MODEL_TOOLS,
  type ModelColumnRow,
} from "@/lib/the-model";
import { TOOL_MARKS } from "@/lib/tool-marks";
import { cn } from "@/lib/utils";

// The Model's hero: two columns meeting at a seam — what the room works in on
// the left, what it calls on the right. See the note above MODEL_TOOLS in
// lib/the-model.ts for why this replaced the staircase and what came out.
//
// ── The pointer runs the seam ───────────────────────────────────────────────
//
// It descends the join, and each row's two halves light *together* as it
// passes. That pairing is the whole reason this layout was worth building: the
// event's claim is that these are one room, and a pointer that lit the left
// before the right would be saying the opposite.
//
// `scroll` — the CTA on /schedule. The pointer walks down as the section rises
// through the viewport, and back up when you scroll away.
//
// `intro` — the masthead on /schedule/the-model. The same walk, once, on load.
// Nobody scrolls into a masthead, so tying it to scroll would mean a dead
// picture or one that only animates as you leave.
//
// Both end fully lit, which is also the server-rendered state: if JS never
// arrives, the picture is still the picture. Reduced motion goes straight there.
//
// ── One axis per channel ────────────────────────────────────────────────────
//
// Colour says which side of the room you are on and nothing else — lavender for
// tools, cyan for models. The tag says modality and nothing else, and it sits
// outside the block in muted grey so it cannot be mistaken for the name. Only
// the name is ever a block, which is a third of the colour the staircase
// carried and gives each row an obvious subject.

/** Rows per column. Equal by construction; this is the assertion of that. */
const ROWS = Math.max(MODEL_TOOLS.length, MODEL_MODELS.length);

/** Cubic ease-out, for the one-shot intro. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * One name — blocked, with its mark inside it and its tag outside.
 *
 * Both columns put the *name* against the seam and the tag on the far side,
 * which is what makes them look joined at a line rather than merely adjacent.
 * `flex-row-reverse` on the right is what mirrors it without a second markup
 * path.
 */
function Row({
  row,
  side,
  colour,
  lit,
}: {
  row: ModelColumnRow;
  side: "left" | "right";
  colour: string;
  lit: boolean;
}) {
  const mark = row.icon ? TOOL_MARKS[row.icon] : null;
  return (
    <div
      className={cn(
        "flex items-center gap-[1.2ch] whitespace-pre",
        side === "left" ? "justify-end" : "flex-row-reverse justify-end",
      )}
    >
      <span
        className={cn("shrink-0 text-[0.78em]", lit ? "text-white/40" : "text-white/15")}
      >
        {row.tag}
      </span>
      <span
        className="inline-flex items-center gap-[0.5ch] px-[0.6ch]"
        style={
          lit
            ? { backgroundColor: colour, color: "#09090B" }
            : { color: "rgba(255,255,255,0.22)" }
        }
      >
        {mark && (
          <svg
            viewBox={mark.viewBox}
            fill="currentColor"
            className="h-[1.05em] w-[1.05em] shrink-0"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: mark.inner }}
          />
        )}
        {row.t}
      </span>
    </div>
  );
}

/**
 * A row in both states, stacked, with CSS choosing which is visible.
 *
 * `--sel` is a whole number, so `calc(var(--sel) - i)` is either >= 1 or <= 0
 * and the clamp is binary — the row switches rather than fading through a
 * half-lit state. Doing it in CSS rather than React is what keeps a scroll
 * frame from re-rendering twelve rows.
 */
function Switchable({
  row,
  side,
  colour,
  i,
}: {
  row: ModelColumnRow;
  side: "left" | "right";
  colour: string;
  i: number;
}) {
  return (
    <div className="relative" style={{ height: "var(--lh)" }}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full">
          <Row row={row} side={side} colour={colour} lit={false} />
        </div>
      </div>
      <div
        className="absolute inset-0 flex items-center"
        style={{ opacity: `clamp(0, calc(var(--sel) - ${i}), 1)` }}
      >
        <div className="w-full">
          <Row row={row} side={side} colour={colour} lit />
        </div>
      </div>
    </div>
  );
}

export function ModelSelection({
  mode = "scroll",
  className,
}: {
  /** See the note at the top of the file. */
  mode?: "scroll" | "intro";
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;

    /**
     * `--sel` is how many rows are lit, from the top — whole, so rows switch.
     * `--py` is where the pointer is, continuous, so it slides between them.
     */
    const paint = (p: number) => {
      const py = p * ROWS;
      el.style.setProperty("--sel", String(Math.floor(py)));
      el.style.setProperty("--py", py.toFixed(3));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }

    if (mode === "intro") {
      const DURATION = 1150;
      let start = 0;
      let raf = requestAnimationFrame(function tick(now) {
        if (!start) start = now;
        const t = Math.min((now - start) / DURATION, 1);
        paint(easeOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(raf);
    }

    /**
     * How far the section has risen through the viewport, 0 to 1 — monotonic
     * with scroll, so down always walks the pointer down and up always walks it
     * back. Finishes at 85% of a screen height, which puts the last row on while
     * the band is still comfortably in view rather than as it leaves.
     */
    const progress = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return Math.min(Math.max((vh - r.top) / (vh * 0.85), 0), 1);
    };

    // Coalesced to one paint per frame: scroll fires far faster than the screen
    // refreshes, and painting per event is work nobody sees.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        paint(progress());
      });
    };

    paint(progress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode]);

  return (
    // Decorative in full: the names are a picture of a room's toolkit, not
    // information, and everything this page states is beside it as text.
    <div
      aria-hidden="true"
      className={cn("relative select-none", className)}
      ref={frame}
      style={
        {
          "--sel": ROWS,
          "--py": ROWS,
        } as React.CSSProperties
      }
    >
      {/*
        Light, and only light. The prompts that used to sit back here were type
        behind type, which reads as clutter rather than depth — see the note in
        lib/the-model.ts. Two sources, one per column, so the glow says the same
        thing the layout does.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-45%] left-[-25%] right-[-25%] blur-[90px]"
        style={{
          background: `radial-gradient(ellipse 34% 48% at 28% 50%, ${MODEL_LAVENDER}33 0%, transparent 72%), radial-gradient(ellipse 34% 48% at 72% 50%, ${MODEL_CYAN}33 0%, transparent 72%)`,
        }}
      />

      {/* `--lh` and the font size live together, so the row box, the character
          grid and the pointer all resolve against the same em and the whole
          thing scales by changing one number per breakpoint. */}
      <div className="relative font-mono text-[11px] [--lh:2.6em] sm:text-caption md:text-[17px] lg:text-[15px] xl:text-[19px] 2xl:text-[22px]">
        {/* Column heads, level with each other, set as plain comments — a block
            here would compete with the names below it. */}
        <div className="grid grid-cols-2 gap-x-[3.5ch] pb-[0.8em] text-[0.78em] text-white/35">
          <span className="text-right">{"// studio"}</span>
          <span>{"// ai models"}</span>
        </div>

        <div className="relative grid grid-cols-2 gap-x-[3.5ch]">
          {/* The seam: a hairline rather than a gap, so the columns read as
              joined at a line — and so the pointer has something to run down. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10"
          />

          <div>
            {MODEL_TOOLS.map((row, i) => (
              <Switchable
                key={row.t}
                row={row}
                side="left"
                colour={MODEL_LAVENDER}
                i={i}
              />
            ))}
          </div>

          <div>
            {MODEL_MODELS.map((row, i) => (
              <Switchable
                key={row.t}
                row={row}
                side="right"
                colour={MODEL_CYAN}
                i={i}
              />
            ))}
          </div>

          {/* The pointer, on the seam and deliberately oversized. It is the only
              thing that moves, and the one element that has to read instantly as
              an instrument rather than as content. */}
          <svg
            viewBox="0 0 16 20"
            className="pointer-events-none absolute left-1/2 z-10 h-[2.6em] w-auto -translate-x-[0.45em] drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]"
            style={{ top: "calc(var(--py) * var(--lh) - 0.4em)" }}
          >
            <path
              d="M1 1 L1 17.5 L5.2 13.4 L8.1 19.4 L10.9 18.1 L8.1 12.3 L14 12.3 Z"
              fill="#FAFAFA"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
