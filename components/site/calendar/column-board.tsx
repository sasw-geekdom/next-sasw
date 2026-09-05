"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Block } from "@/components/site/calendar/blocks";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/schedule";

/**
 * The week as five day columns, with no hour axis.
 *
 * ─── What went, and why it went quietly ─────────────────────────────────────
 *
 * The axis had three rails above it — "All week", "Before noon" and "Talks" —
 * and every one of them existed only to hold something the axis could not
 * draw: an activation spanning five days, an event finishing before the
 * window opened, and runs so dense the grid could only summarise them. Take
 * the axis away and two of the three have nothing left to do. The dense runs
 * in particular come back as themselves rather than as "Texas Public Radio ·
 * 4 sessions", which is the agenda quality this view was missing.
 *
 * The span keeps its bar, above the columns, because it is still the one
 * thing true of every column rather than of a day.
 *
 * ─── What it costs, stated plainly ──────────────────────────────────────────
 *
 * Simultaneity. The hour axis existed because four venues run takeovers on
 * the same afternoon and a list cannot show two things happening at once —
 * lib/schedule says so where the axis is derived. Every card still states its
 * own time, so an overlap is readable; it is no longer *visible*. That is a
 * real trade and the day view is where it is paid back: each day still opens
 * on its own axis with a column per room.
 *
 * ─── Why the columns don't scroll ───────────────────────────────────────────
 *
 * Because they don't need to, and because this file would be the fifth place
 * on the page to disagree with the agenda view's note that "nested scroll
 * areas trap the wheel, double the scrollbars, and break the browser's own
 * find-on-page". Without the axis the tallest day is six cards — it already
 * fits a viewport, which is what the scrolling was for. `CAP` protects the
 * shape when the thirty-odd sessions still to land make a day taller: the
 * column tops out and hands the rest to the day view, which is the homepage
 * snapshot's own answer and a better one than a scrollbar inside a column.
 */

/**
 * The activations that draw a figure, and so need a card tall enough for it.
 *
 * Kept as a list rather than inferred, because the condition is not a property
 * of the data: blocks.tsx decides which pages get a bolt, a mascot or a
 * mariachi, and this is the same set read from there. Everything else sizes to
 * its content.
 */
const SHOWCASE = new Set(["the-model", "startup-bash", "pysanantonio"]);

/**
 * Activations whose name reads better set in type than drawn from their file.
 *
 * One so far. 1 Million Cups' lockup is a wide letterbox — the cup ligature
 * plus "1 MILLION CUPS" plus a Kauffman credit line — and at card width it
 * takes the whole box and leaves the row nothing. The featured bill on the
 * homepage sets the same name in display type, and this matches it.
 */
const TYPESET = new Set(["1-million-cups"]);

/**
 * No cap. The column scrolls instead — see the note on the scroller below.
 *
 * There was a cap of six with a "+N more" link, which was the right answer
 * while a day held six things: it kept five columns inside one screen and
 * handed the rest to the day view. It stops being the right answer at
 * fourteen, where a reader would be sent to another page to see most of a
 * Tuesday.
 */

/** A column's heading — the big name, the arrow, the quiet detail. */
function Head({
  col,
  count,
}: {
  col: { key: string; label: string; sublabel?: string; href?: string };
  /**
   * How many the column holds — including what is scrolled out of sight.
   *
   * The column bounds itself to the viewport and scrolls, so five of fifteen
   * cards are visible and the other ten leave no trace. A count is the only
   * thing on the card stack that says they exist, and it is what tells a
   * reader whether to scroll this column or move on.
   */
  count: number;
}) {
  const inner = (
    <>
      <span className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white transition-colors group-hover:text-magenta xl:text-2xl">
        {col.label}
      </span>
      {col.href && (
        <ArrowUpRight
          className="size-3.5 shrink-0 self-center text-white/30 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta"
          aria-hidden="true"
        />
      )}
      <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/45">
        {/* The number in white, whatever sits beside it in the quieter grey —
            the count is the part being scanned. A column that already names
            a date takes the number bare after it ("Sep 15 · 12"); one that
            does not spells the noun out ("12 sessions"), because a lone
            numeral under a room name says nothing. */}
        {col.sublabel ? (
          <>
            {col.sublabel} · <span className="text-white/70">{count}</span>
          </>
        ) : (
          <>
            <span className="text-white/70">{count}</span>{" "}
            {count === 1 ? "session" : "sessions"}
          </>
        )}
      </span>
    </>
  );
  return col.href ? (
    <Link
      href={col.href}
      className="group flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
    >
      {inner}
    </Link>
  ) : (
    <span className="group flex items-baseline gap-2">{inner}</span>
  );
}

