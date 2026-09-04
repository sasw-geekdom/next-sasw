"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus, Check } from "lucide-react";
import {
  BoltDrift,
  CipherField,
  CircuitTrace,
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
/**
 * Whether a block is tall enough to print its own time under the title.
 *
 * The third tier, under `hasSpareRows`. A block gets its mark, then either the
 * strand and the room (tall) or the time (short) — and under about an hour
 * there is room for neither, so the time row was drawn and then clipped by the
 * block's own `overflow-hidden`. Half a label sheared off mid-glyph reads as a
 * rendering fault; a title alone reads as a title.
 *
 * 58 is the budget from `axisMarkCap` read the other way round: 20px of chrome,
 * 16 for the title's line, 6 to separate it, 16 for the time. At the week's
 * 60px hour that is a 58-minute session, so every activation in the curated
 * week clears it and only the short CMS sessions do not.
 *
 * Nothing is lost by dropping it. The block is sitting on an hour axis at the
 * position its own start and length put it — which is the argument the note on
 * `timeLabel` already makes for leaving the time off the blocks that can say
 * something better instead.
 */
export function fitsTimeRow(
  startMin: number,
  endMin: number,
  hourPx: number,
): boolean {
  return ((endMin - startMin) / 60) * hourPx >= 58;
}

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
  const height = ((endMin - startMin) / 60) * hourPx;

  // A block with room to spare still has a ceiling — it is just a higher one.
  // Two meta rows and their gaps cost about 36, and at `lg` the mark is drawn
  // at 1.5x the value returned here, so the budget is divided back out.
  //
  // This case went uncovered until a two-hour block met a squarish mark. Every
  // lockup on the grid until then was 3.8:1 or wider, and width-led sizing
  // keeps a wide mark short by construction, so the size bucket alone was
  // always enough. ACM UTSA's is 2.43:1 — two circles side by side — which the
  // same 150px target draws 84px tall, and in a 120px block that squeezed the
  // venue row to nothing.
  if (hasSpareRows(startMin, endMin, hourPx)) {
    return Math.max(14, (height - 20 - 36) / 1.5);
  }
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
/**
 * The width every lockup is drawn toward, before its own ratio sets the height.
 *
 * One number for the axis blocks, where a lane is 100–300px and the mark is
 * competing with a strand label and a room. The agenda overrides it — see
 * `STACK_MARK_TARGET`.
 */
export const MARK_TARGET = 150;

/**
 * The height ceiling for an image lockup, scaled to the width it aims for.
 *
 * `markKind` and `BrandMark` both need this and both have to say the same
 * thing — see the note on `markKind`. It used to be three literals, which was
 * right while every axis block aimed at `MARK_TARGET`: a bigger target then
 * bought nothing, because the ceiling clamped the result back to 56 before the
 * extra width could be drawn. Scaling it keeps the default identical (150
 * returns exactly 56/50/44) and lets a caller that has genuinely more room ask
 * for more and get it.
 */
function lockupCeiling(size: "sm" | "md" | "lg", markTarget: number): number {
  const base = size === "lg" ? 56 : size !== "sm" ? 50 : 44;
  return Math.round(base * (markTarget / MARK_TARGET));
}

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
 * The narrowest a lockup can draw and still be a lockup.
 *
 * A wordmark needs width, and width is what a squarish mark runs out of first:
 * height-capped by its block and then multiplied by its own ratio, Open
 * Circuit's 1.65:1 mark comes out 33px wide in a one-hour week block. At that
 * size it is a coloured smudge — not a small logo, an unreadable one — and the
 * activation's name, which the typeset fallback would have shown, is gone.
 *
 * 56 rather than something tighter because the number has to have margin in
 * it. AITX is the next-squarest mark that lives in a one-hour block and lands
 * at 74; a floor set just under Open Circuit's failure point would sit a few
 * pixels from flipping AITX to type on a rounding change nobody would connect
 * to this.
 */
const MARK_MIN_W = 56;

/**
 * Which mark this brand can draw here, or null for none.
 *
 * Computed rather than inferred from a null render, because the caller has to
 * typeset the title in the same slot when there is nothing to draw — and the
 * answer depends on size, not just on what the brand owns. Startup Bash's mark
 * is set in Geist Pixel, which model-band measured as only resolving as a
 * pixel face above ~22px; below that it is a mono wearing a display face's
 * costs. So it draws at row scale and nowhere else.
 *
 * Image lockups have the same problem for a different reason, which is why
 * `markMax` is threaded in here as well as into `BrandMark`. Both have to
 * agree: this decides whether a mark is drawn, that decides how big, and if
 * only one of them knows the block's height cap the caller can commit to a
 * lockup the block cannot actually show.
 */
export function markKind(
  brand: CalendarBrand | undefined,
  dense: boolean,
  size: "sm" | "md" | "lg",
  /** The block's own height cap, where it has one. See `axisMarkCap`. */
  markMax?: number,
  /** The width the mark aims for. See `MARK_TARGET`. */
  markTarget: number = MARK_TARGET,
): "wordmark" | "lockup" | null {
  if (!brand) return null;
  if (brand.wordmark === "startup-bash")
    return size === "sm" ? null : "wordmark";
  // The file first, and the typeset mark as its fallback — an order that only
  // means anything for Open Circuit, the one brand that owns both. Every other
  // wordmark here belongs to an activation with no logo file at all, so they
  // fall straight through. Reversing the two would take the agenda's perfectly
  // legible 94px lockup away in order to show type instead.
  if (brand.lockup && !dense) {
    const lg = size === "lg";
    // The same call `BrandMark` makes, including the 1.5x it takes at `lg` —
    // predicting a different number here is how the two would disagree.
    const h =
      lockupHeight(
        brand.lockup,
        markTarget,
        Math.min(lockupCeiling(size, markTarget), markMax ?? Infinity),
      ) * (lg ? 1.5 : 1);
    const ratio = brand.lockup.width / brand.lockup.height;
    if (h * ratio >= MARK_MIN_W) return "lockup";
  }
  if (brand.wordmark) return "wordmark";
  return null;
}

function BrandMark({
  brand,
  title,
  dense,
  markMax,
  markTarget = MARK_TARGET,
  size = "sm",
  kind,
  canWrap = false,
}: {
  brand: CalendarBrand;
  title: string;
  /** A lane too narrow to draw an image lockup in. */
  dense: boolean;
  /**
   * Whether the block has vertical room for a typeset mark to take two lines.
   *
   * Only the axis blocks set it, and only the ones with a balanced middle —
   * see `TALL_BLOCK_MIN` in `Block`. An agenda row is a fixed 83px with the
   * mark and the meta side by side, so a wrapped mark there costs the row's
   * height rather than filling space it already has.
   */
  canWrap?: boolean;
  /**
   * The width the mark aims for, before its ratio sets the height.
   *
   * Has to match whatever `markKind` was given, for the same reason `markMax`
   * does: one decides that a lockup fits, the other decides how big, and a
   * disagreement puts a mark in a slot sized for something else.
   */
  markTarget?: number;
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
  /**
   * Which mark to draw, from `markKind`.
   *
   * Passed in rather than worked out again here, and that is not tidiness. The
   * branches below are ordered wordmark-first, so a brand holding both — Open
   * Circuit is the only one — drew its typeset mark even in the rows where
   * `markKind` had already decided the file fits and the caller had reserved
   * room for it. The two have to answer to one decision, and `markKind` is
   * where it is made, because the caller needs the same answer to know whether
   * to typeset the title instead.
   *
   * Optional so the call sites that only ever have one kind stay unchanged;
   * absent, the old order applies.
   */
  kind?: "wordmark" | "lockup" | null;
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

  if (brand.wordmark === "college-night") {
    return (
      // Set in type, like Access Granted, and for the same reason: this is a
      // house night rather than a partner's event, so there is no logo to
      // defer to and the mark is the house display face.
      //
      // Magenta on the second word, following Startup Bash rather than Access
      // Granted's green-on-the-first. Both are ours, both are Social, and the
      // accent belongs on the word that says what the evening is.
      //
      // Two lines where the block has the height for them, one line
      // everywhere else.
      //
      // It used to be one line at every size, on the reasoning that a wrapped
      // mark costs more height than the larger type wins — true while the mark
      // sat at the top of the block with the whole middle empty beneath it.
      // Now that a balanced block centres its mark, the height is already
      // spent: the two lines land in space that was doing nothing, and the
      // word that names the evening gets a line of its own instead of trailing
      // the one that qualifies it.
      //
      // Still one line in an agenda row and in a block too short to earn the
      // room — see `canWrap`.
      //
      // The break is forced rather than allowed. Left to wrap on its own the
      // mark stayed on one line, because at this cut "COLLEGE NIGHT" fits the
      // lane it is in — the two lines are the point here, not a consequence of
      // running out of width, so each word is given its own block.
      //
      // A step up in size comes with them. The one-line cut was sized to fit
      // the lane's width; split, the constraint moves to the block's height,
      // which a centred mark has to spare.
      <span
        className={cn(
          "font-display font-bold uppercase leading-tight tracking-tight text-white",
          canWrap
            ? lg
              ? "text-2xl lg:text-3xl"
              : roomy
                ? "text-xl"
                : "text-base"
            : lg
              ? "text-xl lg:text-2xl"
              : roomy
                ? "text-base"
                : "text-sm",
        )}
      >
        <span className={cn("whitespace-nowrap", canWrap && "block")}>
          College
        </span>{" "}
        <span
          className={cn("whitespace-nowrap text-magenta", canWrap && "block")}
        >
          Night
        </span>
      </span>
    );
  }

  // Guarded on `kind`, alone among the branches here, because Open Circuit is
  // alone in owning both a wordmark and a file. The branches run
  // wordmark-first, so without this it drew type even in the rows where
  // `markKind` had already chosen the lockup and the caller had sized the slot
  // for it.
  if (kind !== "lockup" && brand.wordmark === "open-circuit") {
    return (
      // The logo's wordmark, redrawn in type for the blocks the logo cannot
      // fit in. All caps and magenta because that is what the file is — this
      // is not a house mark like Access Granted's or College Night's, where
      // the type *is* the brand and the register was a free choice; here there
      // is a real logo one click away, and the job is to be recognisably the
      // same thing when the reader gets there.
      //
      // Oswald over Geist for the same reason. The mark is set in a heavy
      // condensed grotesque, and the display face is the only condensed thing
      // this site loads; Geist bold at block size reads as a different logo
      // rather than as a smaller one.
      //
      // No split colour. Access Granted and College Night each put one word in
      // an accent because their two words do different work — "Open Circuit"
      // is one object in the file, and picking a word to highlight would
      // invent a hierarchy the brand does not have.
      //
      // `whitespace-nowrap` with a step-down cut rather than a wrap, following
      // College Night: two lines of display type in a block that also has to
      // hold a time and a room cost more height than the larger face wins.
      <span
        className={cn(
          "whitespace-nowrap font-display font-bold uppercase leading-tight tracking-tight text-magenta",
          lg ? "text-xl lg:text-2xl" : roomy ? "text-base" : "text-sm",
        )}
      >
        Open Circuit
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

            Weight 400 and normal tracking, measured rather than judged. 700
            with tight tracking sat beside the wordmark as a visibly heavier,
            tighter face — same family, different-looking font — and 500, the
            first correction, was still 1.29x the wordmark's stroke: 9px
            against 7px rendered at 4x. 400 lands on it. Not 600, which looks
            like the middle option and is a trap: app/layout.tsx loads Oswald
            at 400, 500 and 700 only, so 600 is synthesised. */}
        <span className="font-display text-[13.5px] font-normal uppercase leading-none text-magenta lg:text-[16.5px]">
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
              markTarget,
              Math.min(lockupCeiling(size, markTarget), markMax ?? Infinity),
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
  anchor: "border-magenta/70 bg-magenta/20 hover:bg-magenta/25",
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
  showTime = true,
  showPeople = false,
  splitArt = false,
  showAction = true,
  fullTitle = false,
  showcaseArt = false,
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
   * Whether there is room under the title for the time — see `fitsTimeRow`.
   *
   * Only the axis passes it. The rail and the stack size to their content, so
   * nothing there can clip and the row always fits.
   */
  showTime?: boolean;
  /**
   * Whether to name the speaker under the title.
   *
   * The day view passes it and the week does not, which is a measurement
   * rather than a preference. A week lane on a Tuesday running four venues is
   * 31–55px of text: "Hastimal Jangid" comes out "Hast…" there, no better than
   * the title it would have replaced. A day column is the full width of its
   * room and has the line to spare.
   */
  showPeople?: boolean;
  /**
   * Whether this block may draw an activation's `blockArt` apart from its
   * title. See `splitMark` below.
   *
   * Both axes set it; the mobile stack does not. It was week-only at first, on
   * the worry that a day column is three times the width of a week lane and
   * its hours are taller, so the drawing would stop being a mark and become a
   * poster with a caption. Measured on Stumberg the day block is 306x247 and
   * the art lands about 220x170 — large, but the alternative was worse: the
   * inline lockup drew the mark 24px tall and left 190px of the block empty
   * beneath it, which is the hole the split layout exists to fill.
   *
   * The art is height-led (see the `Image` below), so what actually bounds it
   * is `markMax` and the room the title and meta rows leave — not the column
   * width. A wider column gets a wider box, not a taller drawing.
   */
  splitArt?: boolean;
  /**
   * Whether the block carries its own add-to-calendar control.
   *
   * False in the week view, where selection lives on the day — the same split
   * the mobile stack settled. It also fixes a discoverability problem the
   * desktop grid had on its own: the control appears on hover, so building a
   * shortlist meant finding forty invisible buttons one at a time.
   */
  showAction?: boolean;
  /**
   * Whether there is width here for the title the organisers actually gave the
   * event, rather than the cut one a narrow lane needs.
   *
   * Set by the two wide surfaces — the week's morning rail and the day
   * view's axis — and not by the week's main axis, which is a fifth of the
   * page. It is a judgement about this caller's width, so the caller makes it;
   * inferring it from `fill` is what named the brunch two different things on
   * two pages. `dense` still overrides it: a column split into lanes is narrow
   * again whatever the surface.
   */
  fullTitle?: boolean;
  /**
   * Whether this surface has room for an activation's art at full size.
   *
   * PySanAntonio is the only activation this reaches, and it changes two
   * things for it: the flourish runs its loop rather than a still, and the
   * lockup aims wider. Off in the week, where a lane is 224px and five days of
   * blocks share a page with the band's own clip; on in the day view, where
   * the block is roughly 1016x495 and nothing else on the route decodes.
   */
  showcaseArt?: boolean;
}) {
  const brand = item.brand;
  const accent = brand?.accent;
  // Whether `BrandMark` will draw something. Computed rather than inferred
  // from a null return, because the title has to take the slot when it won't.
  // No height, no mark worth drawing. Otherwise scale to the lane.
  const markSize = !spare
    ? "sm"
    : lanes === 1
      ? "lg"
      : lanes === 2
        ? "md"
        : "sm";
  // Where there's height for a description there's height for the strand.
  const showCircuit = spare && !dense;

  // PySanAntonio on a showcase surface, which is the day view and nothing
  // else. Scoped to the one activation rather than applied to every block the
  // day view draws: this is about filling the empty middle of a block that
  // also carries a mascot, not a general claim that day blocks want bigger
  // logos.
  const pysaShowcase = showcaseArt && item.page === "pysanantonio";
  // Height, not width, is what a second venue column on this day would not
  // change — see the note in `PysaMascot`. 260 draws PySA's 4.24:1 lockup
  // about 390px wide against the old 223, and `max-w-full` still clamps it if
  // the column ever narrows below that.
  const markTarget = pysaShowcase ? 260 : MARK_TARGET;

  const kind = markKind(brand, dense, markSize, markMax, markTarget);
  const hasMark = kind !== null;

  /**
   * The block sets the name in type and draws the mark on its own beneath it.
   *
   * Every other block pins one object to the top edge — a lockup where the
   * activation has one, the title where it does not — which is what this
   * component has always done and what the rest of the schedule expects. This
   * is the exception, and it is data-driven rather than named: an activation
   * gets it by supplying `blockArt`, its mark cut away from its wordmark. Only
   * Stumberg has one, because only a pictorial mark stands up without its
   * words.
   *
   * Which is also why the split is not a general layout. A lockup is a
   * letterbox: drawn across the top of a two-hour block it leaves the middle
   * empty, and moved into the middle it is still a wordmark, so the block
   * would print the name twice. Separate art solves both — the words go where
   * a heading belongs and the artwork gets the space, at a size a reader
   * actually sees it at rather than as a 24px strip.
   *
   * `spare` gates it, and so does `splitArt`. A block too short to hold more
   * than a name has no middle to move anything into, and a surface wider than
   * a week lane draws the artwork far larger than it was ever measured at.
   */
  const splitMark = spare && splitArt && !!brand?.art;

  // Named only where the surface asked for it and the block has a line spare.
  // `spare` blocks always do; a short one has exactly one, which this takes.
  const people = showPeople && (spare || showTime) ? item.people : undefined;

  /**
   * College Night takes two lines where it stands — see the note in
   * `BrandMark`. It does not move off the top; the line break is the whole of
   * what was asked for, and its mark is typeset rather than a file, so there
   * is no wordmark to separate from the artwork in the first place.
   */
  const wrapWordmark = spare && item.page === "college-night";

  /**
   * The organisers' whole title wherever the block is wide enough to carry it.
   *
   * This used to read the layout flag `fill` as a proxy for "has room", and
   * the two came apart in both directions. `fill` only means `h-full`, so the
   * week's morning rail — the narrowest surface at 286px — was the one place
   * printing "The Creative Futures\u2122 Brunch powered by The Down Market",
   * while the day view's 367px axis block for the same activation printed the
   * short form. Same event, two names, two pages.
   *
   * So the caller says. The week's main axis is a fifth of the page and stays
   * short; the rail and the day axis, which have the width, print the title
   * the organisers actually gave the event.
   */
  const label =
    hasMark && !splitMark ? (
      <BrandMark
        brand={brand!}
        title={item.title}
        dense={dense}
        markMax={markMax}
        markTarget={markTarget}
        size={markSize}
        kind={kind}
        canWrap={wrapWordmark}
      />
    ) : (
      <span
        className={cn(
          // The short form, and three lines to be sure of it.
          //
          // A split block has no wordmark to carry the name — the artwork
          // below is a drawing with no words in it — so this line is the only
          // place the activation is named, and it must not be the line that
          // gets cut. The full title ran to three lines in the narrowest lane
          // and left nothing for the drawing; `shortTitle` is the version cut
          // to fit, and it lands in two with the third line as headroom.
          splitMark
            ? "line-clamp-3"
            : dense
              ? "line-clamp-1"
              : fill
                ? "line-clamp-2"
                : "line-clamp-4",
        )}
      >
        {fullTitle && !dense && !splitMark ? item.longTitle : item.title}
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
        //
        // 25, not 30. At /30 the fill is rgb(76,15,48) and magenta type on it
        // measures 4.37:1 — under AA for the 9px circuit label and for Open
        // Circuit's 14px mark, both of which are magenta. /25 is rgb(64,12,40)
        // and puts them at 4.77:1. The same five points came off the anchor
        // tier's hover above, which shared the value and the problem: TPR is
        // anchor tier, its activations carry no accent of their own, so their
        // strand label is magenta on exactly this fill.
        //
        // Nothing else moves. The fill still reads as selected against its
        // neighbours (1.19:1 against The Rand's, against 1.30 before), and the
        // border, the ring, the Check icon and `aria-pressed` all carry the
        // state regardless — colour was never the only signal here.
        picked && "border-magenta bg-magenta/25 ring-1 ring-magenta",
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
      {/* Not gated on `spare`, unlike the three around it. Those are figures
          that need somewhere to stand; this is a background the type sits on,
          and the block it exists for is the one-hour one — precisely the case
          `spare` is false for. Gated on the mark instead: it draws only where
          the lockup could not, so it can never end up competing with the
          circuit traces already inside the logo. */}
      {kind === "wordmark" && item.page === "open-circuit" && <CircuitTrace />}
      {/* Axis only — deliberately not in StackBlock beside the other two.
          This one is a standing figure that needs vertical room, and it has it
          here: five hours is a 300px block with an empty middle. An agenda row
          is 83px of which the mark takes 57, so the same mascot there would be
          a thumbnail wedged behind the type. */}
      {spare && item.page === "pysanantonio" && (
        <PysaMascot animated={pysaShowcase} />
      )}

      {/* Access Granted's ciphertext, decrypted under the cursor. `spare` for
          the same reason the three above it are: a one-hour block is 40px of
          content box, and a 72px beam on it is not a spotlight, it is the
          block lit up.

          Hover-gated inside the component rather than here — it costs nothing
          until a pointer arrives, and touch never sees it. StackBlock draws it
          too, which is the one figure here that is not axis-only. */}
      {spare && item.page === "access-granted" && <CipherField />}

      {/* The link is stretched over the whole block rather than wrapped
          around it: the select button lives inside, and a button inside an
          anchor is invalid markup that browsers resolve by dropping one of
          the two behaviours. */}
      {item.href ? (
        <Link
          href={item.href}
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

      {/* The lockup, given the middle of the block to itself. `aria-hidden`
          because the title above has already named the activation and the
          mark's own alt text would say it again — here it is artwork rather
          than a label. The link's stretched ::after still covers it, so it
          stays part of the same click target.

          `min-h-0` so the mark is what gives when a block is tighter than its
          budget allowed. Without it a flex item refuses to shrink below its
          content and the mark pushes the strand and room out of the bottom
          instead — the same failure the note on `axisMarkCap` describes, in
          the other direction. */}
      {splitMark && brand?.art && (
        <div
          aria-hidden="true"
          className="flex min-h-0 flex-1 items-center justify-center py-1"
        >
          <Image
            src={brand.art.src}
            alt=""
            width={brand.art.width}
            height={brand.art.height}
            // Sized by the height it is given rather than by a width target,
            // which is the opposite of every other mark here and the reason
            // this is drawn directly instead of through `BrandMark`. Those are
            // wordmarks, where width is what makes them readable and the
            // height follows; this is a near-square drawing with nothing to
            // read, so what it needs is whatever vertical room the block has
            // left after the title and the meta rows have taken theirs.
            //
            // `object-contain` is what keeps that safe in a narrow lane:
            // `max-w-full` can clamp the width below what `h-full` implies,
            // and without it the drawing would stretch rather than fit.
            //
            // Height is the whole budget here and it is not generous. In the
            // narrowest lane the block is 143x144, the three-line title takes
            // 49 of it and the strand and room another 31, which leaves the
            // drawing about 43 — 55px wide at its 1.29:1. The padding is 4px a
            // side rather than 6 for that reason: at this size every pixel
            // taken off the gap goes straight into the artwork. Widening it is
            // not the lever it looks like, since the mark runs out of height
            // long before it runs out of the lane's 125px.
            className="h-full w-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* Who is on. Only CMS sessions have it — see `people` on CalendarItem.

          It outranks the time on a block with one line to give, and that is
          the whole reason the time row below tests for it. A block on an hour
          axis has already stated when it runs by where it sits and how far it
          reaches; the speaker is the one fact the geometry cannot supply. On a
          taller block both fit and both are drawn. */}
      {people && (
        <p className="mt-1.5 shrink-0 truncate text-[11px] leading-tight text-white/70">
          {people}
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
      {!spare && showTime && !people && (
        <p className="mt-1.5 shrink-0 truncate font-mono text-[9px] uppercase tracking-widest text-white/60">
          {item.timeLabel}
          {showVenue && (
            <span className="text-white/55"> · {item.venueShort}</span>
          )}
        </p>
      )}

      {/* `item.circuit` as well as the height test: a track is optional on a
          CMS session, and an empty strand drew an empty line with its own
          padding — a gap under the block that looked like a layout fault
          rather than an absent fact. */}
      {showCircuit && item.circuit && (
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
          "truncate font-mono text-[9px] uppercase tracking-widest text-white/55",
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
  compact = false,
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
  /**
   * A two-line cut for the `Talks` rail.
   *
   * The rail has the whole day column for width and no height budget of its
   * own — which is exactly why it needs one. Five stacked lines came to 128px
   * per rail row, more than `Before noon` (91) and `All week` (67) together
   * are worth, and it pushed the week grid to 747px against the 750 a 13"
   * laptop has under its header. The week not fitting on one screen is the
   * thing this whole view is for.
   *
   * So the count and the span share a line with `Open →`, and the circuit
   * list goes: at 222px "Founder · Tech & Builders · AI & Applied Innovation ·
   * Capital" wraps to two lines on its own, and it is the least load-bearing
   * thing here — one click answers it in full.
   */
  compact?: boolean;
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
      {compact ? (
        <span className="mt-0.5 flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-widest">
          <span className="truncate text-white/70">
            {count} {count === 1 ? "session" : "sessions"}{" "}
            <span className="text-white/50">· {timeLabel}</span>
          </span>
          {/* The house treatment for "this goes somewhere": `ArrowUpRight` with
              the up-and-right hop, the same one the column heads, room-flow,
              model-band and speaker-lineup carry. The typed "→" here was a
              variant of a thing the site had already settled — see the note in
              axis-grid. */}
          <span className="inline-flex shrink-0 items-center gap-1 text-white/55 transition-colors group-hover:text-magenta">
            Open
            <ArrowUpRight
              className="size-3 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      ) : (
        <>
          <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-widest text-white/70">
            {count} {count === 1 ? "session" : "sessions"}
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

          <span className="mt-auto inline-flex items-center gap-1 pt-1.5 font-mono text-[9px] uppercase tracking-widest text-white/55 transition-colors group-hover:text-magenta">
            Open
            <ArrowUpRight
              className="size-3 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </>
      )}
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

/**
 * The agenda aims its marks wider than the axis does.
 *
 * Width-led sizing converges every mark on roughly one drawn width, which is
 * what makes a column of them look deliberate. The cost is paid entirely by
 * the wide ones: height is width over ratio, so at the axis's 150 a 10:1
 * wordmark gets 23px of height on a wide screen and a 6.26:1 two-line lockup
 * gets 36 — split across two lines, so each line of type is half of that
 * again. Beside AITX at 3.68:1, which hits the height cap and draws its name
 * at full size, they read as the marks that were shrunk.
 *
 * An agenda row is not the axis. It is the full width of the right-hand
 * column — around 600–770px — where a 225px mark leaves most of the row empty,
 * so the width was there to give.
 *
 * 220 rather than more because of the cap above it: everything squarer than
 * about 3.9:1 is already pinned at STACK_MARK_MAX and does not move at all,
 * so this only lifts the marks the ratio was penalising. Raising it further
 * would start pushing wide marks past half the row without helping the ones
 * that are already capped.
 *
 * Row heights do not change. The tallest mark is still the cap, which AITX and
 * four others already draw at today.
 */
const STACK_MARK_TARGET = 220;

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
  // STACK_MARK_MAX, not a bare call: the two `BrandMark`s below pass it, and a
  // markKind that did not know the row's ceiling could commit to a lockup the
  // row then draws too small to read.
  const kind = markKind(brand, false, "lg", STACK_MARK_MAX, STACK_MARK_TARGET);
  const hasMark = kind !== null;

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
      {kind === "wordmark" && item.page === "open-circuit" && <CircuitTrace />}
      {/* The beam reads here as well as on the axis, which is why this is the
          one figure that is not axis-only. A row is 83px and wide, so the
          spotlight crosses it rather than roaming a tall box — but it is still
          a patch of ciphertext under the cursor, and the row has the width to
          make that legible. */}
      {item.page === "access-granted" && <CipherField />}

      {/* The mark, and the link over the whole row.
      
          `relative` on this and the two blocks after it, and it is not
          decoration: an absolutely positioned element paints above every
          static sibling in the same stacking context regardless of DOM order,
          so the particle layers above were drawing over the row's own copy.
          Positioning the copy puts it back in the same phase as the layers,
          where source order decides — and the copy comes last. */}
      <div className="relative min-w-0 flex-1">
        {item.href ? (
          <Link
            href={item.href}
            className="block after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
          >
            {hasMark ? (
              <BrandMark
                brand={brand!}
                title={item.longTitle}
                dense={false}
                markMax={STACK_MARK_MAX}
                markTarget={STACK_MARK_TARGET}
                size="lg"
                kind={kind}
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
            markTarget={STACK_MARK_TARGET}
            size="lg"
            kind={kind}
          />
        ) : (
          <RowTitle head={titleHead} tail={titleTail} />
        )}

        {/* Who is on, under the title. A row is 768px wide at 1440 and the
            mark rarely fills half of it, so this costs the layout nothing and
            answers the question a session row otherwise leaves open. Only CMS
            sessions carry it — see `people` on CalendarItem. */}
        {item.people && (
          <p className="mt-1.5 truncate text-[11px] leading-tight text-white/70">
            {item.people}
          </p>
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
        {/* Omitted rather than empty — see the note in Block. */}
        {item.circuit && (
          <span className="text-balance text-magenta">{item.circuit}</span>
        )}
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
  // Two anchors and a rule between them: the mark at one end, the days and the
  // room together at the other, joined across whatever is left.
  //
  // This has now been wrong in both directions. Everything packed left put a
  // 60px logo and a run-on caption at one end of a seven-hundred-pixel bar and
  // left the rest empty. Spreading the three facts evenly fixed that until
  // Give-a-LOT grew from three days to five: at thirteen hundred pixels the
  // gaps stopped reading as columns and started reading as a mistake, with the
  // room stranded a screen away from the mark it belongs to.
  //
  // The rule is the fix for both, because the emptiness was never the problem
  // — unexplained emptiness was. A line that runs the width of the bar is the
  // one piece of furniture that gets better the longer the activation lasts,
  // and it says the thing the bar exists to say: this covers all of it.
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
      {/* Collapses to nothing in a one-column bar on the day view, which is
          the right behaviour: there is no distance left to carry. */}
      <span
        aria-hidden="true"
        className="h-px min-w-0 flex-1 bg-gradient-to-r from-white/5 via-white/20 to-white/20"
      />
      <span className="shrink-0 truncate font-mono text-[10px] uppercase tracking-widest">
        <span className="text-white/70">{span.dayLabel}</span>
        <span className="px-2 text-white/25">·</span>
        <span className="text-white/50">{span.venueName}</span>
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
