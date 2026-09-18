"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { DOWNTOWN, NORTH, project, type MapView } from "@/lib/downtown-map";
import { cn } from "@/lib/utils";

/**
 * Downtown, with the two things somebody needs before Monday on it: where a
 * badge is handed over and where the car goes.
 *
 * Drawn rather than embedded. A tile map would put a third party in front of
 * the one question this page exists to answer, ship a second design language
 * into the middle of the site, and stop working when their server does. The
 * streets here are baked paths — see lib/downtown-map — so the map is part of
 * the page rather than a request it waits on, and it is black because the rest
 * of this site is.
 *
 * Two frames, because downtown is two places. The wide one is the three blocks
 * holding five rooms and three garages; Central Library is half a mile north
 * of them and gets an inset. One frame holding both stood 940 m tall, which on
 * a laptop is a map you scroll rather than read.
 */

export type MapPinKind = "badge" | "parking" | "room";

export interface MapPin {
  id: string;
  kind: MapPinKind;
  name: string;
  /** Two words at most — this rides beside the pin on the map itself. */
  short: string;
  address: string;
  /** The line that matters for this kind: a rate, a floor, an hour. */
  note: string;
  lat: number;
  lon: number;
  /** Where to read more — the garage's terms, or the room's own page. */
  href?: string;
  hrefLabel?: string;
  /**
   * Where the name sits, in metres from the pin, where the default collides.
   *
   * The default is "to the right, flipping left past the frame's midline",
   * which is right for scattered pins and wrong for this map: Legacy Park,
   * City Tower and The Rand sit within 116 m of each other on one line. Three
   * are placed by hand, which is what a cartographer would do and what an
   * algorithm would take fifty lines to do worse.
   */
  label?: { dx: number; dy: number; anchor: "start" | "middle" | "end" };
}

/** Google Maps, with the coordinate rather than a search string. */
const directions = (p: MapPin) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

const KIND = {
  badge: {
    label: "Badge pickup",
    dot: "fill-magenta",
    ring: "stroke-magenta",
    chip: "bg-magenta text-white",
    swatch: "bg-magenta",
  },
  /**
   * White, not the house's second accent.
   *
   * Space blue is #00266f, which on black is a hole — the same problem the
   * San Antonio Report mark had on the partner wall. On a dark map the second
   * class has to be the other end of the value scale, so parking is white and
   * the week's one accent stays the badge desks'.
   */
  parking: {
    label: "Parking",
    dot: "fill-white",
    ring: "stroke-white",
    chip: "bg-white text-black",
    swatch: "bg-white",
  },
  room: {
    label: "Other rooms",
    dot: "fill-white/40",
    ring: "stroke-white/40",
    chip: "bg-white/25 text-white",
    swatch: "bg-white/40",
  },
} as const;

const GROUND = "#050505";

