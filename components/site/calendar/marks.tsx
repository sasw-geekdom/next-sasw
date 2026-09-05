import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CalendarBrand } from "@/lib/schedule";

/*
  Every mark the calendar draws, and the sizing that decides which one.

  Split out of blocks.tsx, which is `"use client"` — it carries selection
  state and pointer handlers — and that made these unreachable from anywhere
  that ships no JavaScript. The homepage week board wanted exactly this and
  could not have it, so it grew a second, smaller implementation: a fixed
  28px lockup or the title in display caps, no `markKind`, no typeset brands,
  no inline wordmark inside a title. The result was the homepage showing the
  same week in marks the schedule had moved on from — the Nopalera talk set
  as plain type on one page and carrying its wordmark on the other.

  Nothing here holds state or handles an event, so nothing here needed to be
  a client component. One implementation, two pages.
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
/**
 * Marks that stand in for a word *inside* a title.
 *
 * The Nopalera talk is a CMS session, so it has no `brand` and no lockup — but
 * the company is the subject of the title, and the homepage bill already sets
 * its wordmark in place of the word. This is that, for every surface the
 * calendar draws: the week card, the agenda row and the day view all take it
 * at once rather than each special-casing one talk.
 *
 * Keyed on the *URL* slug, taken off `href`, not on `CalendarItem.slug` — a
 * CMS talk's `slug` is its Firestore id ("unique by construction, stable
 * across edits"), and keying on that would tie a logo to a database row.
 *
 * Matched on the word as well, so a retitled talk falls back to type rather
 * than dropping a logo into a sentence that no longer contains the name. The
 * file is the trimmed cut lib/sponsor-marks vendors — white on transparent,
 * which is what every surface here wants.
 */
const TITLE_MARKS: Record<string, { src: string; alt: string; word: string }> =
  {
    "building-nopalera-on-her-own-terms": {
      src: "/brand/nopalera-wordmark.png",
      alt: "Nopalera",
      word: "Nopalera",
    },
  };

/** A title, with any inline mark substituted for its word. */
export function TitleText({ text, href }: { text: string; href: string | null }) {
  const key = href?.split("/").pop() ?? "";
  const mark = TITLE_MARKS[key];
  const at = mark ? text.indexOf(mark.word) : -1;
  if (!mark || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Image
        src={mark.src}
        alt={mark.alt}
        width={1600}
        height={219}
        // Sized and seated in `em`, so it tracks whatever type the surface
        // sets the title in — a week card, an agenda row and a day block all
        // set it differently. `0.78em` against the cap rather than the em box,
        // and the baseline nudge is the mark's own: its box is the ink.
        className="inline-block h-[0.78em] w-auto align-[-0.08em]"
      />
      {text.slice(at + mark.word.length)}
    </>
  );
}

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

export function BrandMark({
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
