"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ShaderCanvas } from "@/components/site/shader-canvas";
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
const SPOTLIGHT =
  "radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), #000 0%, #000 32%, transparent 75%)";

function Portrait({ room, sizes }: { room: Room; sizes: string }) {
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
        room.featured
          ? "h-auto"
          : room.fit === "contain"
            ? "aspect-4/3 object-contain"
            : "aspect-4/3 object-cover object-top",
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

// The anchor — Texas Public Radio keeps the full-bleed row, the wider
// portrait, and the WebGL current pooling under the cursor. It's the only
// room in this section that mounts a shader: one GL context, not four.
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
      className="grid items-center gap-8 lg:grid-cols-[4fr_8fr] lg:gap-16"
    >
      {/* The breakdown — the current flows through the card on hover. */}
      <div className="relative lg:order-1">
        <div
          ref={boxRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={onMove}
          className="relative overflow-hidden rounded-lg border border-white/10 bg-white/3"
        >
          {!reduce && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-0 transition-opacity duration-500",
                hovered ? "opacity-70" : "opacity-0",
              )}
              // Mask the full-box current down to a pool that tracks the cursor.
              style={{
                maskImage: SPOTLIGHT,
                WebkitMaskImage: SPOTLIGHT,
              }}
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
          <div className="pointer-events-none relative z-10 p-5">
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
            <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              {room.sessions.map((s) => (
                <li key={s.title} className="flex items-baseline gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1.25 h-1.5 w-1.5 shrink-0 self-start rounded-xs bg-magenta/70"
                  />
                  <span className="text-white">{s.title}</span>
                  {s.kind && (
                    <span className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/40">
                      {s.kind}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Portrait — the star. */}
      <div className="relative lg:order-2">
        {/* Full charge — the main stage is the only room that throws a glow. */}
        <div
          className="overflow-hidden rounded-lg bg-black ring-1 ring-white/10"
          style={{
            boxShadow:
              "0 40px 110px -34px color-mix(in srgb, var(--magenta) 55%, transparent)",
          }}
        >
          <Portrait room={room} sizes="(min-width: 1024px) 66vw, 100vw" />
        </div>
      </div>
    </motion.article>
  );
}

// A supporting venue in the three-up bank: portrait on top, breakdown below.
// Sitting three across is the point — session counts and circuits line up, so
// the rooms can be read against each other instead of one screen at a time.
function BankCard({ room, index }: { room: Room; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? undefined : { opacity: 0, y: 32 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.55,
        delay: reduce ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      // The space-blue ground reads the three supporting rooms as one group
      // without giving any of them a hue. No hover state — these cards aren't
      // links, and a warming border reads as one.
      className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-space-blue/20"
    >
      <div className="bg-black">
        <Portrait
          room={room}
          sizes="(min-width: 1024px) 29vw, (min-width: 700px) 45vw, 100vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-4.5">
        <p className="mb-3 truncate font-mono text-[11px] uppercase tracking-widest text-white/45">
          {room.host}
        </p>

        <h3 className="font-display text-xl font-bold uppercase leading-none text-white">
          {room.name}
        </h3>

        <div className="mt-2.5">
          <CircuitChip room={room} />
        </div>

        <p className="mt-3 text-base text-white/60">{room.desc}</p>

        <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
          {room.sessions.map((s) => (
            <li key={s.title} className="flex items-baseline gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className="mt-1.25 h-1.5 w-1.5 shrink-0 self-start rounded-xs bg-magenta/70"
              />
              <span className="text-white">{s.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function RoomFlow() {
  const anchor = ROOMS.find((r) => r.featured);
  const bank = ROOMS.filter((r) => !r.featured);

  return (
    <section className="bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            Downtown San Antonio · Sept 28 – Oct 2
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
            Where the current lands.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-white/60">
            Four downtown venues, live all five days: the main stage, the
            community floor, the small-business house, and the park where it
            all unwinds.
          </p>
        </div>

        {anchor && (
          <div className="mt-16 lg:mt-24">
            <Anchor room={anchor} />
          </div>
        )}

        {/* The supporting three, side by side so they can be compared. The
            rule alone separates them from the anchor — the intro already
            said there are four rooms, so a heading here just recounts them. */}
        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-white/10 pt-14 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-8 lg:pt-16">
          {bank.map((room, i) => (
            <BankCard key={room.slug} room={room} index={i} />
          ))}
        </div>

        {/* The door — /sessions 404s into the Bolt Runner until the lineup ships. */}
        <div className="mt-20 lg:mt-28">
          <Link
            href="/sessions"
            className="group inline-flex items-baseline gap-2 font-display text-xl font-bold uppercase tracking-tight text-white transition-colors hover:text-magenta sm:text-2xl"
          >
            Trace the schedule
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/40">
            The full lineup comes online soon — mind the loose current.
          </p>
        </div>
      </div>
    </section>
  );
}
