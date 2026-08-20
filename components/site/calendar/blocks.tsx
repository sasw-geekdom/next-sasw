"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, Check } from "lucide-react";
import {
  BoltDrift,
  MascotBurst,
  PysaMascot,
} from "@/components/site/calendar/event-particles";
import { cn } from "@/lib/utils";
import type { CalendarBrand, CalendarItem, CalendarSpan } from "@/lib/schedule";

// What a calendar draws inside a column: one activation, a venue's whole run
// of them, or a bar on the all-day rail. Shared by the week view and the day
// view, which differ in what their columns mean — days in one, venues in the
// other — and not at all in what a block looks like.

/** Anything the axis can place: it only needs to know when it starts and ends. */
export interface Interval {
  startMin: number;
  endMin: number;
}

/** Lane assignment, added to whatever was passed in. */
export type Placed<T> = T & { lane: number; lanes: number };

/**
 * Assign each item a column within its cluster of overlapping items.
 *
 * Two passes over one sorted list. A cluster is a run of items connected by
 * overlap — transitively, so A–B and B–C put all three in one cluster even
 * where A and C never touch. Every item in a cluster shares its lane count, so
 * blocks in the same collision are the same width and their left edges line
 * up; sizing each item by its own overlaps instead leaves a ragged column that
 * reads as broken rather than as information.
 *
 * Greedy first-fit within the cluster: reuse the earliest lane whose last
 * item has already ended, and only open a new one when none has. Input must
 * be sorted by start — `weekCalendar` does that, with a venue tiebreak so the
 * assignment is stable between renders.
 */
export function placeLanes<T extends Interval>(items: T[]): Placed<T>[] {
  // Generic over the thing being placed, because the week view no longer
  // places only sessions — a dense day places one summary block per venue,
  // and both kinds share a column and have to share a lane count.
  const out: Placed<T>[] = [];
  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const assigned = cluster.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.startMin);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.endMin;
      return { item, lane };
    });
    for (const { item, lane } of assigned) {
      out.push({ ...item, lane, lanes: laneEnds.length });
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of items) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();
  return out;
}

/**
 * Whether a block has height to spare beyond its mark.
 *
 * This began as `blurbLines`, returning how many lines of description would
 * fit, because the block carried the activation's blurb. The blurb is gone —
 * a calendar block is a label, not a place to read — and what the maths was
 * really computing survives it: whether there is room under the mark for the
 * two mono rows that say which strand and which room.
 *
 * A thirty-minute slot has neither, and prints its time instead. That is the
 * one case where a block still needs to state its own hours: the axis says so
 * by position, but at half an hour the position is too fine to read off the
 * gutter at a glance.
 */
export function hasSpareRows(
  startMin: number,
  endMin: number,
  hourPx: number,
): boolean {
  const height = ((endMin - startMin) / 60) * hourPx;
  // The mark plus the block's own padding, then two 16px rows for the strand
  // and the room.
  return height - 58 >= 32;
}

/**
 * The tallest a lockup may draw inside an axis block, or undefined for no
 * extra limit beyond the size cap.
 *
 * Width-led sizing is right while height is the plentiful axis, which it was
 * for as long as the shortest thing on the grid ran two hours — 120px, and a
 * 44px mark sat in it with room underneath. The Rand's Tuesday introduced the
 * first one-hour blocks: 60px, 52px of content box, and the same 44px mark
 * left 8px for two rows of meta that need about 26. Nothing reported an error,
 * because the rows were not dropped — they were drawn and clipped, so two of
 * the three blocks silently lost their time and venue while the third, whose
 * mark happens to be a 10:1 lockup that draws 15px tall, kept both.
 *
 * So height becomes the binding constraint below a certain block, and the cap
 * has to come off the block rather than off a size bucket. `lockupHeight`
 * already takes a max and mins against it, which means passing a smaller one
 * turns the same call height-led exactly where it needs to be.
 */
export function axisMarkCap(
  startMin: number,
  endMin: number,
  hourPx: number,
): number | undefined {
  // Blocks with room to spare keep the size-bucket cap they always had; this
  // is only about the short ones.
  if (hasSpareRows(startMin, endMin, hourPx)) return undefined;
  const height = ((endMin - startMin) / 60) * hourPx;
  // 20px of chrome — 6 of wrapper padding, 2 of border, 12 of the block's own
  // — then 20 for the single meta row: 9px mono on a 13.5px line, plus the 6px
  // that separates it from the mark. A 60px block is left 40px of content box,
  // and 20 of that is mark.
  //
  // The gap was 2px on the first pass, which is what was left over rather than
  // what the mark needed. At that distance a lockup and the time under it read
  // as one smudged object; the mark gives up 4px and the block becomes legible.
  //
  // Measured, and worth keeping that way. These rows are flex children with
  // the default `flex: 0 1 auto`, so a cap that is over budget does not push
  // them out of the block where it would be obvious — it *shrinks* them, to
  // 6px against a 13.5px line, and the glyphs spill back over the mark. Two
  // attempts sized against 52px and 54px did exactly that before the content
  // box turned out to be 40.
  return Math.max(14, height - 20 - 20);
}

