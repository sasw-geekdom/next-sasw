"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { matchesQuery } from "@/lib/calendar-search";
import type { CalendarItem, CalendarSpan } from "@/lib/schedule";
import { CircuitBus } from "@/components/site/circuit-bus";
import { ColumnBoard } from "@/components/site/calendar/column-board";
import {
  SpanBar,
  StackBlock,
  StackSpanBar,
} from "@/components/site/calendar/blocks";
import { DayRail } from "@/components/site/calendar/day-rail";
import {
  ExportBar,
  Filters,
  ViewToggle,
  useWeekView,
  useUrlFilter,
  usePicked,
  type Option,
  type WeekView,
} from "@/components/site/calendar/controls";

// The week at a glance — five columns, Monday to Friday.
//
// ─── What a block means, and why that had to change ─────────────────────────
//
// At nine activations a block could be a session. That stops working the
// moment TPR runs a dozen thirty-minute speaker slots on a Tuesday afternoon
// while The Rand runs four community hours beside it and Launch SA runs its own
// programme: three concurrent venues split a 240px day column into 80px lanes,
// and a 30-minute slot is 36px tall. Twelve unreadable rectangles stacked in a
// lane is not a denser version of this grid, it's a broken one.
//
// So a block means one of two things now, and which one depends on how much is
// behind it:
//
//   ≤ EXPAND_MAX in a run  →  the sessions themselves, as before.
//   more than that         →  one block for the venue's whole stretch.
//
// The week view's job is the five-day glimpse: who is running, where, and how
// much. The detail lives one click into the day view, or one filter away here.
//
// ─── The filters are the zoom ───────────────────────────────────────────────
//
// Runs are computed *after* filtering, so narrowing the week shrinks them, and
// a run that shrinks past the threshold expands into its sessions on its own.
// Filter to the AI circuit and TPR's twelve slots become the three that are on
// it — and those three draw as real blocks. That is the whole interaction:
// the chips don't hide rows, they choose the altitude.
//
// The venue chip forces expansion outright, since one venue in a column has no
// lane to share and every block is full width.

/**
 * Above this many sessions in one venue's run, the run draws as one block.
 *
 * The threshold is about density, not count. It exists so a Tuesday of twelve
 * thirty-minute TPR slots stays readable, and at 3 it also caught The Rand's
 * community afternoon — four activations of an hour or two, laid end to end
 * across five hours, which is exactly the case the grid can draw. The whole
 * run collapsed into one summary and every one of those marks disappeared
 * from both views.
 *
 * 4 is where the real content sits today. The blocks it admits are 60px and
 * up, which the one-hour layout is already tuned for; twelve half-hour slots
 * still fold, which is the case this was written for.
 *
 * If this needs raising again, the honest fix is to key on the height the run
 * would draw at rather than on how many things are in it — a count is a proxy
 * for density and it is wrong the moment the blocks are not the same size.
 */
/**
 * The week runs coarse — its blocks are afternoons, not talks. The day view
 * runs roughly double, because that is where the thirty-minute slots are read.
 */
/**
 * Pixels per hour, and deliberately coarse.
 *
 * The week's shortest block is two hours. It never has to draw a thirty-minute
 * slot — the summary rule collapses a venue's dozen speaker sessions into one
 * block, and talks are read in the day view — so the fine scale the day view
 * needs is spent here on nothing. At 96 the axis was 672px for seven hours;
 * at 60 it is 420, and no block loses a line of type.
 *
 * That 252px is most of why the grid did not fit: on a 900px MacBook Air its
 * bottom edge sat 321px below the fold, so a view whose entire purpose is
 * showing that four venues collide on one afternoon could not show it without
 * scrolling.
 */
/**
 * The scale once a venue chip narrows the week to one room.
 *
 * The note above is true of the unfiltered week and stopped being true of the
 * filtered one. "It never has to draw a thirty-minute slot" held while the
 * summary rule collapsed every dense run — but the venue chip forces
 * expansion, so `?venue=tpr` is exactly where the week draws half hours, and
 * at 60 a talk is 30px: under the 58 `fitsTimeRow` needs before a block may
 * print even its own time. Measured on TPR's first talk, a 228x24 strip with
 * its title cut mid-word.
 *
 * 132 is the day view's own fine scale for half-hour content, borrowed rather
 * than picked — `scaleFor` there returns exactly this for a day whose shortest
 * item is 30 minutes, and two views drawing the same half hour at the same
 * height is worth more than a number tuned twice.
 *
 * 120 was the first cut, on the reasoning that it is the smallest that clears
 * the 58px floor. It clears it for a one-line title and not for this one:
 * "Building Nopalera on Her Own Terms" wraps to two lines in a 228px lane and
 * pushed the time row out of the block. `fitsTimeRow` measures the block, not
 * the copy in it.
 *
 * It is not free — the filtered grid goes from 462px to 966 — which is why it
 * is spent only on a filtered view that actually holds a short block.
 */
