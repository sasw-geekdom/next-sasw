"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ROOMS, type Room } from "@/lib/locations";
import { TRACK_NAMES, CIRCUIT_COLORS } from "@/lib/tracks";
import { cn } from "@/lib/utils";

// The five circuits — shown as pips on the main stage's card.
const CIRCUITS = TRACK_NAMES.map((n) => CIRCUIT_COLORS[n]);

// 1×1 transparent GIF — shown only if WebGL is unavailable (never for us).
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function Portrait({ room }: { room: Room }) {
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
      sizes="(min-width: 1024px) 58vw, 100vw"
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

// The current is revealed only in a soft pool around the cursor.
const SPOTLIGHT =
  "radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), #000 0%, #000 32%, transparent 75%)";

function Activation({ room, flip }: { room: Room; flip: boolean }) {
  const reduce = useReducedMotion();
  const featured = Boolean(room.featured);
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
      className={cn(
        "grid items-center gap-8 lg:gap-16",
        // the featured main stage gets a wider portrait than the rest
        featured
          ? flip
            ? "lg:grid-cols-[8fr_4fr]"
            : "lg:grid-cols-[4fr_8fr]"
          : flip
            ? "lg:grid-cols-[7fr_5fr]"
            : "lg:grid-cols-[5fr_7fr]",
      )}
    >
      {/* Portrait — the star. */}
      <div className={cn("relative", flip ? "lg:order-1" : "lg:order-2")}>
        <div
          className={cn(
            "overflow-hidden rounded-lg bg-black",
            featured && "ring-1 ring-white/10",
          )}
          style={
            featured
              ? {
                  boxShadow: `0 40px 110px -34px color-mix(in srgb, ${room.color} 55%, transparent)`,
                }
              : undefined
          }
        >
          <Portrait room={room} />
        </div>
      </div>

      {/* The breakdown — the current flows through the card on hover. */}
      <div className={cn("relative", flip ? "lg:order-2" : "lg:order-1")}>
        <div
          ref={boxRef}
          tabIndex={0}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={onMove}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          className="node-glow relative overflow-hidden rounded-lg border border-white/10 bg-white/3 outline-none"
          style={{ ["--c" as string]: room.color } as React.CSSProperties}
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
                color={room.color}
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
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                <span style={{ color: room.color }}>◆</span> {room.host}
              </span>
              {featured && (
                <span
                  role="img"
                  aria-label="All five circuits run here"
                  className="flex items-center gap-1.5"
                >
                  {CIRCUITS.map((c) => (
                    <span
                      key={c}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c, boxShadow: `0 0 6px ${c}` }}
                    />
                  ))}
                </span>
              )}
            </div>
            <h3 className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-3xl">
              {room.name}
            </h3>
            <p className="mt-2.5 text-sm text-white/60">{room.desc}</p>
            <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              {room.sessions.map((s) => (
                <li key={s.title} className="flex items-baseline gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1.25 h-1.5 w-1.5 shrink-0 self-start rounded-xs"
                    style={{ backgroundColor: room.color }}
                  />
                  <span className="text-white">{s.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest text-white/40">
                    {s.kind}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function RoomFlow() {
  return (
    <section className="bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            Downtown West San Antonio
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
            Where the current lands.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-white/60">
            Sept 28 – Oct 2, four downtown venues come online: the main stage,
            the community floor, the small-business house, and the park where it
            all unwinds.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-24 lg:mt-24 lg:gap-32">
          {ROOMS.map((room, i) => (
            <Activation key={room.slug} room={room} flip={i % 2 === 1} />
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