/**
 * How tall to draw a lockup, so marks of different shapes carry equal weight.
 *
 * Height-led sizing — one fixed height for every mark, which is what
 * session-bento does — breaks down at this scale. The lockups run from 4.24:1
 * (PySanAntonio) to 2.00:1 (1 Million Cups, which is stacked), so at a shared
 * 24px the stacked mark draws 48px wide against PySanAntonio's 102px and its
 * two lines of type become unreadable, while the wide ones are fine.
 *
 * Width-led instead: aim every mark at roughly the same drawn width and let
 * the height follow its ratio, bounded at both ends so a very tall mark can't
 * push the block's copy out and a very wide one can't shrink to a hairline.
 */
export function lockupHeight(
  lockup: { width: number; height: number },
  targetWidth: number,
  max: number,
): number {
  const ratio = lockup.width / lockup.height;
  return Math.min(max, Math.max(14, Math.round(targetWidth / ratio)));
}

/**
 * An activation's own mark, at block size.
 *
 * The activations with a brand split into two kinds. Only Access Granted and
 * The Model are set in type at all, and both use faces the site already loads
 * (Oswald and Geist Mono); PySanAntonio, the pitch events and Give-a-LOT are
 * lockup files, where the letterforms are artwork rather than a font. So this
 * draws the two typeset marks and places the images for the rest — the same
 * split session-bento's `BrandLockup` makes, keyed the same way (`page`, not
 * title).
 *
 * Returns null where an activation has no mark, and the caller typesets the
 * plain title instead.
 */
/**
 * Which mark this brand can draw here, or null for none.
 *
 * Computed rather than inferred from a null render, because the caller has to
 * typeset the title in the same slot when there is nothing to draw — and the
 * answer now depends on size, not just on what the brand owns. Startup Bash's
 * mark is set in Geist Pixel, which model-band measured as only resolving as a
 * pixel face above ~22px; below that it is a mono wearing a display face's
 * costs. So it draws at row scale and nowhere else.
 */
export function markKind(
  brand: CalendarBrand | undefined,
  dense: boolean,
  size: "sm" | "md" | "lg",
): "wordmark" | "lockup" | null {
  if (!brand) return null;
  if (brand.wordmark === "startup-bash") return size === "sm" ? null : "wordmark";
  if (brand.wordmark) return "wordmark";
  if (brand.lockup && !dense) return "lockup";
  return null;
}