export function ColumnBoard({
  columns,
  items,
  groupBy,
  spans,
  picked,
  onToggle,
  emptyLabel,
  className,
}: {
  /**
   * The board's columns, in the order they are drawn.
   *
   * Days on the week view, rooms on a day view. The board does not care
   * which — it lays out whatever it is handed and asks `groupBy` where each
   * item belongs.
   */
  columns: {
    key: string;
    /** The big one, in the display face. "Mon", "The Rand". */
    label: string;
    /** The quiet one, in mono. "Sep 28", "4 sessions". */
    sublabel?: string;
    href?: string;
  }[];
  items: CalendarItem[];
  /** Which column an item belongs to. */
  groupBy: (item: CalendarItem) => string;
  /** The all-week bars, already rendered. */
  spans: React.ReactNode;
  picked: string[];
  onToggle: (slug: string) => void;
  emptyLabel: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* The all-week bar, labelled.
          
          The axis gave it a rail with "ALL WEEK" printed in the gutter beside
          it. Without the axis that gutter is gone and the bar arrived
          unexplained — a strip above five columns with a logo on it and no
          statement of what it spans. The label says it in the register the
          day heads use, so the bar reads as a sixth row of the same table
          rather than as a banner over it. */}
      {spans && (
        <div className="mb-4">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/45">
            All week
          </p>
          {spans}
        </div>
      )}
      {/* The height the columns divide up.
          
          Capped against the viewport rather than the content, which is what
          makes "the whole week on one screen" true no matter how many
          sessions a day gains. 15rem covers the navbar, the control bar, the
          all-week strip and the section's own padding on a MacBook Air; below
          that the columns take what is left and scroll inside it. */}
      {/* `grid-rows-[minmax(0,1fr)]` is not decoration. A grid row sizes to
          its content by default and refuses to shrink below it, so the cap
          above bounded the container while the columns grew straight through
          it — measured, a 549px grid holding 739px columns. The explicit
          `minmax(0, …)` is what lets the row take the height it is given and
          hand the overflow to the scrollers inside. */}
      <div
        className="grid max-h-[calc(100vh-15rem)] grid-rows-[minmax(0,1fr)] gap-3"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((col) => {
          const shown = items
            .filter((i) => groupBy(i) === col.key)
            .sort((a, b) => a.startMin - b.startMin);
          return (
            <section
              key={col.key}
              aria-label={[
                col.label,
                col.sublabel,
                `${shown.length} ${shown.length === 1 ? "session" : "sessions"}`,
              ]
                .filter(Boolean)
                .join(", ")}
              className="flex min-h-0 flex-col"
            >
              {/* The day name in the display face, the date in mono beside
                  it — the treatment the homepage snapshot uses, and the whole
                  reason it reads as a week at a glance. */}
              {/* The whole header is the day, and the day is a link.

                  The "add day" control used to sit at the right of this row.
                  It was a 26px target holding the end of a 237px column; with
                  it gone the day name takes the size the homepage snapshot
                  gives it and the date goes to the far edge — one line that
                  belongs to the day, rather than a name and a control sharing
                  a bar. Adding a whole day at once still exists in the agenda
                  view, which has the width for a labelled button; a bare icon
                  was the weaker half of that pair anyway.

                  `ArrowUpRight` with the up-and-right hop is the house
                  treatment for "this goes somewhere" — room-flow, model-band
                  and the old axis heads all use it, and it is what tells the
                  reader the head opens the day. */}
              {/* Sticky inside its own column, so the day you are reading is
                  still named when you are eight sessions into it. */}
              <header className="sticky top-0 z-10 shrink-0 border-b border-white/15 bg-black pb-2">
                <Head col={col} count={shown.length} />
              </header>

              {/* The day, scrolled.
                  
                  Tuesday and Thursday are about to take eight to ten more
                  sessions each at TPR, which puts them near fifteen. Five
                  columns of fifteen cards is roughly 1,400px — the week stops
                  fitting a screen, which is the one thing this view is for.
                  
                  This is the nested scroller the agenda view argues against,
                  and the objection is worth answering rather than ignoring.
                  "Traps the wheel" is the real one, and it is avoided by *not*
                  setting `overscroll-behavior: contain`: the wheel scrolls the
                  column and then chains to the page at the end, which is what
                  a reader expects. Find-on-page still works — browsers scroll
                  an overflow container to reveal a match. What is left is a
                  second scrollbar, and that is the price of keeping five days
                  on one screen.
                  
                  `min-h-0` on the section above is load-bearing: a flex child
                  defaults to `min-height: auto` and refuses to shrink below
                  its content, so without it the column grows and nothing
                  scrolls. */}
              <div
                // A fade at the foot, because macOS hides overlay scrollbars
                // until you scroll — so on the one platform this is being
                // designed for, a column with six more sessions in it looks
                // identical to one that ends. The mask costs nothing where
                // the content fits: it fades empty space.
                style={{
                  maskImage:
                    "linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent)",
                }}
                className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-6 pr-0.5 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
              >
                {shown.length === 0 ? (
                  <p className="pt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
                    {emptyLabel}
                  </p>
                ) : (
                  shown.map((item) => (
                    // The floor `spare` is promising.
                    //
                    // A block that says it has room under its mark has to have
                    // some: the three figures position against the block's own
                    // box, and in an 80px card the mascots come out as
                    // thumbnails wedged behind the type — which is exactly why
                    // blocks.tsx kept them off the agenda row. 11rem is the
                    // empty middle those figures were drawn for: at 8.5 the
                    // mariachi stood on PySA's own time and room and made both
                    // unreadable. Only the cards that draw a figure pay for it.
                    <div
                      key={item.slug}
                      className={cn(
                        "[&>*]:h-full",
                        SHOWCASE.has(item.page ?? "") && "min-h-[11rem]",
                      )}
                    >
                      <Block
                        item={item}
                        picked={picked.includes(item.slug)}
                        onToggle={onToggle}
                        // No `fill`: that is for a block on the hour axis, which
                        // stretches to its duration. Here the card sizes to its
                        // content, or to the floor above.
                        //
                        // Nothing else is overridden, and that is the point of
                        // using this rather than a card of our own — every brand
                        // treatment the week view had comes back with it: The
                        // Model's wordmark and mascots, College Night's and
                        // Access Granted's typeset marks with their hover, Open
                        // Circuit's, Startup Bash's house lockup and PySA's
                        // mariachi. A hand-rolled card had to reimplement each
                        // and had reimplemented none.
                        showAction={false}
                        // The speaker, on the card.
                        //
                        // An activation is identified by its mark. A CMS talk
                        // has none — and the twenty-odd TPR sessions arriving
                        // all render as this same card — so title, time, "TPR"
                        // and circuit would be the whole of it, and ten of them
                        // in one column would differ only in their titles. The
                        // name is what tells them apart, it is already on the
                        // item, and the agenda row has always printed it. The
                        // day view printed it too until the axis came out and
                        // this call replaced it.
                        showPeople
                        // `spare` is the switch for everything the cards were
                        // missing. It sets the mark scale — `markKind` refuses a
                        // lockup at "sm", which is why Startup Bash rendered as
                        // plain type — and it gates the three figures. The axis
                        // handed it out on block height; here it is asserted,
                        // and the floor above is what makes it honest.
                        spare
                        // Dark, not tinted — see `flat` on Block.
                        flat
                        // No axis here, so a block's position says nothing about
                        // when it runs and the time has to be printed. See
                        // `offAxis`: without it, asking for `spare` silently
                        // took the time off every card.
                        offAxis
                        preferTypeset={TYPESET.has(item.page ?? "")}
                        // The organisers' full title. "The Creative Futures™
                        // Brunch powered by The Down Market" is 54 characters
                        // carrying two brands; `shortTitle` exists for the hour
                        // axis, where a quarter-width block could not hold it.
                        fullTitle
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
