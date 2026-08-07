"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
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

// The pool of raised light that follows the cursor across a portrait.
//
// A mask, not a painted gradient: the overlay carries `backdrop-filter`, and
// masking it clips where that filter applies. So the picture underneath is
// genuinely brightened inside the pool rather than having a translucent white
// wash laid over it — which on halftone art would fog the black between the
// dots instead of lighting the dots themselves.
//
// The falloff runs all the way out with only a small solid core; a hard rim
// is what makes a spotlight read as a disc stuck to the page.
const GLOW =
  "radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), #000 0%, #000 10%, transparent 100%)";

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
            <span className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/55">
              {s.kind}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// One venue row, used for all three rooms — portrait and breakdown butted
// flush into a single hard-edged rectangle, contained rather than bled.
//
// Square corners, no border, no glow. That combination was what made an
// earlier full-width version read as a sticker laid on the page; containment
// was never the problem. Flush edges and a solid panel do the integrating
// instead, so a row stays inside the same margins as everything else.
//
// This used to be two components: a wide anchor for Texas Public Radio and a
// pair of half-width tiles for the others. The anchor draws the partner-led
// programming, but the community floor and the small-business house are hosts
// in their own right, and a tile half the size said otherwise. Same frame for
// all three now; what differs between them is what's true — how many circuits
// a room carries, and what's on its schedule.
//
// Each row links on to that venue's own page, which is where a full week of
// programming belongs — this panel shows what's confirmed, not everything.
function VenueRow({ room, index }: { room: Room; index: number }) {
  const reduce = useReducedMotion();
  const isAnchor = room.tier === "anchor";
  const flip = index % 2 === 1;
  const [lit, setLit] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Pointer position goes straight to CSS vars rather than through state — the
  // mask reads them, so the pool tracks the cursor without a React render per
  // mousemove.
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
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.6,
        delay: reduce ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      // Alternating sides, so three identical rows read as a column of
      // distinct venues rather than one row repeated. Both the template and
      // the order flip: the wide cell has to move with the portrait, or the
      // image lands in the narrow column and the copy gets the big one.
      //
      // Only from lg. Stacked, every row is portrait-then-panel — alternating
      // there would just make the reading order unpredictable.
      className={cn(
        "grid overflow-hidden",
        // `auto` for the portrait column, not a fraction. A fixed fraction
        // forces every room's art into the same width, and these three don't
        // share an aspect (1.50, 0.97, 1.14) — so the two near-square marks
        // had to letterbox inside it, leaving 135–170px of black either side.
        // Sizing the column to the image instead means no bars and no crop;
        // the shared row height is what keeps the rhythm.
        flip ? "lg:grid-cols-[1fr_auto]" : "lg:grid-cols-[auto_1fr]",
      )}
    >
      {/* Height is the constant, width follows the art. Every row is 26rem
          tall at lg, so the section keeps one rhythm, and each image arrives
          at its own natural width inside that — uncropped, and with no black
          either side of it.

          The trade is that the seam between portrait and panel sits at a
          different point in each row (624 / 403 / 473 px of image at 1440).
          Alternating sides makes that read as a spread rather than as three
          rows failing to line up.

          Below lg the row stacks and the image simply runs full width at its
          own aspect — nothing to fit it into, so nothing to letterbox. */}
      <div
        ref={boxRef}
        onMouseEnter={() => setLit(true)}
        onMouseLeave={() => setLit(false)}
        onMouseMove={onMove}
        className={cn("relative bg-black", flip && "lg:order-2")}
      >
        <Portrait
          room={room}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-auto lg:h-104 lg:w-auto lg:max-w-none"
        />

        {/* Light raised under the cursor, not across the whole picture. These
            portraits are ~75–85% near-black, so `brightness` alone lifts only
            the magenta halftone — the ground stays black and the dots come up,
            which is the effect wanted. `saturate` keeps them from drifting
            pink as they climb.

            Skipped entirely under reduced motion: the pool is driven by
            pointer movement, so there's nothing to show if it can't follow. */}
        {!reduce && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-300",
              lit ? "opacity-100" : "opacity-0",
            )}
            style={{
              maskImage: GLOW,
              WebkitMaskImage: GLOW,
              backdropFilter: "brightness(2.1) saturate(1.2)",
              WebkitBackdropFilter: "brightness(2.1) saturate(1.2)",
            }}
          />
        )}
      </div>

      {/* The breakdown. Black, so the panel sits on the page rather than on a
          tinted plate; the portrait's top and bottom edges do the framing
          instead, which is why the name aligns to one and the session list to
          the other.

          It used to reveal a magenta current under the cursor — a shader
          masked to a pool that tracked the pointer. That was the panel's only
          answer to being hovered, back when nothing in it was clickable. Now
          each row has a real link, and a whole panel lighting up competed
          with it: it implied the panel itself was the target, and left the
          one thing you can actually click doing the quieter job. The hover
          state belongs to the link now. It also drops three WebGL contexts
          from the homepage, which had four. */}
      <div className={cn("relative bg-black", flip && "lg:order-1")}>
        <div className="relative h-full overflow-hidden">
          {/* `max-w-2xl` because the panel is no longer a fixed fraction: a
              room whose art is narrow hands its column the difference, and at
              765px the blurb ran past a readable measure while the session
              list threw each circuit label a third of a screen from its
              title. The cap only bites on the wider panels. */}
          <div className="relative z-10 flex h-full max-w-2xl flex-col p-6 lg:p-8">
            <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                {room.host}
              </span>
              {/* The anchor is the one room every circuit runs through, so it
                  gets the five-charge ramp — a glyph compact enough to sit
                  beside the host. A named circuit can't: "Small Business &
                  Solopreneur" wrapped to two lines here and forced the host
                  to wrap with it, so those rooms name their circuit under the
                  venue instead. Same fact, placed where it fits. */}
              {isAnchor && (
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
              )}
            </div>
            <h3 className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-3xl">
              {room.name}
            </h3>
            {!isAnchor && (
              <div className="mt-2.5">
                <CircuitChip room={room} />
              </div>
            )}
            <p className="mt-2.5 text-base text-white/60">{room.desc}</p>

            {/* Straight after the blurb, not pinned to the panel's foot. The
                list used to carry `mt-auto`, which parked every row's slack in
                one 90px hole between the summary and the schedule — the copy
                read as two disconnected halves. The slack now collects below
                the button, where an empty margin is just breathing room. */}
            <SessionList room={room} showKind />

            {/* A real button rather than the mono text link this was. Three
                rows each ending in a small caption gave the section no
                terminus, and the panel had height to spare — a button uses
                some of it and makes the target obvious.

                `ghost` rather than `outline`, carrying its own fill: nothing
                else in this section is bordered — the portrait butts flush
                against the panel and the card has no frame — so an outlined
                button was the only ruled box on the row. A tinted plate reads
                as a button without drawing an edge that fights that.

                `duration-200` on both button and arrow, because buttonClass
                ships bare `transition-colors` — Tailwind's 150ms default —
                and against a 300ms arrow one hover reads as two events. */}
            {/* The venue name is dropped from the visible label below sm and
                carried by `aria-label` instead. On a phone the panel is ~294px
                wide and "See the full week at Texas Public Radio" needs ~360 —
                it wrapped inside a fixed-height button and spilled out of it.
                Shortened it fits every width down to 320.

                The accessible name still contains the visible text, so this
                satisfies WCAG 2.5.3 Label in Name, and screen readers get the
                venue on every breakpoint — which is what stops three links
                reading identically in a link list. `whitespace-nowrap` so the
                short form can't wrap either. */}
            <div className="mt-auto pt-7">
              <ButtonLink
                href={`/sessions/${room.slug}`}
                aria-label={`See the full week at ${room.name}`}
                variant="ghost"
                size="md"
                className="group bg-white/10 text-white duration-200 hover:bg-white/20"
              >
                <span className="whitespace-nowrap">
                  See the full week
                  <span className="hidden sm:inline"> at {room.name}</span>
                </span>
                <ArrowUpRight
                  className={cn(
                    ARROW_MOTION,
                    "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  )}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function RoomFlow() {
  // Only the anchor and the all-week rooms are rendered. The two
  // single-activation rooms (300 Main, Legacy Park) stay in ROOMS but have no
  // surface on the homepage now — they need /sessions or a venues page.
  //
  // Anchor first, then the day rooms in ROOMS order. Position is the only
  // hierarchy left in the section now that the frames match.
  const rooms = ROOMS.filter((r) => r.tier === "anchor" || r.tier === "day");

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

          {/* Not a list of the rooms below. This used to read "From the main
              stage, to the community floor, small-business house, and more",
              which previewed three labels the panels then repeated verbatim —
              "main stage" is TPR's own tag, "community floor" is a phrase in
              The Rand's blurb, "small-business" is Central Library's chip. It
              also ended on "and more", gesturing at two rooms this section
              doesn't render.

              What the panels can't say individually is the thing they have in
              common: each is a different host running its own week. No count,
              so it survives the two rooms still to come back. */}
          <p className="mt-4 max-w-xl text-pretty text-white/60 lg:col-start-1 lg:row-start-3">
            Every room, its own host and its own programming — run by the orgs
            already building here.
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
          {rooms.map((room, i) => (
            <VenueRow key={room.slug} room={room} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
