"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
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

// One venue, as a card: portrait on top, the facts under it, the whole thing
// a link to that room's page.
//
// This replaced a full-bleed row per venue — portrait and copy butted flush
// into a 416px rectangle, three of them stacked, alternating sides. That was
// the right shape while the homepage had no speakers and no sessions on it:
// the rooms were the only concrete thing the page could show, and they were
// worth 1,927px of it.
//
// They are not any more. The week board two sections up now names twenty
// sessions with their times and rooms, and the lineup above names the people
// — so the venue rows were spending a quarter of the page restating, at
// length, the least decision-relevant fact on it. Nobody chooses a week by
// building; they choose by event, by speaker or by day, and which room it is
// in matters once they are already coming.
//
// So the per-room session list is gone with the rows. It is a duplicate of
// the board's, told worse: no times, no order, no link per session. What a
// card keeps is what only this section says — the host, the circuit the room
// carries, how much is on there, and the way through to the room's own page.
//
// Same frame for all three, which is the rule the rows already followed and
// for the same reason: the anchor draws the partner-led programming, but the
// community floor and the small-business house are hosts in their own right
// and a smaller card would say otherwise.
function VenueCard({
  room,
  index,
  count,
}: {
  room: Room;
  index: number;
  /** From the schedule, not from `room.sessions` — see the note on RoomFlow. */
  count: number;
}) {
  const reduce = useReducedMotion();
  const isAnchor = room.tier === "anchor";
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
    >
      <Link
        href={`/schedule/${room.slug}`}
        className="group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
      >
        {/* One shared box, and the whole picture inside it.
            
            `object-cover` fitted the box by cropping, which on this art costs
            the thing the art is for: these are drawn building portraits, and
            the crop was taking roof or sign off the top of two of them. So
            the box is a frame and the image is `contain` — no room loses part
            of its own building to make three cards line up.
            
            6:5 rather than the rows' 4:3, because it is the ratio that costs
            all three the least. The portraits are 1.50, 0.97 and 1.14 wide;
            against 1.20 that is a 10% band top and bottom on the widest and
            under 10% either side on the narrowest, where 4:3 would have put
            14% down both sides of the two near-square ones.
            
            Nothing behind it at all, and that is the point. A ground of any
            kind turns the space `contain` leaves into a frame — and the card
            had one that changed on hover, so the frame was invisible at rest
            and appeared the moment the pointer arrived, which reads as the
            image having shrunk. On the section's own black there is no edge
            to see: the portraits are drawn on near-black themselves, so the
            picture simply ends where it ends. The panel below keeps the fill,
            because a caption block is a thing and a matte is not. */}
        <div
          ref={boxRef}
          onMouseEnter={() => setLit(true)}
          onMouseLeave={() => setLit(false)}
          onMouseMove={onMove}
          className="relative aspect-6/5 overflow-hidden"
        >
          <Portrait
            room={room}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="h-full w-full object-contain"
          />

          {/* Light raised under the cursor, not across the whole picture.
              These portraits are ~75–85% near-black, so `brightness` alone
              lifts only the magenta halftone — the ground stays black and the
              dots come up, which is the effect wanted. `saturate` keeps them
              from drifting pink as they climb.

              Skipped entirely under reduced motion: the pool is driven by
              pointer movement, so there is nothing to show if it cannot
              follow. */}
          {!reduce && (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 transition-opacity duration-300",
                lit ? "opacity-100" : "opacity-0",
              )}
              style={{
                WebkitMaskImage: GLOW,
                maskImage: GLOW,
                backdropFilter: "brightness(2.1) saturate(1.25)",
                WebkitBackdropFilter: "brightness(2.1) saturate(1.25)",
              }}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col bg-white/[0.03] p-5 transition-colors duration-300 group-hover:bg-white/[0.06]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-widest text-white/50">
              {room.host}
            </span>
            {/* The anchor is the one room every circuit runs through, so it
                gets the five-charge ramp — a glyph compact enough to sit
                beside the host. A named circuit cannot: "Small Business &
                Solopreneur" wraps here and takes the host with it, so those
                rooms name their circuit under the venue instead. Same fact,
                placed where it fits. */}
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

          <h3 className="mt-3.5 flex items-start gap-2 font-display text-2xl font-bold uppercase leading-none text-white transition-colors duration-200 group-hover:text-magenta">
            <span className="text-balance">{room.name}</span>
            <ArrowUpRight
              className={cn(
                ARROW_MOTION,
                "size-4 shrink-0 self-center text-white/30 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </h3>

          {/* Every card names its circuit in the same place.
              
              The anchor had nothing here: it carries all five circuits, so
              there was no single name to print, and the five-charge ramp in
              the host row above was standing in for it. That works as a glyph
              and not as alignment — TPR's name sat straight on its blurb
              while the two beside it had a chip between, so the one card that
              is meant to lead read as the one that was missing a line. It
              gets the fact in words instead, in the same chip, and keeps the
              ramp as the picture of it. */}
          <div className="mt-3">
            {isAnchor ? (
              <span className="rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-magenta">
                All five circuits
              </span>
            ) : (
              <CircuitChip room={room} />
            )}
          </div>

          <p className="mt-3 text-pretty text-sm text-white/60">{room.desc}</p>

          {/* How much is on, not what. The titles live on the board above with
              their times and their own links; a second, worse copy of them
              here is what made this section long. */}
          <p className="mt-auto pt-5 font-mono text-[11px] uppercase tracking-widest text-white/45">
            <span className="text-white/70">{count}</span>{" "}
            {count === 1 ? "session" : "sessions"} confirmed
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export function RoomFlow({
  counts,
}: {
  /**
   * Room slug → how many the schedule puts there, spans included.
   *
   * Passed in rather than read here: this is a client component, and the
   * count has to see the CMS's sessions, which only the server can. The page
   * reads them once for the board and hands the tally over.
   */
  counts: Record<string, number>;
}) {
  // Anchor first, then the day rooms in ROOMS order. Position is the only
  // hierarchy left in the section now that the frames match.
  const rooms = ROOMS.filter((r) => r.tier === "anchor" || r.tier === "day");

  // The two single-activation rooms don't get a portrait panel — a text-only
  // tile is the weakest thing in a section this dependent on artwork — but
  // they can't be silent either. The footer claims five rooms while this
  // section showed three, and Startup Bash appeared nowhere on the homepage
  // at all. A named line each keeps the count honest and gets them a link.
  const alsoRooms = ROOMS.filter((r) => r.tier === "single");

  return (
    <section className="bg-black">
      {/* py-16 on phones, py-32 from lg — the mobile step is deliberately
          half the desktop one rather than three quarters of it.
    
          Every homepage section ran py-24 on mobile, which put ~160px of black
          between each pair of sections and about 800px across the page: a
          whole extra phone screen of scrolling made of nothing. Desktop keeps
          its spacing, where the same gaps read as air rather than as distance.
          Measured either side. */}
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
        {/* A grid rather than nested rows, so the CTA can sit in a different
            place at each size from one piece of markup. Source order is
            eyebrow → headline → blurb → button, which is what stacks on
            mobile; from lg the explicit placement lifts the button into the
            headline's row, bottom-aligned with it, filling a right half that
            was otherwise ~45% empty black. */}
        <div className="grid gap-x-16 lg:grid-cols-[1fr_auto]">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta lg:col-start-1 lg:row-start-1">
            San Antonio · Sept 28 – Oct 2
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
              so it survives the two rooms still to come back.

              Second sentence added when the cards lost their session lists.
              The line named the hosts and stopped, which was enough while
              each panel printed its room's programme underneath; a card that
              now says "4 sessions confirmed" and nothing else needs the copy
              above it to say where the four are. */}
          <p className="mt-4 max-w-xl text-pretty text-white/60 lg:col-start-1 lg:row-start-3">
            Every room has its own host and its own week. Open one to see
            everything running there, start to finish.
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
            href="/schedule"
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

        {/* The rooms with building portraits, side by side. The other two
            follow as a named line rather than a weak tile.
            
            One row of three at lg, where the rows were three stacked panels
            of 416px. `items-stretch` is implied by the grid and load-bearing:
            the cards' feet line up because the session count is `mt-auto`. */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <VenueCard
              key={room.slug}
              room={room}
              index={i}
              count={counts[room.slug] ?? 0}
            />
          ))}
        </div>

        {alsoRooms.length > 0 && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
              Also lighting up
            </p>
            {/* Two lines on a phone, one from sm.
                
                It was a baseline-aligned inline row at every width, and below
                sm that fell apart: "Trinity University" takes two lines in a
                342px column, so its session title started at the *first*
                line's baseline and wrapped as well — the venue's second line
                and the event's first ending up side by side at two different
                left edges, with the arrow somewhere after both. The three
                rows also began their detail text at three different x
                positions, which is what made a list of three read as three
                unrelated pairs.
                
                Stacked, each row has one left edge and each piece has the
                width it needs: "Stumberg Venture Competition" sets on one
                line at 11px, where sharing a line with an 18px display name
                was the only reason it ever wrapped. */}
            <ul className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-10">
              {alsoRooms.map((room) => (
                <li
                  key={room.slug}
                  // A rule between rows on a phone, where they stack and need
                  // separating; from sm they sit side by side on one line and
                  // the `gap-x-10` is separation enough.
                  className="border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0 sm:border-b-0 sm:py-0"
                >
                  <Link
                    href={`/schedule/${room.slug}`}
                    className="group flex flex-col gap-1 transition-colors duration-200 hover:text-magenta sm:flex-row sm:items-baseline sm:gap-2.5"
                  >
                    {/* The arrow travels with the name rather than trailing
                        the whole row: stacked, it would otherwise sit at the
                        end of the session title, two lines from the thing it
                        is an affordance for. */}
                    <span className="flex items-baseline gap-2">
                      <span className="font-display text-lg font-bold uppercase tracking-tight text-white transition-colors duration-200 group-hover:text-magenta">
                        {room.name}
                      </span>
                      {/* An explicit colour, because it had none.
                          
                          The name and the detail beside it both set their
                          own, so the arrow was the one thing here inheriting
                          — and what it inherited was the document's default
                          black, on a black section. Measured
                          `rgb(0, 0, 0)`: the only affordance saying these
                          three rooms are links has been invisible at every
                          width. `white/30` rising to magenta is what the
                          week board's day heads use for the same job. */}
                      <ArrowUpRight
                        className={cn(
                          ARROW_MOTION,
                          "h-3.5 w-3.5 shrink-0 self-center text-white/30 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta",
                        )}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="font-mono text-[11px] uppercase leading-relaxed tracking-widest text-white/45">
                      {room.sessions.map((s) => s.title).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