export interface CalendarDay {
  iso: string;
  weekday: string;
  label: string;
}

/** One venue's contiguous stretch of programming on one day. */
interface Run {
  key: string;
  venueSlug: string;
  venueName: string;
  venueTier: string;
  items: CalendarItem[];
  startMin: number;
  endMin: number;
  timeLabel: string;
  circuits: string[];
}

/**
 * Group a day's sessions into per-venue runs.
 *
 * Contiguous rather than "everything this venue does today": a room with a
 * morning slot and an evening one is running two things, and drawing a single
 * block from 9 AM to 8 PM would claim it is busy through an afternoon it has
 * free. A run breaks only on a real gap — back-to-back sessions, which is what
 * a thirty-minute speaker track is, stay in one run.
 */
function runsFor(items: CalendarItem[], circuitOrder: string[]): Run[] {
  const byVenue = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = byVenue.get(item.venueSlug);
    if (list) list.push(item);
    else byVenue.set(item.venueSlug, [item]);
  }

  const runs: Run[] = [];
  for (const [venueSlug, list] of byVenue) {
    const sorted = [...list].sort((a, b) => a.startMin - b.startMin);
    let current: CalendarItem[] = [];
    let end = -Infinity;

    const flush = () => {
      if (current.length === 0) return;
      const first = current[0];
      const startMin = first.startMin;
      const endMin = Math.max(...current.map((i) => i.endMin));
      runs.push({
        key: `${venueSlug}-${startMin}`,
        venueSlug,
        venueName: first.venueName,
        venueTier: first.venueTier,
        items: current,
        startMin,
        endMin,
        timeLabel: rangeLabel(startMin, endMin),
        circuits: circuitOrder.filter((c) =>
          current.some((i) => i.circuit === c),
        ),
      });
      current = [];
      end = -Infinity;
    };

    for (const item of sorted) {
      // Strictly greater, so a session starting exactly when the last one
      // ended continues the run. That is the normal shape of a talk track.
      if (current.length > 0 && item.startMin > end) flush();
      current.push(item);
      end = Math.max(end, item.endMin);
    }
    flush();
  }
  return runs;
}

