"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import { ROOMS, type Room } from "@/lib/locations";
import { TRACK_NAMES } from "@/lib/tracks";
import { cn } from "@/lib/utils";

// Five circuits, one current. Per the brand system the circuits don't get
// their own colours — they're one magenta at five charges, dimmest to
// brightest. Length is asserted against TRACK_NAMES so the ramp can't drift
// out of step with the circuits it stands for.
const CHARGE = [
  "text-magenta/35",
  "text-magenta/50",
  "text-magenta/65",
  "text-magenta/80",
  "text-magenta",
] satisfies { length: (typeof TRACK_NAMES)["length"] } & string[];

// 1×1 transparent GIF — shown only if WebGL is unavailable (never for us).
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

// WebGL uniforms need a literal — the shader can't read a CSS custom
// property. Keep in sync with `--magenta` in app/globals.css.
const MAGENTA = "#ff32a0";

// The current is revealed only in a soft pool around the cursor.
//
// 140px, not 220. The panel is ~490px wide, so the old pool covered close to
// half of it and read as the whole card lighting up rather than the cursor
// finding a current. The solid core is smaller too and the falloff runs all
// the way out — a hard rim at 75% was what made the edge legible as a shape.
const SPOTLIGHT =
  "radial-gradient(140px circle at var(--mx, 50%) var(--my, 50%), #000 0%, #000 12%, transparent 100%)";

function Portrait({
  room,
  sizes,
  className,
}: {
  room: Room;
  sizes: string;
  /** Overrides the default aspect handling — used in the bento, where the
      grid sets a cell's height and the image has to fill it. */
  className?: string;
}) {
  if (!room.image) {
    return (
      <pre
        aria-hidden="true"
        className="overflow-x-auto p-4 font-mono text-[11px] leading-tight text-magenta"
      >
        {room.ascii}
      </pre>
    );
  }
  // The featured main stage keeps its natural (wider) aspect. The three
  // supporting venues are near-square at source, so we normalize them to a
  // shared 4:3 with a top-biased crop — that trims only the street foreground
  // and preserves each venue's brand mark, which sits in the upper portion.
  return (
    <Image
      src={room.image}
      alt={room.name}
      width={room.imageWidth ?? 1280}
      height={room.imageHeight ?? 720}
      sizes={sizes}
      className={cn(
        "w-full",
        className ??
          (room.tier === "anchor"
            ? "h-auto"
            : room.fit === "contain"
              ? "aspect-4/3 object-contain"
              : "aspect-4/3 object-cover object-top"),
      )}
    />
  );
}

// The circuit this venue carries — the label that ties the hero's five
// circuits to a room you can stand in.
function CircuitChip({ room }: { room: Room }) {
  return (
    <span className="rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-magenta">
      {room.tag}
    </span>
  );
}