function BrandMark({
  brand,
  title,
  dense,
  markMax,
  size = "sm",
}: {
  brand: CalendarBrand;
  title: string;
  /** A lane too narrow to draw an image lockup in. */
  dense: boolean;
  /**
   * A hard ceiling from the block's own height, where it has one.
   *
   * Overrides the size bucket when it is smaller. See `axisMarkCap`.
   */
  markMax?: number;
  /**
   * How much room the mark has.
   *
   * "lg" is the mobile stack and a block with a lane to itself. "md" is a lane
   * shared with one other — the common case on Monday and Wednesday, and
   * previously lumped in with "sm", which sized every mark for the worst case
   * a quarter-width lane presents. "sm" is that genuine worst case.
   *
   * Only the typeset marks really need the distinction: they wrap, so an
   * oversized cut spills out of a narrow lane. Image lockups clamp instead,
   * and only take the step up in their height cap.
   */
  size?: "sm" | "md" | "lg";
}) {
  const lg = size === "lg";
  const roomy = size !== "sm";
  if (brand.wordmark === "access-granted") {
    return (
      // The same split the band and the social graphics carry: the first word
      // in the green, the rest in white.
      <span
        className={cn(
          "font-display font-bold uppercase leading-tight tracking-tight text-white",
          lg ? "text-2xl lg:text-3xl" : roomy ? "text-lg" : "text-sm",
        )}
      >
        <span style={{ color: brand.accent }}>Access</span> Granted
      </span>
    );
  }

  if (brand.wordmark === "startup-bash") {
    return (
      // The week's own logo and the word that makes it a party. Startup Bash
      // is the one activation SASTW runs itself, so its mark is the house
      // mark — there is no partner brand to defer to, and a plain typeset
      // title said nothing about what the evening is.
      //
      // Oswald, not Geist Pixel. The pixel face was tried here because it was
      // already vendored and unused, and it read as a borrowed voice: it
      // belonged to The Model's retired brand sheet, not to SASTW. The house
      // event should wear the house display face — set beside the logo, the
      // two read as one lockup finishing the wordmark rather than as a logo
      // with a graphic next to it. app/fonts/pixel.ts goes back to being dead
      // code; see the note in globals.css.
      //
      // The logo leads on size and the word follows. Reversed, a 36px "BASH"
      // beside a 24px logo made the word the mark and the logo its footnote.
      // `items-center`, not `items-baseline`. The logo is the tallest thing on
      // the line, so baseline alignment pinned the word's baseline to the
      // line's and left its centre 7px above the logo's — measured, not
      // guessed. Two all-caps marks side by side want their centres matched,
      // not their baselines, because the logo's baseline is buried inside a
      // PNG the layout can't see.
      <span className="inline-flex items-center gap-1.5 lg:gap-2">
        <Image
          src="/brand/sastw-horizontal-white.png"
          alt="Startup + Tech Week"
          width={1600}
          height={400}
          // The PNG carries 56px of transparent margin past the wordmark —
          // 5px rendered at h-9, 6.2px at h-11 — which was stacking on top of
          // the flex gap and putting "BASH" 15px clear of "WEEK". Cancelled
          // here so the gap in the class above is the whole visual gap and
          // reads as a word space rather than a paragraph break.
          className="-mr-[5px] h-9 w-auto shrink-0 lg:-mr-[6px] lg:h-11"
        />
        {/* Sized to the logo's own wordmark, not chosen. Measured off the
            PNG: "STARTUP + TECH WEEK" occupies 122 of its 400px height, so
            30.5%, and Oswald 500's cap height is 0.819em. At a 36px logo that
            is an 11px cap and a 13.5px font; at 44px, 13.4 and 16.5. The two
            then read as one line of type continuing into the accent word
            rather than a logo with a headline parked beside it.

            Weight 500 and normal tracking for the same reason, arrived at by
            rendering both side by side: the wordmark is a condensed sans at a
            medium stroke, and Oswald 700 with tight tracking sat next to it as
            a visibly heavier, tighter face — same family, different-looking
            font. Not 600, which looks like the middle option and is a trap:
            app/layout.tsx loads Oswald at 400, 500 and 700 only, so 600 is a
            weight the browser synthesises. */}
        <span className="font-display text-[13.5px] font-medium uppercase leading-none text-magenta lg:text-[16.5px]">
          Bash
        </span>
      </span>
    );
  }

  if (brand.wordmark === "the-model") {
    return (
      // Mono, and the second word caught in a selection block — the band's
      // mark at block scale. `box-decoration-clone` so the highlight survives
      // a wrap in a narrow lane.
      <span
        className={cn(
          "font-mono font-medium uppercase leading-tight tracking-tight text-white/85",
          // Bigger than it was. Every other row leads with an image lockup
          // drawn to a 150px target; "The Model" set at text-lg came out
          // around 130px and read as the one activation whose mark had been
          // shrunk. At 2xl/3xl it carries the same weight in the row as the
          // files beside it.
          lg ? "text-2xl lg:text-3xl" : "text-[13px]",
        )}
      >
        The{" "}
        <span
          className="box-decoration-clone px-1"
          style={{ backgroundColor: brand.accent, color: brand.ink }}
        >
          Model
        </span>
      </span>
    );
  }

  // An image lockup needs width the way type doesn't, so a narrow lane falls
  // back to the typeset title and keeps only the keyline.
  if (brand.lockup && !dense) {
    return (
      <Image
        src={brand.lockup.src}
        alt={brand.lockup.alt || title}
        width={brand.lockup.width}
        height={brand.lockup.height}
        // Roughly half again as wide in the stack. A phone row is the full
        // width of the screen and the mark is the only thing in its half of
        // it — at the axis's 96px target it was a caption on a card built to
        // hold a wordmark.
        // The height goes in a custom property and the class reads it, rather
        // than `style={{ height }}` — an inline declaration beats every class
        // including the responsive one, which is how the roomy axis scale sat
        // dead on the element for a whole pass.
        style={
          {
            // One target at every size, and `max-w-full` below does the
            // rest. The 96px small target was a second, quieter cap on top of
            // the lane's own: on a two-lane Monday the marks came out 60–80px
            // inside a ~111px lane, so mark size tracked lane *count* rather
            // than lane width, and PySanAntonio — alone on Friday — was three
            // times the size of Latin Tech for no reason a reader could see.
            // Aiming high and letting the lane clamp makes every mark as wide
            // as its lane allows, which is the honest invariant.
            //
            // Typeset marks still switch on `size`; they wrap rather than
            // clamp, so a narrow lane genuinely needs the smaller cut.
            "--mark-h": `${lockupHeight(
              brand.lockup,
              150,
              Math.min(lg ? 56 : roomy ? 50 : 44, markMax ?? Infinity),
            )}px`,
          } as React.CSSProperties
        }
        // Half again on a wide screen. The agenda row is the full width of the
        // right-hand column — around 770px at 1440 — and a mark sized for a
        // 342px phone left a void between it and the meta on the far edge.
        // The ratio-correct height is computed once; this only scales it.
        className={cn(
          "h-[var(--mark-h)] w-auto max-w-full object-contain object-left",
          lg && "lg:h-[calc(var(--mark-h)*1.5)]",
        )}
      />
    );
  }

  return null;
}

/**
 * A block's charge, from its room's tier.
 *
 * Circuits deliberately carry no colour of their own — the palette stays
 * magenta and space blue, and hierarchy comes from charge and position. Venue
 * is what earns the charge here: the anchor stage burns hottest, the rooms
 * that run all week sit beneath it, and the two that light up once stay
 * unlit until they're hovered.
 */
export const TIER_CHARGE: Record<string, string> = {
  anchor: "border-magenta/70 bg-magenta/20 hover:bg-magenta/30",
  day: "border-magenta/40 bg-magenta/[0.12] hover:bg-magenta/20",
  single: "border-white/25 bg-white/[0.06] hover:bg-white/[0.11]",
};