/** "1 – 6 PM" for a run, built the same way a session's own label is. */
function rangeLabel(startMin: number, endMin: number): string {
  const clock = (min: number, meridiem: boolean) => {
    const h24 = Math.floor(min / 60);
    const m = min % 60;
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""}${
      meridiem ? ` ${h24 < 12 ? "AM" : "PM"}` : ""
    }`;
  };
  const sameHalf = startMin < 720 === endMin < 720;
  return `${clock(startMin, !sameHalf)} – ${clock(endMin, true)}`;
}

export function WeekCalendarGrid({
  days,
  items,
  spans,
  circuits,
  venues,
}: {
  days: CalendarDay[];
  items: CalendarItem[];
  spans: CalendarSpan[];
  axis: { startMin: number; endMin: number };
  circuits: Option[];
  venues: Option[];
}) {
  const [view, setView] = useWeekView();
  /**
   * The view on its way out, held only for the length of its exit.
   *
   * Both are in the DOM at once and that is the point — next-geekdom's navbar
   * keeps both crowns on screen for 125ms because "kill the overlap and the
   * crown visibly disappears before its replacement shows up". The outgoing
   * copy is absolutely positioned, so the container takes the incoming view's
   * height the instant the switch happens rather than animating ~700px of it
   * and reflowing the whole page every frame.
   */
  const [leaving, setLeaving] = React.useState<WeekView | null>(null);
  const exitTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const switchView = React.useCallback(
    (next: WeekView) => {
      if (next === view) return;
      // No handoff for a reader who asked for less motion — two opaque views
      // stacked for 340ms is worse than the jump. The CSS zeroes the cell
      // animations to match; see globals.css.
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!still) {
        setLeaving(view);
        window.clearTimeout(exitTimer.current);
        // Long enough for the last cell's exit — 170ms plus the widest stagger.
        exitTimer.current = window.setTimeout(() => setLeaving(null), 340);
      }
      setView(next);
      // Re-anchor. Switching from the agenda to the shorter grid while scrolled
      // down otherwise leaves the reader below a section that just lost 700px.
      document
        .getElementById("the-week")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    },
    [view, setView],
  );
  const [circuit, setCircuit] = useUrlFilter("circuit");
  const [venue, setVenue] = useUrlFilter("venue");
  // In the URL with the other two, so a narrowed week is a link — "here is
  // where you're on" is a thing a speaker will want to send.
  const [query, setQuery] = useUrlFilter("q");
  const { picked, toggle, clear } = usePicked();
  const filtering = circuit !== null || venue !== null || query !== null;

  const circuitOrder = React.useMemo(
    () => circuits.map((c) => c.value),
    [circuits],
  );

  const matches = React.useCallback(
    (s: {
      circuit: string;
      venueSlug: string;
      title: string;
      longTitle?: string;
      people?: string;
      venueName: string;
      venueShort?: string;
      poweredBy?: string;
      searchText?: string;
    }) =>
      (circuit === null || s.circuit === circuit) &&
      (venue === null || s.venueSlug === venue) &&
      matchesQuery(s, query),
    [circuit, venue, query],
  );

  const shownItems = React.useMemo(
    () => items.filter(matches),
    [items, matches],
  );
  const shownSpans = React.useMemo(
    () => spans.filter(matches),
    [spans, matches],
  );

  // Everything the axis draws, per day, plus the runs too dense to draw there.
  //
  // A dense run used to take a lane and stand in it as one summary block. That
  // is what a lane costs, and measured on the real week it costs too much: TPR
  // running ten thirty-minute talks on Thursday took The Rand's column from
  // one lane to two, and Linux San Antonio's wordmark — 210px, the width of
  // the whole column — was redrawn at 93. Datanauts and AWS with it. The
  // summary did not even win the trade: 111px, its circuit list clipped
  // mid-word.
  //
  // So a dense run comes off the axis entirely and rides the `Talks` rail,
  // which is what this view already does with a brunch that starts at 7:30 and
  // a giveaway that runs three days. A rail costs no lane width, and the bar
  // gets the full day column instead of a sliver of it.
  // Fine only where something on screen needs it — see `FILTERED_HOUR_PX`.
  //
  // Keyed on what is actually drawn rather than on the chip being set, because
  // the chip is not the thing that costs. Filtering to The Rand, whose blocks
  // are all an hour or more, would pay 500px of extra axis to draw the same
  // blocks larger than they already read; filtering to TPR, which runs half
  // hours, is where the scale buys a legible block. So the rule asks the
  // content, exactly as the day view's `scaleFor` does.
  // The two rails. Mornings come off the axis so it doesn't have to start at
  // 7:30 AM for one brunch; all-day bars span columns.
  // The selection outlives the filter now, so the bar reports the whole thing
  // and says how much of it this view isn't showing.
  const hidden = picked.filter(
    (slug) => !shownItems.some((i) => i.slug === slug),
  ).length;

  /**
   * The stacked day-by-day list.
   *
   * A function rather than a constant because of `anchors`. The day jump
   * links need element ids to land on, and this markup renders more than
   * once at a time: the week view carries a copy below `lg`, and during a
   * view switch the outgoing view renders alongside the incoming one. Two
   * elements sharing an id means a jump lands on whichever the document
   * reaches first, which during a switch is the copy on its way out. Only
   * the agenda view asks for ids, and the agenda view is never on screen
   * twice — the pair mid-switch is always one agenda and one week.
   */
  const renderAgenda = (anchors: boolean) => (
    <>
      {shownSpans.length > 0 && (
        <div
          className="cal-cell mt-8 flex flex-col gap-2"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            All week
          </p>
          {shownSpans.map((span) => (
            <StackSpanBar key={span.slug} span={span} reserveAction={false} />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col">
        {days.map((day, dayIndex) => {
          const dayItems = shownItems.filter((i) => i.dayIso === day.iso);
          const runs = runsFor(dayItems, circuitOrder);
          return (
            <div
              key={day.iso}
              // What the day jump links land on. See `renderAgenda`.
              id={anchors ? `agenda-${day.iso}` : undefined}
              // `+1` so the banner above it leads. See globals.css.
              style={{ "--i": dayIndex + 1 } as React.CSSProperties}
              className={cn(
                "cal-cell flex flex-col gap-3",
                // The navbar is 64px and the day heading pins under it, so a
                // jump that lands flush puts the heading behind both.
                "scroll-mt-28",
                // A rule between days instead of the container's hairline gap,
                // which only existed to separate panels. `max-sm:` so none of
                // it survives into the card layout, where `p-5` would fight
                // the padding overrides.
                "border-t border-white/10 pt-6 first:border-t-0 first:pt-0",
              )}
            >
              {/* The day in the display face, the date in mono — the same
                  head the columns use, so the agenda and the week read as one
                  schedule at two widths rather than two designs. This was
                  11px mono for both halves, which made the day name the same
                  weight as the date beside it and as the control after it. */}
              {/* Sticky, and the day name is all that is in it now.
                  
                  Tuesday and Thursday are about to run to fifteen sessions, so
                  a reader is a screen and a half into a day by the time they
                  reach the end of it — with a heading that scrolled away at
                  the top. Pinned under the navbar it answers "which day am I
                  in" for the whole scroll, which is the question a long
                  agenda actually raises.
                  
                  `top-16` is the navbar's own height, and the black ground is
                  load-bearing: without it the rows scroll through the heading
                  rather than under it. */}
              {/* `top-27` below lg: 64px of navbar plus the 44px the pinned
                  day rail occupies above it. At `top-16` the two overlapped
                  and the day name was drawn behind the rail. */}
              <div className="sticky top-27 z-20 -mx-1 flex items-baseline gap-2 bg-black px-1 py-2 lg:top-16">
                <span className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white">
                  {day.weekday}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                  {day.label}
                </span>
                {/* How many the day holds, at the right edge of the pinned
                    row. A reader a screen and a half into a Tuesday has no
                    other way to know whether they are four rows from the end
                    or eleven. */}
                <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/45">
                  <span className="text-white/70">{dayItems.length}</span>{" "}
                  {dayItems.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              {/* A day carrying only an all-week activation now reads "Still
                  landing", which is what the desktop column has always said
                  under the same conditions: nothing is on the clock, and the
                  thing that runs through it is stated once above. */}
              {runs.length === 0 ? (
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/35">
                  {filtering ? "Nothing matching" : "Still landing"}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Every session, however dense the run. `EXPAND_MAX` is a
                      density rule and density is a problem the grid has, not
                      this list: there a run of ten is ten 36px slivers sharing
                      a lane, here it is ten 83px rows and the page simply gets
                      longer, which is what an agenda is for. Collapsing them
                      here put a lid on content that fits — and this is the
                      surface people read a day on, so it is the worst place to
                      hide it.

                      The cost is real and worth stating: a TPR Tuesday adds
                      roughly ten rows, about 1,000px of scroll. */}
                  {runs.map((run) =>
                    run.items.map((item) => (
                      <StackBlock
                        key={item.slug}
                        item={item}
                        // The agenda and every mobile stack take the same
                        // ground the columns do — see `flat` on Block.
                        flat
                        picked={picked.includes(item.slug)}
                        onToggle={toggle}
                        // No per-row control either. With the day toggle gone
                        // this was the schedule's last selection surface, and
                        // taking it out means `ExportBar` has nothing left to
                        // report on any desktop view — see the note there.
                        showAction={false}
                      />
                    )),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  /**
   * The section's only intro copy, and it says something different in each
   * view — because what is worth pointing at differs.
   *
   * One line for both views now, because both are true of the same thing: a
   * day page's columns are rooms, and neither the week nor the agenda shows
   * those. The agenda used to promise "hour by hour", which was honest while
   * a day page drew an hour axis — it doesn't any more, so that line was
   * selling something the destination no longer has.
   *
   * Filtered, it names the filters instead. That is more use than a count of
   * what was hidden.
   */
  // No longer per-view: both views point at the same destination and it
  // offers both of them the same thing.
  const caption = filtering
    ? // The query in quotes, so a search for a room name is distinguishable
      // from the room filter being set to it.
      [
        query && `“${query}”`,
        circuit,
        venues.find((v) => v.value === venue)?.label,
        // What the cut left. The selects give their own feedback — the
        // trigger reads "Capital" — but a search gives none: a query that
        // matches nothing and one that matches everything look identical in
        // the box, and the answer is otherwise spread across five columns.
        `${shownItems.length + shownSpans.length} of ${items.length + spans.length}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Open any day to see it room by room.";

  const renderView = (which: WeekView) =>
    which === "week" ? (
      <>
        {/* One control bar: what is being shown on the left, which way to
            show it on the right.
            
            This was two rows and three alignments — a sentence far left, the
            view toggle far right, and the filters on a line of their own
            underneath. The sentence was the loose one. It read as body copy
            introducing the section when it was really a caption on a control,
            and it is only worth saying at all when it has something to
            report: with filters off it now says nothing and the row is the
            filters and the toggle, which is what a control bar is.
            
            What the sentence used to do — telling the reader a day opens on
            its own — the day heads now do themselves, with the same arrow the
            rest of the site uses for "this goes somewhere". An affordance in
            the control beats a line of prose about the control. */}
        <div
          data-controls=""
          // The mobile eyebrow and pinned rail sit above this; on desktop
          // neither renders and the control bar is still the section's first
          // line.
          className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 max-lg:mt-4"
        >
          {/* No `min-w-0`: it let the selects shrink under their own labels
              and "All circuits" came out as "All circui…". They size to their
              content and the row wraps instead. */}
          {/* `w-full` below lg, or the filters inside size to their own
              content: the search is `w-full` of a shrink-to-fit parent, which
              resolved to 268px of a 342px measure and left every control
              short of the right edge. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 max-lg:w-full">
            <Filters
              layout="compact"
              circuits={circuits}
              venues={venues}
              circuit={circuit}
              venue={venue}
              query={query}
              onCircuit={setCircuit}
              onVenue={setVenue}
              onQuery={setQuery}
            />
            {filtering && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                {caption}
              </p>
            )}
          </div>
          <ViewToggle view={which} onChange={switchView} />
        </div>

        {/* Below lg the axis is replaced wholesale by the agenda. A
              proportional five-day grid at 375px gives each day 60px before
              lanes divide it, which is not a small version of this — it's an
              unreadable one. Which is also why ViewToggle is desktop-only:
              there is no phone rendering of this view to offer. */}
        {/* Five day columns, no hour axis — see WeekColumns for what that
            drops and what it costs. The spans come through as rendered nodes
            because they are the one thing that still belongs above the days
            rather than inside one. */}
        <ColumnBoard
          className="mt-6 hidden lg:block"
          columns={days.map((d) => ({
            key: d.iso,
            label: d.weekday,
            sublabel: d.label,
            href: `/schedule/day/${d.iso}`,
          }))}
          groupBy={(i) => i.dayIso}
          items={shownItems}
          // The day heads say the date and stop — see `showCount`.
          showCount={false}
          spans={
            shownSpans.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {shownSpans.map((span) => (
                  <SpanBar key={span.slug} span={span} flat />
                ))}
              </div>
            ) : null
          }
          picked={picked}
          onToggle={toggle}
          emptyLabel={filtering ? "Nothing matching" : "Still landing"}
        />

        <div className="lg:hidden">{renderAgenda(false)}</div>
      </>
    ) : (
      /* The agenda: context pinned on the left, the week scrolling past it
           on the right. Same two-column shape as ActivationDetail, down to
           `self-start` alongside `sticky` — a grid item stretches to its row
           by default, so its box is already full height and `top` has nothing
           to pin against.

           The page scrolls and the column pins; the right side is not its own
           scroller. Nested scroll areas trap the wheel, double the scrollbars,
           and break the browser's own find-on-page. */
      <div className="max-lg:mt-4 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-20">
        <div data-controls="" className="lg:sticky lg:top-24 lg:self-start">
          {/* The eyebrow, and the circuits riding it — the same pairing the
              homepage hero gives "Featured".
              
              It earns its place here rather than being borrowed for the look:
              this column is the agenda's only fixed furniture, and a reader
              scrolling fifteen sessions of a Tuesday has the five circuits in
              view the whole way. The filter directly beneath it is the circuit
              filter, so the ramp is a legend for the control under it as much
              as a mark. */}
          {/* `lg:` only. Below it the shared mobile header above already
              draws this exact pairing, and the agenda view was rendering
              "Every room" and its bus twice on a phone, forty pixels apart. */}
          <div className="hidden items-center gap-4 lg:flex">
            <p className="shrink-0 font-mono text-xs uppercase tracking-widest text-magenta">
              Every room
            </p>
            <CircuitBus className="min-w-0 flex-1" />
          </div>
          {/* Names this view rather than the week — the hero already carried
                "Five days, one current." and a sticky column repeating it
                would put the page's headline on screen for the whole scroll.
                "Day by day" is what distinguishes the agenda from the grid,
                which is the only thing this header has to say. */}
          {/* Also `lg:` only: on a phone the two views draw the same list
              under the same header, and a heading on one of them was the only
              thing telling them apart — a difference with no cause, since the
              view toggle that reaches it does not render below lg either. */}
          <h2 className="mt-3 hidden font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white lg:block">
            Day by day.
          </h2>
          <p className="mt-3 hidden text-sm text-white/55 lg:block">
            {caption}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {/* Stacked selects, not chips: ten chips will not fit a 20rem
                  column, and the column has to stay shorter than the viewport
                  or the pin has nowhere to go. */}
            <Filters
              layout="stacked"
              circuits={circuits}
              venues={venues}
              circuit={circuit}
              venue={venue}
              query={query}
              onCircuit={setCircuit}
              onVenue={setVenue}
              onQuery={setQuery}
            />
            <ViewToggle
              view={which}
              onChange={switchView}
              className="self-start"
            />
          </div>

          {/* Jump to a day.
              
              The phone has had a day switcher since the beginning and the
              desktop has never had one, which is backwards: `DayRail` is
              `lg:hidden` in both views, and the desktop agenda is the longer
              scroll of the two. With Tuesday and Thursday heading for fifteen
              sessions each, the whole week is four or five screens, and the
              only way to reach Thursday was to scroll past Wednesday.
              
              Anchors, not a filter. A reader who wants Thursday alone opens
              the Thursday page; this is for the reader who wants to *get* to
              Thursday and still have the rest of the week under them. The
              counts double as the shape of the week — where the density is,
              before the scroll finds it. */}
          <nav
            aria-label="Jump to a day"
            className="mt-8 hidden border-t border-white/10 pt-5 lg:block"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Jump to
            </p>
            <ul className="mt-3 flex flex-col">
              {days.map((day) => {
                const count = shownItems.filter(
                  (i) => i.dayIso === day.iso,
                ).length;
                return (
                  <li key={day.iso}>
                    <a
                      href={`#agenda-${day.iso}`}
                      className={cn(
                        "group flex items-baseline gap-2 border-b border-white/5 py-2 last:border-b-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta",
                        // An empty day is still listed — its absence would
                        // read as a missing link rather than an empty day —
                        // but it does not invite the click.
                        count === 0 && "opacity-45",
                      )}
                    >
                      <span className="font-display text-base font-bold uppercase leading-none tracking-tight text-white transition-colors group-hover:text-magenta">
                        {day.weekday}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        {day.label}
                      </span>
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/60">
                        {count}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="max-lg:mt-8">{renderAgenda(true)}</div>
      </div>
    );

  return (
    <>
      {/* Below lg only: what this section is, and the control that moves
          around it. Both sit outside `renderView` deliberately — they are the
          same in either view, and the handoff hides duplicated controls
          rather than animating two copies of them (see globals.css).

          The name is the part a phone was missing. On desktop the agenda's
          sticky column carries this eyebrow and the week's control bar is
          wide enough to read as a header in its own right; on a phone the
          reader crossed a hard white-to-black seam and landed on a search
          box, with nothing between the hero and a filter to say they were
          still on the schedule. The same eyebrow-and-bus pairing the hero
          gives "Featured", so the seam has something on the other side of it
          that belongs to this site. */}
      <div className="flex items-center gap-4 lg:hidden">
        <p className="shrink-0 font-mono text-xs uppercase tracking-widest text-magenta">
          Every room
        </p>
        <CircuitBus className="min-w-0 flex-1" />
      </div>

      {/* Pinned under the navbar for the whole scroll.
          
          The week runs to 2,400px on a phone and the rail was 200px from the
          top of it, so choosing a day meant scrolling back past everything
          you had just read to reach the control that would have saved you the
          scroll. It is the one control that changes which day you are looking
          at, which makes it the one worth the height.
          
          `-mx-6 px-6` so the black ground reaches the section's edges rather
          than leaving 24px of cards showing either side of a pinned bar. */}
      <div className="sticky top-16 z-30 -mx-6 mt-5 bg-black px-6 pb-2.5 lg:hidden">
        <DayRail active="week" />
      </div>

      {/* Both views render during the handoff. The outgoing one is out of
          flow and inert — see the note on `leaving`, and the exit rules in
          globals.css that stop its particle layers ever starting. */}
      <div className="relative">
        {leaving && (
          <div
            aria-hidden="true"
            className="cal-view--out pointer-events-none absolute inset-x-0 top-0"
          >
            {renderView(leaving)}
          </div>
        )}
        <div>{renderView(view)}</div>
      </div>

      <ExportBar picked={picked} onClear={clear} hidden={hidden} />
    </>
  );
}