// One session list for every room in the section.
//
// `kind` is opt-in rather than always-on: the anchor's caption column is
// roughly twice the width of the other two and can carry a right-aligned
// circuit beside the title, where the narrower columns would wrap it.
function SessionList({
  room,
  showKind = false,
  className,
}: {
  room: Room;
  showKind?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "mt-4 flex flex-col gap-2 border-t border-white/10 pt-4",
        className,
      )}
    >
      {room.sessions.map((s) => (
        <li key={s.title} className="flex items-baseline gap-2.5 text-sm">
          <span
            aria-hidden="true"
            className="mt-1.25 h-1.5 w-1.5 shrink-0 self-start rounded-xs bg-magenta/70"
          />
          <span className="text-white">{s.title}</span>
          {showKind && s.kind && (
            <span className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/40">
              {s.kind}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// The anchor — portrait and breakdown butted flush into one hard-edged
// rectangle, contained rather than bled.
//
// Square corners, no border, no glow. That combination was what made an
// earlier full-width version read as a sticker laid on the page; containment
// was never the problem. Flush edges and a solid panel do the integrating
// instead, so the anchor stays inside the same margins as everything else.
//
// The portrait's 3:2 sets the row height and the panel stretches to match, so
// on a 13" MacBook Air the whole thing lands around 490px — inside the
// viewport without any vh arithmetic. The session list is pushed to the foot
// of the panel so the space above it reads as a column, not a gap.
//
// It's also the only room here that mounts a shader: one GL context, not three.
function Anchor({ room }: { room: Room }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Write the pointer position straight to CSS vars (no re-render per move) —
  // the spotlight mask reads them to localize the shader to the cursor.
  function onMove(e: React.MouseEvent) {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <motion.article
      initial={reduce ? undefined : { opacity: 0, y: 40 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="grid overflow-hidden lg:grid-cols-[3fr_2fr]"
    >
      {/* The portrait sets the row height; the panel stretches to meet it.
          16/9 rather than 3/2: the panel pins its name to the portrait's top
          edge and its session list to the bottom, so the portrait's height IS
          the distance between them. At 3/2 that left ~210px of dead centre on
          a 1440 screen — the framing was right, the span was just too tall to
          hold. `aspect-video` is the canonical 16/9 — it keeps the crop
          generous and takes ~77px out of the middle. */}
      <div className="relative aspect-video bg-black">
        <Portrait
          room={room}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="absolute inset-0 h-full object-cover object-center"
        />
      </div>

      {/* The breakdown — the current flows through it on hover. Black, so the
          panel sits on the page rather than on a tinted plate; the portrait's
          top and bottom edges do the framing instead, which is why the name
          aligns to one and the session list to the other. */}
      <div className="relative bg-black">
        <div
          ref={boxRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={onMove}
          className="relative h-full overflow-hidden"
        >
          {!reduce && (
            <div
              aria-hidden="true"
              className={cn(
                // 40%, down from 70 — at full strength the pool competed with
                // the portrait beside it. It should read as a trace under the
                // cursor, not a second light source on the page.
                "absolute inset-0 z-0 transition-opacity duration-500",
                hovered ? "opacity-40" : "opacity-0",
              )}
              // Mask the full-box current down to a pool that tracks the cursor.
              style={{ maskImage: SPOTLIGHT, WebkitMaskImage: SPOTLIGHT }}
            >
              <ShaderCanvas
                color={MAGENTA}
                maskClassName=""
                fallbackSrc={BLANK}
                className="h-full w-full"
                base={[0.05, 0.0, 0.035]}
                active={hovered}
              />
            </div>
          )}

          {/* pointer-events-none lets the cursor reach the shader beneath */}
          <div className="pointer-events-none relative z-10 flex h-full flex-col p-6 lg:p-8">
            <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                {room.host}
              </span>
              <span
                role="img"
                aria-label="All five circuits run here"
                className="flex shrink-0 items-center gap-1.5"
              >
                {TRACK_NAMES.map((name, i) => (
                  <span
                    key={name}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]",
                      CHARGE[i],
                    )}
                  />
                ))}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-3xl">
              {room.name}
            </h3>
            <p className="mt-2.5 text-base text-white/60">{room.desc}</p>
            {/* Anchored to the foot of the panel, so the space above it reads
                as a deliberate column rather than a gap left over. */}
            <SessionList room={room} showKind className="mt-auto pt-5" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// A day-long venue — Central Library and The Rand. Square, borderless, on the
// page's own black, the same grammar as the anchor: the portrait butting flush
// against the copy is what defines the tile. Type and rhythm track the anchor
// panel too; only the name steps down a size, which is the hierarchy.
function DayTile({ room, index }: { room: Room; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? undefined : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.5,
        delay: reduce ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="grid grow overflow-hidden sm:grid-cols-[2fr_3fr]"
    >
      {/* From sm the copy sets the row height and the image fills to match,
          rather than sitting at its own aspect with black beneath it.

          Below sm the tile stacks and the cell turns landscape (4:3) while
          this art is portrait-ish — covering it there crops top and bottom,
          which is exactly where The Rand's "g" descender lives. Contain shows
          each mark whole on a phone and costs only some side letterboxing;
          from sm the cell is portrait again and cover fills it without loss. */}
      <div className="bg-black">
        <Portrait
          room={room}
          sizes="(min-width: 1024px) 18vw, (min-width: 640px) 40vw, 100vw"
          className={cn(
            "max-sm:aspect-4/3 max-sm:object-contain sm:h-full",
            room.fit === "contain"
              ? "sm:object-contain"
              : "sm:object-cover sm:object-top",
          )}
        />
      </div>

      <div className="flex flex-col p-5">
        <div className="mb-3.5 border-b border-white/10 pb-3">
          <p className="truncate font-mono text-[11px] uppercase tracking-widest text-white/50">
            {room.host}
          </p>
        </div>
        <h3 className="font-display text-xl font-bold uppercase leading-none text-white">
          {room.name}
        </h3>
        <div className="mt-2.5">
          <CircuitChip room={room} />
        </div>
        <p className="mt-2.5 text-base text-white/60">{room.desc}</p>
        <SessionList room={room} />
      </div>
    </motion.article>
  );
}


export function RoomFlow() {
  const anchor = ROOMS.find((r) => r.tier === "anchor");
  // Only the anchor and the all-week rooms are rendered. The two
  // single-activation rooms (300 Main, Legacy Park) stay in ROOMS but have no
  // surface on the homepage now — they need /sessions or a venues page.
  const dayRooms = ROOMS.filter((r) => r.tier === "day");

  return (
    <section className="bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
        {/* A grid rather than nested rows, so the CTA can sit in a different
            place at each size from one piece of markup. Source order is
            eyebrow → headline → blurb → button, which is what stacks on
            mobile; from lg the explicit placement lifts the button into the
            headline's row, bottom-aligned with it, filling a right half that
            was otherwise ~45% empty black. */}
        <div className="grid gap-x-16 lg:grid-cols-[1fr_auto]">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta lg:col-start-1 lg:row-start-1">
            Downtown San Antonio · Sept 28 – Oct 2
          </p>

          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:col-start-1 lg:row-start-2">
            Where the current lands.
          </h2>

          <p className="mt-4 max-w-xl text-pretty text-white/60 lg:col-start-1 lg:row-start-3">
            From the main stage, to the community floor,
            small-business house, and more.
          </p>

          {/* Rendered by ButtonLink, which is an anchor wearing the button
              style — this navigates, so it has to stay a link. The arrow only
              moves here; it can't also take the magenta it does elsewhere,
              since it's already sitting on it.

              `duration-200` is on both the button and the arrow on purpose.
              buttonClass ships bare `transition-colors`, which falls back to
              Tailwind's 150ms default, so against the arrow's 300ms the
              background finished first and the arrow carried on after it —
              one hover reading as two events. Same duration, one gesture.

              Sized down on mobile, where it follows the blurb as a normal
              in-flow CTA rather than sitting beside a headline. */}
          <ButtonLink
            href="/sessions"
            size="md"
            className="group mt-8 justify-self-start font-display text-base font-bold uppercase tracking-tight duration-200 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:h-13 lg:self-end lg:px-7 lg:text-lg"
          >
            Trace the schedule
            <ArrowUpRight
              className={cn(
                ARROW_MOTION,
                // 2px per axis, not 4. Diagonal travel compounds — 4px each
                // way is ~5.7px on a 20px glyph, which reads as a hop inside
                // a compact button rather than a nudge.
                "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:h-5 lg:w-5",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </ButtonLink>
        </div>

        {/* Only the rooms with building portraits appear here; the two
            single-activation rooms are held back until /sessions or a venues
            page exists, because a text-only tile is the weakest thing in a
            section this dependent on the artwork. */}
        <div className="mt-16 flex flex-col gap-6 lg:mt-20">
          {anchor && <Anchor room={anchor} />}

          <div className="grid gap-6 sm:grid-cols-2">
            {dayRooms.map((room, i) => (
              <DayTile key={room.slug} room={room} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