function Plan({
  view,
  pins,
  openId,
  onOpen,
  className,
  scale = 1,
  hit,
}: {
  view: MapView;
  pins: MapPin[];
  openId: string | null;
  onOpen: (id: string | null) => void;
  className?: string;
  /** The inset draws at a third the width, so its type has to be bigger. */
  scale?: number;
  /**
   * The tap radius, in metres. Scaled with everything else by default, and
   * overridden on the inset: Central Library and its garage are 55 m apart,
   * so a target scaled to 68 m swallowed its neighbour's centre and one of
   * the two pins could not be opened at all.
   */
  hit?: number;
}) {
  const [x0, , w] = view.frame;
  const s = (n: number) => Math.round(n * scale);
  return (
    <svg
      viewBox={view.frame.join(" ")}
      className={cn("block h-auto w-full", className)}
      /**
       * Every size on this map is in user units, so it scales with the
       * viewBox: what reads at 880px wide is a third the size at 342. So each
       * one is a pair — the phone value and the sm+ value — set here, scaled
       * by `scale` for the inset, and switched by a media query on the element
       * that uses it. It is the only way to hold a pixel size steady inside a
       * responsive viewBox without measuring the element at run time.
       */
      style={
        {
          background: GROUND,
          "--map-street": `${s(19)}px`,
          "--map-street-sm": `${s(13)}px`,
          "--map-type": `${s(26)}px`,
          "--map-type-sm": `${s(17)}px`,
          "--map-r": `${s(24)}px`,
          "--map-r-sm": `${s(16)}px`,
          "--map-r-room": `${s(18)}px`,
          "--map-r-room-sm": `${s(12)}px`,
          "--map-ring": `${s(42)}px`,
          "--map-ring-sm": `${s(32)}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Map of downtown San Antonio showing badge pickup desks and parking garages"
    >
      {/* Water first, then streets over it — the river passes under most of
          these blocks, and a bridge drawn under its own road reads as a gap in
          the street. */}
      <g
        fill="none"
        stroke="currentColor"
        // Space blue, dimmed on the group rather than on the colour. The
        // river arrives as nine overlapping runs — the river, the creek and
        // the water polygons that share their banks — so a per-stroke alpha
        // compounds where they cross and the band came out nearly solid. One
        // opacity on the group composites the whole thing once.
        className="text-space-blue"
        opacity={0.5}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {view.rivers.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g
        fill="none"
        stroke="currentColor"
        className="text-white/[0.09]"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {view.minor.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g
        fill="none"
        stroke="currentColor"
        className="text-white/[0.18]"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {view.major.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Street names ride their own street, at its angle.

          Font size is in user units here, so it scales with the viewBox: a
          size that reads on a 900px map is five pixels on a phone. `scale`
          carries the inset, and the media query carries the phone. */}
      <g className="select-none fill-white/35 font-mono uppercase tracking-[0.18em]">
        {view.labels.map((l) => (
          <text
            key={l.t}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            transform={`rotate(${l.a} ${l.x} ${l.y})`}
            className="[font-size:var(--map-street)] sm:[font-size:var(--map-street-sm)]"
          >
            {l.t}
          </text>
        ))}
      </g>

      {pins.map((pin) => {
        const { x, y } = project(view, pin.lat, pin.lon);
        const k = KIND[pin.kind];
        const isOpen = pin.id === openId;
        const flip = x > x0 + w * 0.62;
        const lab = pin.label ?? {
          // 36, not 30: the dot is 24 m across on a phone against 16 on a
          // desktop, and a label set to clear the small one sits on the big
          // one.
          dx: flip ? -36 : 36,
          dy: 0,
          anchor: flip ? ("end" as const) : ("start" as const),
        };
        return (
          <g key={pin.id}>
            {/* The hit target is the block, not the dot: a 12px circle is a
                fair drawing and an unfair tap. */}
            <circle
              cx={x}
              cy={y}
              r={hit ?? s(40)}
              fill="transparent"
              className="cursor-pointer outline-none"
              role="button"
              tabIndex={0}
              aria-label={`${pin.name} — ${k.label}`}
              aria-pressed={isOpen}
              onClick={() => onOpen(isOpen ? null : pin.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(isOpen ? null : pin.id);
                }
              }}
            />
            {isOpen && (
              <circle
                cx={x}
                cy={y}
                fill="none"
                strokeWidth={3}
                className={cn(
                  k.ring,
                  "pointer-events-none opacity-70 [r:var(--map-ring)] sm:[r:var(--map-ring-sm)]",
                )}
              />
            )}
            <circle
              cx={x}
              cy={y}
              // `pointer-events-none` on everything the hit target sits
              // under. Without it the dot eats the click at the one place a
              // reader is most likely to aim — its own centre — and the event
              // reaches no handler at all, because the target is a sibling
              // rather than an ancestor.
              className={cn(
                k.dot,
                "pointer-events-none",
                pin.kind === "room"
                  ? "[r:var(--map-r-room)] sm:[r:var(--map-r-room-sm)]"
                  : "[r:var(--map-r)] sm:[r:var(--map-r-sm)]",
              )}
              stroke={GROUND}
              strokeWidth={4}
            />
            {pin.kind === "parking" && (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none font-display font-bold [font-size:var(--map-type)] sm:[font-size:var(--map-type-sm)]"
                fill={GROUND}
              >
                P
              </text>
            )}
            {/* The name, beside the pin. A map whose pins have to be tapped
                before they say what they are is a quiz. */}
            <text
              x={x + lab.dx * scale}
              y={y + lab.dy * scale}
              textAnchor={lab.anchor}
              dominantBaseline="central"
              className={cn(
                "pointer-events-none select-none font-display font-bold uppercase tracking-tight",
                "[font-size:var(--map-type)] sm:[font-size:var(--map-type-sm)]",
                pin.kind === "room" ? "fill-white/55" : "fill-white",
              )}
              style={{
                paintOrder: "stroke",
                stroke: GROUND,
                strokeWidth: 6,
                strokeLinejoin: "round",
              }}
            >
              {pin.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DowntownMap({ pins }: { pins: MapPin[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = pins.find((p) => p.id === openId) ?? null;
  const NORTH_IDS = new Set(["central-library", "Library Garage"]);
  const here = pins.filter((p) => !NORTH_IDS.has(p.id));
  const there = pins.filter((p) => NORTH_IDS.has(p.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
      <div className="overflow-hidden rounded-xl border border-white/10">
        <Plan
          view={DOWNTOWN}
          pins={here}
          openId={openId}
          onOpen={setOpenId}
          className="border-b border-white/10"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-white/[0.03] px-4 py-3">
          {(["badge", "parking", "room"] as const).map((k) => (
            <span
              key={k}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]"
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  KIND[k].swatch,
                )}
              />
              {KIND[k].label}
            </span>
          ))}
          {/* ODbL's condition, not decoration — see tools/downtown-map. */}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/30">
            ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-white/60"
            >
              OpenStreetMap
            </a>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        {/* The panel holds its place whether or not a pin is open, so
            selecting one does not shunt the page under the reader's thumb. */}
        <div className="min-h-[13rem] rounded-xl border border-white/10 bg-white/5 p-5">
          {open ? (
            <>
              <p
                className={cn(
                  "inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                  KIND[open.kind].chip,
                )}
              >
                {KIND[open.kind].label}
              </p>
              <p className="mt-3 font-display text-lg font-bold uppercase leading-tight tracking-tight text-white">
                {open.name}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
                {open.address}
              </p>
              <p className="mt-3 text-pretty text-sm text-white/70">
                {open.note}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={directions(open)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-magenta px-3 py-2 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  Directions
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                {open.href && (
                  <a
                    href={open.href}
                    target={open.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      open.href.startsWith("http") ? "noreferrer" : undefined
                    }
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-white/70 transition-colors hover:text-white"
                  >
                    {open.hrefLabel ?? "More"}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-widest text-magenta">
                The map
              </p>
              <p className="mt-3 text-pretty text-sm text-white/70">
                Three badge desks, four garages and the rooms between them. Tap
                a pin for the address, the rate and directions.
              </p>
            </>
          )}
        </div>

        {/* The inset. Central Library is half a mile north of everything else
            here, and one frame holding both was six hundred metres of empty
            middle. */}
        <div className="overflow-hidden rounded-xl border border-white/10">
          <Plan
            view={NORTH}
            pins={there}
            openId={openId}
            onOpen={setOpenId}
            scale={1.7}
            hit={24}
            className="border-b border-white/10"
          />
          <p className="bg-white/[0.03] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
            Central Library · ½ mile north
          </p>
        </div>
      </div>
    </div>
  );
}