export function Block({
  item,
  picked,
  onToggle,
  dense = false,
  fill = false,
  spare = false,
  showVenue = true,
  lanes = 1,
  markMax,
  showAction = true,
}: {
  item: CalendarItem;
  picked: boolean;
  onToggle: (slug: string) => void;
  /** A lane too narrow for a lockup or a second line of title. */
  dense?: boolean;
  /** Fill the positioned wrapper, for blocks on the hour axis. */
  fill?: boolean;
  /**
   * Whether to print the room.
   *
   * True in the week view, where a column is a day and the venue is the only
   * thing telling two simultaneous blocks apart. False in the day view, where
   * a column *is* a venue and its head already says so — ten consecutive
   * blocks repeating "TPR" under a column headed "TPR" is the same word
   * eleven times.
   */
  showVenue?: boolean;
  /**
   * Whether the block has room under its mark — see `hasSpareRows`. False on
   * the rail and the stack, and on any slot too short to hold more than a
   * name, which prints its time instead.
   */
  spare?: boolean;
  /**
   * How many lanes the block's cluster splits into.
   *
   * Drives the mark scale, because lane count is what actually decides a
   * block's width. One lane is the full column, two is half of it, and the
   * mark should be cut for the lane it is in rather than for the narrowest
   * lane any block might ever get.
   */
  lanes?: number;
  /** A mark ceiling from the block's own height — see `axisMarkCap`. */
  markMax?: number;
  /**
   * Whether the block carries its own add-to-calendar control.
   *
   * False in the week view, where selection lives on the day — the same split
   * the mobile stack settled. It also fixes a discoverability problem the
   * desktop grid had on its own: the control appears on hover, so building a
   * shortlist meant finding forty invisible buttons one at a time.
   */
  showAction?: boolean;
}) {
  const brand = item.brand;
  const accent = brand?.accent;
  // Whether `BrandMark` will draw something. Computed rather than inferred
  // from a null return, because the title has to take the slot when it won't.
  // No height, no mark worth drawing. Otherwise scale to the lane.
  const markSize = !spare ? "sm" : lanes === 1 ? "lg" : lanes === 2 ? "md" : "sm";
  const hasMark = markKind(brand, dense, markSize) !== null;
  // Where there's height for a description there's height for the strand.
  const showCircuit = spare && !dense;

  /**
   * The full title off the axis, the short one on it.
   *
   * `fill` means the block is sized by its own duration inside a lane, where
   * "The Creative Futures™ Brunch powered by The Down Market" would clamp to a
   * fragment. The rail has no such constraint — it is a full column and grows
   * to its content — so that is where the organisers' whole title belongs, and
   * it is where the brunch actually sits.
   */
  const label = hasMark ? (
    <BrandMark
      brand={brand!}
      title={item.title}
      dense={dense}
      markMax={markMax}
      size={markSize}
    />
  ) : (
    <span
      className={cn(
        dense ? "line-clamp-1" : fill ? "line-clamp-2" : "line-clamp-4",
      )}
    >
      {dense || fill ? item.title : item.longTitle}
    </span>
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded border px-2 py-1.5 transition-colors duration-200",
        fill && "h-full",
        // An activation with an accent of its own is drawn in it; everything
        // else takes the house charge from its room's tier. Not both — an
        // inline colour and a `hover:bg-*` utility can't co-exist, since the
        // inline style wins even on hover, which is why branded blocks get
        // the overlay below instead.
        !accent && (TIER_CHARGE[item.venueTier] ?? TIER_CHARGE.single),
        // Selection outranks tier and brand alike.
        picked && "border-magenta bg-magenta/30 ring-1 ring-magenta",
      )}
      style={
        accent && !picked
          ? {
              // Hex with an alpha suffix rather than `color-mix`, because
              // every accent in the schedule is a 6-digit hex and this stays
              // legible next to the values in lib/pysa and friends.
              //
              // The heavy left edge is the calendar convention for "this
              // belongs to another calendar", and it is the part that
              // survives a quarter-width lane where no lockup fits.
              borderColor: `${accent}66`,
              borderLeftColor: accent,
              borderLeftWidth: 3,
              backgroundColor: `${accent}1a`,
              // Inherited by the hover overlay's `bg-current`.
              color: accent,
            }
          : undefined
      }
    >
      {/* The brand-tinted hover, as a layer. See the note on `style` above for
          why this isn't a `hover:bg-*` class. Sits before the link so the
          link's stretched ::after still takes the clicks. */}
      {accent && !picked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-15"
        />
      )}

      {/* The same two flourishes the agenda rows carry. They were StackBlock's
          alone, which meant the week — the view meant to be the spotlight —
          was the one place Startup Bash and The Model rendered as plain
          rectangles. The bolts position by percentage and the mascots bounce
          off measured walls, so both fit a tall narrow block as readily as a
          wide flat row without a number changing. */}
      {spare && item.page === "startup-bash" && <BoltDrift />}
      {spare && item.page === "the-model" && <MascotBurst />}
      {/* Axis only — deliberately not in StackBlock beside the other two.
          This one is a standing figure that needs vertical room, and it has it
          here: five hours is a 300px block with an empty middle. An agenda row
          is 83px of which the mark takes 57, so the same mascot there would be
          a thumbnail wedged behind the type. */}
      {spare && item.page === "pysanantonio" && <PysaMascot />}

      {/* The link is stretched over the whole block rather than wrapped
          around it: the select button lives inside, and a button inside an
          anchor is invalid markup that browsers resolve by dropping one of
          the two behaviours. */}
      {item.page ? (
        <Link
          href={`/schedule/${item.page}`}
          className={cn(
            "text-pretty text-[13px] font-medium leading-tight text-white after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70",
            // Clear of the select button in the corner, or a title long
            // enough to reach the edge runs under the control.
            // Only when the control is really rendered. Keyed on `exportable`
            // alone it reserved 20px in every week-view block — where
            // `showAction` is false — which is a fifth of a two-lane lane's
            // width given to a button that is not there.
            item.exportable && showAction && "pr-5",
          )}
        >
          {label}
        </Link>
      ) : (
        <p
          className={cn(
            "text-pretty text-[13px] font-medium leading-tight text-white",
            item.exportable && showAction && "pr-5",
          )}
        >
          {label}
        </p>
      )}

      {/* The time, only where the block is too short to say anything else.
          Everywhere else the axis has already stated it by position, and the
          rows below carry the strand and the room instead.

          It carries the room too, on one line. An hour block has 40px of
          content box; a mark worth drawing and two stacked 13.5px rows do not
          fit in it, and the version that tried squashed both rows to 6px and
          drew the type back over the mark. One row costs 16px instead of 29
          and leaves the mark 24, which is the difference between a lockup and
          a smudge.

          `shrink-0` so this can never be the thing that gives. If the budget
          is ever wrong again the mark clips — visible, and obviously a bug —
          rather than the text compressing into itself. */}
      {!spare && (
        <p className="mt-1.5 shrink-0 truncate font-mono text-[9px] uppercase tracking-widest text-white/60">
          {item.timeLabel}
          {showVenue && (
            <span className="text-white/45"> · {item.venueShort}</span>
          )}
        </p>
      )}

      {showCircuit && (
        // Wraps rather than truncates. A block that qualifies for this line
        // has height to spare by definition, and in a half-width lane the
        // longest circuit clipped to "AI & APPLIED INNOVATI…" — a truncation
        // that costs the reader the word the strand is named for.
        <p className="mt-auto text-balance pt-1.5 font-mono text-[9px] uppercase leading-tight tracking-widest text-magenta">
          {item.circuit}
        </p>
      )}
      <p
        className={cn(
          "truncate font-mono text-[9px] uppercase tracking-widest text-white/45",
          // Hidden without height to spare — the time row above has already
          // said the room, inline, because that is all one line affords.
          (!showVenue || !spare) && "hidden",
          // Anchored to the foot rather than left under the blurb: a
          // five-hour takeover is 360px tall and its copy rarely fills that,
          // so the venue was stranded mid-block above a void. The circuit
          // takes the `mt-auto` where it renders, and the venue follows it.
          spare && !showCircuit && "mt-auto pt-1.5",
        )}
      >
        {item.venueShort}
      </p>

      {showAction && item.exportable && (
        <button
          type="button"
          onClick={() => onToggle(item.slug)}
          aria-pressed={picked}
          aria-label={`${picked ? "Remove" : "Add"} ${item.title} to your calendar selection`}
          className={cn(
            "absolute right-1 top-1 z-10 grid size-5 place-items-center rounded-full border transition",
            // Hidden until the block is hovered or the button itself is
            // focused, so an unfiltered grid isn't a field of controls — but
            // always visible once picked.
            picked
              ? "border-magenta bg-magenta text-black"
              : "border-white/40 bg-black/60 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          )}
        >
          {picked ? (
            <Check className="size-3" strokeWidth={3} />
          ) : (
            <CalendarPlus className="size-3" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * One venue's whole run of programming, as a single block.
 *
 * The week view's answer to scale. At nine activations a block could be one
 * session; once TPR runs a dozen thirty-minute speaker slots on a Tuesday
 * afternoon while The Rand runs four community hours beside it, one block per
 * session puts twelve 36px rectangles in an 80px lane — the copy is
 * unreadable and the day is unreadable with it.
 *
 * So above a threshold a block stops meaning "a session" and starts meaning
 * "this room, this stretch". The reader gets what a five-day glimpse should
 * give them — who is running, where, and how much of it — and the detail is
 * one click away in the day view, or one filter away right here.
 *
 * Clicking filters the grid to this venue, which is the zoom: see the note on
 * `expandRun` in week-calendar-grid.
 */
export function SummaryBlock({
  venueName,
  venueTier,
  count,
  timeLabel,
  circuits,
  onOpen,
  fill = false,
  dense = false,
}: {
  venueName: string;
  venueTier: string;
  count: number;
  timeLabel: string;
  /** The distinct circuits inside the run, in canonical order. */
  circuits: string[];
  onOpen: () => void;
  fill?: boolean;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded border px-2 py-1.5 text-left transition-colors duration-200",
        fill && "h-full",
        TIER_CHARGE[venueTier] ?? TIER_CHARGE.single,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70",
      )}
    >
      {/* The venue leads, because that is what this block now is. Everywhere
          else on the grid the venue is the caption under a title; here it is
          the title. */}
      <span className="text-pretty text-[13px] font-medium leading-tight text-white">
        {venueName}
      </span>
      {/* Two lines, not one. "10 sessions · 1 – 6 PM" on a single truncating
          row loses the half that says when — the lane is 150px and the count
          is what survives. A summary block has height to spare by definition;
          it is the widest thing in the column that it is not. */}
      <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-widest text-white/70">
        {count} sessions
      </span>
      <span className="block truncate font-mono text-[9px] uppercase tracking-widest text-white/50">
        {timeLabel}
      </span>

      {/* What kind of week this room is running. Dropped in a narrow lane,
          where it would wrap to four lines of nine-pixel type. */}
      {!dense && circuits.length > 0 && (
        <span className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-white/55">
          {circuits.join(" · ")}
        </span>
      )}

      <span className="mt-auto pt-1.5 font-mono text-[9px] uppercase tracking-widest text-white/45 transition-colors group-hover:text-magenta">
        Open →
      </span>
    </button>
  );
}

/**
 * One activation as a row, for the stack that replaces the grid below lg.
 *
 * A different component from `Block` rather than a variant of it, because the
 * constraints invert. On the axis a block's height *is* its duration — five
 * hours is 360px and thirty minutes is 36 — so the copy has to fit whatever
 * the clock gives it, and everything stacks vertically inside a narrow lane.
 * A phone row has no height budget and the whole screen for width, and it was
 * still being drawn to the axis's rules: a 96px-wide lockup and two lines of
 * 9px mono in the top-left corner of a full-width card, with the rest empty.
 *
 * So the row splits. The mark takes the left at the size it deserves, and the
 * facts that were stacked under it — when, where, which circuit — move to the
 * right where they read as a column of data rather than as an afterthought.
 * The circuit is new here; the axis has no room for it and the row does.
 */
/**
 * The tallest a lockup draws in an agenda row, before the `lg` step-up.
 *
 * 38 here is 57 at `lg`, where the mark is drawn at 1.5x. That is deliberately
 * the size the row already treated as normal — Mission Pitch drew 56, Latin
 * Tech 59, PySanAntonio 53 — so this pulls in the two that sat outside it and
 * leaves everything else exactly where it was.
 *
 * It does cost width on a squarer mark: 1 Million Cups is stacked at 2:1, so
 * bounding its height bounds its width too, and it draws narrower than it did.
 * That is the trade the row's own geometry forces — a mark cannot be both as
 * wide as a 10:1 lockup and no taller than one.
 */
const STACK_MARK_MAX = 38;

export function StackBlock({
  item,
  picked,
  onToggle,
  showAction = true,
}: {
  item: CalendarItem;
  picked: boolean;
  onToggle: (slug: string) => void;
  /**
   * Whether the row carries its own add-to-calendar control.
   *
   * False in the week view, where selection moved up to the day — see
   * DayToggle. The two views pick at the altitude they're read at: the week is
   * "which days am I coming", the day is "which of these am I going to". A row
   * in the week stack having its own control as well would be two answers to
   * the same question sitting a centimetre apart.
   */
  showAction?: boolean;
}) {
  const brand = item.brand;
  const accent = brand?.accent;
  const hasMark = markKind(brand, false, "lg") !== null;

  // The organisers' full title, broken where the activation says to break it.
  // Left alone the wrap lands mid-phrase and a partner's name splits over two
  // lines; `titleBreak` is the same value the bento card and the hero use.
  const [titleHead, titleTail] = item.titleBreak
    ? [
        item.longTitle.slice(0, item.longTitle.indexOf(item.titleBreak)),
        item.longTitle.slice(item.longTitle.indexOf(item.titleBreak)),
      ]
    : [item.longTitle, ""];

  return (
    <div
      className={cn(
        // gap-2 and a w-24 meta rather than gap-3 and w-28: at the wider
        // settings the left column came out ~106px, so `max-w-full` clamped
        // every wide wordmark and they drew at inconsistent sizes — PySA at
        // 106px beside Give-a-LOT at 150. The mark is the row's subject and
        // has to be the thing that gets the width.
        // `overflow-hidden` so a drifting bolt or a launched mascot is clipped
        // by the row's own border rather than escaping across the schedule.
        // A floor under the row, and STACK_MARK_MAX as the ceiling over the
        // mark. Together they are what makes every row in the agenda the same
        // height.
        //
        // A row is `max(mark, meta) + 26`, and the two halves disagreed about
        // which one won. Marks are sized width-led, so height follows the
        // lockup's ratio: AITX at 3.7:1 drew 62px and 1 Million Cups, stacked
        // at 2:1, drew 84, while Google Developer Groups at 10:1 drew 23 and
        // left its row on the meta column's floor of 68. Same component, rows
        // from 68 to 110, and the reader sees three Tuesday activations in
        // three different sized boxes.
        //
        // Capping alone would not have fixed it — that pulls the tall ones
        // down but leaves the short-mark rows sitting on the meta floor. The
        // floor is what lifts those to meet them.
        "group relative flex min-h-[75px] items-center gap-2 overflow-hidden rounded border px-3 py-3 transition-colors duration-200 lg:min-h-[83px]",
        !accent && (TIER_CHARGE[item.venueTier] ?? TIER_CHARGE.single),
        // A ring, not a fill. On the axis a picked block flooding magenta is
        // right — it has to survive a glance across five columns. Here, where
        // "Add day" picks every row at once, the same treatment turned a whole
        // day into one magenta slab and took The Model's lavender and Access
        // Granted's green down with it. The ring says picked and leaves the
        // row still recognisable as itself.
        picked && "ring-2 ring-magenta",
      )}
      style={
        accent
          ? {
              borderColor: `${accent}66`,
              borderLeftColor: accent,
              borderLeftWidth: 3,
              backgroundColor: `${accent}1a`,
              color: accent,
            }
          : undefined
      }
    >
      {accent && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-15"
        />
      )}

      {/* Two rows, and only two: the week's one Social activation and the one
          with mascots of its own. Keyed on `page` like the wordmarks, and
          sitting under the link's stretched ::after so neither steals a click.
          See event-particles.tsx for why these are keyframes rather than the
          shader or the simulation. */}
      {item.page === "startup-bash" && <BoltDrift />}
      {item.page === "the-model" && <MascotBurst />}

      {/* The mark, and the link over the whole row.
      
          `relative` on this and the two blocks after it, and it is not
          decoration: an absolutely positioned element paints above every
          static sibling in the same stacking context regardless of DOM order,
          so the particle layers above were drawing over the row's own copy.
          Positioning the copy puts it back in the same phase as the layers,
          where source order decides — and the copy comes last. */}
      <div className="relative min-w-0 flex-1">
        {item.page ? (
          <Link
            href={`/schedule/${item.page}`}
            className="block after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
          >
            {hasMark ? (
              <BrandMark
                brand={brand!}
                title={item.longTitle}
                dense={false}
                markMax={STACK_MARK_MAX}
                size="lg"
              />
            ) : (
              <RowTitle head={titleHead} tail={titleTail} />
            )}
          </Link>
        ) : hasMark ? (
          <BrandMark
            brand={brand!}
            title={item.longTitle}
            dense={false}
            markMax={STACK_MARK_MAX}
            size="lg"
          />
        ) : (
          <RowTitle head={titleHead} tail={titleTail} />
        )}
      </div>

      {/* When, where, which circuit — a column of facts, right-aligned so they
          share an edge and read down rather than across.

          The circuit is the one in colour. Set in the same grey as the venue
          above it, third in a stack of three, it was where a strand goes to be
          overlooked. Magenta is what the site already uses to mark a circuit —
          the chips in room-flow, session-bento and speaker-card are all this
          colour — so the strand reads at a glance without the row growing a
          fourth element to carry it.

          Magenta even on a branded card. The circuit belongs to Startup + Tech
          Week, not to Access Granted; in the activation's own accent it would
          say the strand is the event's rather than the week's. */}
      <div className="relative flex w-24 shrink-0 flex-col items-end gap-0.5 text-right font-mono text-[9px] uppercase leading-tight tracking-widest lg:w-32 lg:text-[10px]">
        <span className="text-white/70">{item.timeLabel}</span>
        <span className="text-white/50">{item.venueShort}</span>
        <span className="text-balance text-magenta">{item.circuit}</span>
      </div>

      {/* The slot is always here, empty or not. A span has nothing to export,
          and without the reserved width its meta column ran 44px further
          right than its neighbours' — every row in the stack disagreeing
          about where the right-hand edge is. */}
      {showAction && (
      <div className="relative w-8 shrink-0">
        {item.exportable && (
          <button
            type="button"
            onClick={() => onToggle(item.slug)}
            aria-pressed={picked}
            aria-label={`${picked ? "Remove" : "Add"} ${item.title} to your calendar selection`}
            className={cn(
              // Always visible, unlike the axis block's. That one appears on
              // hover, which on a touch screen means it appears never — the
              // control was unreachable on exactly the surface this row
              // serves.
              "relative z-10 grid size-8 place-items-center rounded-full border transition",
              picked
                ? "border-magenta bg-magenta text-black"
                : "border-white/30 bg-black/40 text-white/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            )}
          >
            {picked ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : (
              <CalendarPlus className="size-3.5" />
            )}
          </button>
        )}
      </div>
      )}
    </div>
  );
}

/**
 * Add a whole day, from beside its heading.
 *
 * The week view used to put a control on every row, which is the wrong
 * granularity for the question that view answers. Nobody reads a five-day
 * overview deciding between two Wednesday sessions; they decide which days
 * they are coming. And it does not scale — once TPR runs a dozen thirty-minute
 * slots on a Tuesday, a per-row control is twelve checkboxes on one day.
 *
 * ─── Three states, with the count in the label ──────────────────────────────
 *
 * This was two states first — "Add day" until every session was in, then
 * "Added" — on the reasoning that an indeterminate state is unpredictable.
 * That is true of the *indeterminate checkbox*, the dash-in-a-box, where the
 * icon carries the state and the label carries nothing, so clicking it might
 * add the rest or clear the lot and the control never says which. Gmail and
 * Finder disagree about it.
 *
 * The ambiguity lives in the icon, not in having three states. Put the state
 * in the label and it goes away: "Add 2 more" reports where the day stands and
 * promises exactly what the click does, which is the property two states was
 * protecting and the thing two states could not report.
 *
 * The cost is that clearing a partly-picked day takes two clicks — complete
 * it, then clear it. Letting the partial state offer "clear" instead would put
 * two possible actions behind one button and walk straight back into the
 * ambiguity, so it takes the two clicks.
 *
 * ─── What a "day" means when a filter is on ─────────────────────────────────
 *
 * `slugs` is the *filtered* day, because that is what the reader is looking
 * at — having filtered to Capital, "Add day" adding the Tech & Builders
 * sessions too would be the button doing more than the screen shows. The
 * count follows the same set, so the label stays true to the view: filter to
 * one circuit and the day may read "Added" while unfiltered sessions on it sit
 * unpicked. That is the honest reading of a control scoped to the visible set,
 * and it is why the count matters — a bare "Added" hides it, a number does
 * not.
 */
export function DayToggle({
  slugs,
  picked,
  onToggle,
}: {
  /** The day's exportable activations, as currently filtered. */
  slugs: string[];
  picked: string[];
  onToggle: (slug: string) => void;
}) {
  if (slugs.length === 0) return null;

  const missing = slugs.filter((slug) => !picked.includes(slug));
  const all = missing.length === 0;
  const partial = !all && missing.length < slugs.length;

  return (
    <button
      type="button"
      // "mixed" is ARIA's own name for a tri-state toggle, so the partial
      // state reaches a screen reader as the third thing it is rather than as
      // an unpressed button.
      aria-pressed={all ? true : partial ? "mixed" : false}
      onClick={() => {
        // Clear the day, or take it the rest of the way. `onToggle` is a
        // per-slug flip, so adding has to be applied to the missing ones only
        // — calling it on an already-picked slug would remove it.
        for (const slug of all ? slugs : missing) onToggle(slug);
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors",
        all
          ? "border-magenta bg-magenta text-black"
          : partial
            ? // Touched but not finished. Enough magenta to pick out the days
              // already started when scanning down the five, without claiming
              // the day is done.
              "border-magenta/50 text-white/80 hover:border-magenta hover:text-white"
            : "border-white/30 text-white/60 hover:border-magenta/60 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      )}
    >
      {all ? (
        <>
          <Check className="size-3" strokeWidth={3} />
          Added
        </>
      ) : (
        <>
          <CalendarPlus className="size-3" />
          {partial ? `Add ${missing.length} more` : "Add day"}
        </>
      )}
    </button>
  );
}

function RowTitle({ head, tail }: { head: string; tail: string }) {
  return (
    <span className="text-pretty text-base font-medium leading-tight text-white lg:text-lg">
      {head}
      {tail && (
        <>
          {/* Only from lg. A narrow row already wraps a long title, and forcing
              the split there just adds a stub line. */}
          <br className="hidden lg:inline" />
          {tail}
        </>
      )}
    </span>
  );
}

/** The same row shape for a multi-day span — see StackBlock. */
export function StackSpanBar({
  span,
  reserveAction = true,
}: {
  span: CalendarSpan;
  /**
   * Whether to hold the width of StackBlock's action slot.
   *
   * True where a span sits in a list beside real sessions — the day view puts
   * Give-a-LOT and 1 Million Cups in the same Central Library group, and
   * without the reserved width their right-hand edges disagree by 40px.
   *
   * False where it stands alone, which is the week view's banner: nothing is
   * beside it to line up with, so the slot is just a hole where the row should
   * end. A span can never be exported — it has no hour to put in a calendar —
   * so the space is never anything but empty.
   */
  reserveAction?: boolean;
}) {
  const lockup = span.brand?.lockup;
  const body = (
    <>
      <div className="min-w-0 flex-1">
        {lockup ? (
          <Image
            src={lockup.src}
            alt={lockup.alt || span.title}
            width={lockup.width}
            height={lockup.height}
            style={
              {
                "--mark-h": `${lockupHeight(lockup, 150, 56)}px`,
              } as React.CSSProperties
            }
            className="h-[var(--mark-h)] w-auto max-w-full object-contain object-left lg:h-[calc(var(--mark-h)*1.5)]"
          />
        ) : (
          <span className="text-pretty text-base font-medium leading-tight text-white">
            {span.title}
          </span>
        )}
      </div>
      <div className="flex w-24 shrink-0 flex-col items-end gap-0.5 text-right font-mono text-[9px] uppercase leading-tight tracking-widest lg:w-32 lg:text-[10px]">
        <span className="text-white/70">{span.dayLabel}</span>
        <span className="text-white/50">{span.venueName}</span>
        <span className="text-balance text-magenta">{span.circuit}</span>
      </div>
      {reserveAction && <div className="w-8 shrink-0" />}
    </>
  );
  const className =
    "flex items-center gap-2 rounded border border-white/25 bg-white/[0.06] px-3 py-3 transition-colors duration-200 hover:bg-white/[0.11]";
  return span.page ? (
    <Link
      href={`/schedule/${span.page}`}
      className={cn(
        className,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function SpanBar({ span }: { span: CalendarSpan }) {
  const lockup = span.brand?.lockup;
  // Three parts across the bar: the mark, the days it runs, the room it runs
  // in. The rail spans every column the activation covers — Give-a-LOT holds
  // Monday to Wednesday, some seven hundred pixels — and the old layout put a
  // 60px logo and one run-on caption at the left end of it, leaving most of
  // the bar empty. Spread out, each fact has a place to be looked for.
  const body = (
    <>
      {lockup ? (
        <Image
          src={lockup.src}
          alt={lockup.alt || span.title}
          width={lockup.width}
          height={lockup.height}
          // 40px of height against the old 22. The bar is a horizontal strip,
          // so height is the only axis the mark can grow along.
          style={
            {
              "--mark-h": `${lockupHeight(lockup, 150, 40)}px`,
            } as React.CSSProperties
          }
          className="h-[var(--mark-h)] w-auto shrink-0 object-contain object-left"
        />
      ) : (
        <span className="truncate text-[13px] font-medium text-white">
          {span.title}
        </span>
      )}
      {/* Centred in what the mark and the room leave, so it reads as the middle
          column of three rather than as text trailing the logo. */}
      <span className="flex-1 truncate text-center font-mono text-[10px] uppercase tracking-widest text-white/70">
        {span.dayLabel}
      </span>
      <span className="shrink-0 truncate font-mono text-[10px] uppercase tracking-widest text-white/50">
        {span.venueName}
      </span>
    </>
  );
  const className =
    "flex items-center gap-4 rounded border border-white/25 bg-white/[0.06] px-3 py-1.5 transition-colors duration-200 hover:bg-white/[0.11]";
  return span.page ? (
    <Link
      href={`/schedule/${span.page}`}
      className={cn(
        className,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
