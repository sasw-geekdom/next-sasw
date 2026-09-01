"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { CalendarItem, CalendarSpan } from "@/lib/schedule";
import {
  AxisGrid,
  type AxisPlacement,
  type AxisRail,
} from "@/components/site/calendar/axis-grid";
import {
  Block,
  DayToggle,
  SpanBar,
  StackBlock,
  StackSpanBar,
  SummaryBlock,
  axisMarkCap,
  fitsTimeRow,
  hasSpareRows,
  placeLanes,
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
const EXPAND_MAX = 4;

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
const HOUR_PX = 60;

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
const FILTERED_HOUR_PX = 132;

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
  axis,
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
  const { picked, toggle, clear } = usePicked();
  const filtering = circuit !== null || venue !== null;

  const circuitOrder = React.useMemo(
    () => circuits.map((c) => c.value),
    [circuits],
  );

  const matches = React.useCallback(
    (s: { circuit: string; venueSlug: string }) =>
      (circuit === null || s.circuit === circuit) &&
      (venue === null || s.venueSlug === venue),
    [circuit, venue],
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
  const hourPx = React.useMemo(() => {
    if (venue === null || shownItems.length === 0) return HOUR_PX;
    const shortest = Math.min(...shownItems.map((i) => i.endMin - i.startMin));
    return shortest <= 30 ? FILTERED_HOUR_PX : HOUR_PX;
  }, [venue, shownItems]);

  const { placements, railRuns } = React.useMemo(() => {
    const out: Record<string, AxisPlacement[]> = {};
    const rail: Record<string, Run[]> = {};
    for (const day of days) {
      const onAxis = shownItems.filter(
        (i) => i.dayIso === day.iso && !i.morning,
      );
      const runs = runsFor(onAxis, circuitOrder);
      // Two ways a run leaves the axis, and the second is the one `EXPAND_MAX`
      // could never see. Its own note called this: "a count is a proxy for
      // density and it is wrong the moment the blocks are not the same size."
      //
      // A single thirty-minute talk is one session, well inside the count, and
      // at HOUR_PX it draws 30px — under the 58 `fitsTimeRow` needs before a
      // block can show even its own time. Measured on TPR's first Tuesday
      // talk: a 24px sliver with its title clipped, which had taken a lane and
      // halved .NET User Group from 228px to 111. That is the exact harm the
      // rail was built to prevent, arriving through the one door the count
      // rule left open.
      //
      // So density is asked directly. A run the axis cannot draw goes to the
      // rail however few things are in it.
      const drawable = (run: Run) =>
        run.items.every((i) => fitsTimeRow(i.startMin, i.endMin, hourPx));

      // The venue chip still forces expansion: one venue per column means every
      // block is full width, and there is nothing left to protect. A short
      // block is still short there, but it is full-width short and the reader
      // asked for exactly this room.
      const expand = (run: Run) =>
        venue !== null || (run.items.length <= EXPAND_MAX && drawable(run));
      const dense = runs.filter((run) => !expand(run));
      if (dense.length > 0) rail[day.iso] = dense;

      type Cell = {
        key: string;
        startMin: number;
        endMin: number;
        run: Run;
        // Always set now. A dense run no longer produces an item-less cell
        // standing in for it — it leaves the axis for the rail instead.
        item: CalendarItem;
      };
      const cells: Cell[] = runs.filter(expand).flatMap((run) =>
        run.items.map((item) => ({
          key: item.slug,
          startMin: item.startMin,
          endMin: item.endMin,
          run,
          item,
        })),
      );
      cells.sort((a, b) => a.startMin - b.startMin);

      out[day.iso] = placeLanes(cells).map((cell) => ({
        key: cell.key,
        startMin: cell.startMin,
        endMin: cell.endMin,
        lane: cell.lane,
        lanes: cell.lanes,
        node: (
          <Block
            item={cell.item}
            picked={picked.includes(cell.item.slug)}
            onToggle={toggle}
            dense={cell.lanes >= 3}
            lanes={cell.lanes}
            spare={hasSpareRows(cell.startMin, cell.endMin, hourPx)}
            showTime={fitsTimeRow(cell.startMin, cell.endMin, hourPx)}
            markMax={axisMarkCap(cell.startMin, cell.endMin, hourPx)}
            showAction={false}
            splitArt
            fill
          />
        ),
      }));
    }
    return { placements: out, railRuns: rail };
  }, [days, shownItems, circuitOrder, venue, hourPx, picked, toggle]);

  // The two rails. Mornings come off the axis so it doesn't have to start at
  // 7:30 AM for one brunch; all-day bars span columns.
  const rails = React.useMemo(() => {
    const list: AxisRail[] = [];

    if (shownSpans.length > 0) {
      list.push({
        label: "All week",
        span: (
          <>
            {shownSpans.map((span) => (
              <div
                key={span.slug}
                style={{
                  gridColumn: `${span.fromIndex + 1} / ${span.toIndex + 2}`,
                }}
                className="px-1"
              >
                <SpanBar span={span} />
              </div>
            ))}
          </>
        ),
      });
    }

    const mornings = shownItems.filter((i) => i.morning);
    if (mornings.length > 0) {
      const byColumn: Record<string, React.ReactNode> = {};
      for (const day of days) {
        const dayMornings = mornings.filter((i) => i.dayIso === day.iso);
        if (dayMornings.length === 0) continue;
        const runs = runsFor(dayMornings, circuitOrder);
        byColumn[day.iso] = (
          <>
            {runs.map((run) =>
              // The rail summarises on the same rule as the axis. It is a
              // list with no height budget, so a venue running a morning
              // speaker track would otherwise push the grid off the screen
              // before the reader reached 1 PM.
              venue !== null || run.items.length <= EXPAND_MAX ? (
                run.items.map((item) => (
                  <Block
                    key={item.slug}
                    item={item}
                    picked={picked.includes(item.slug)}
                    onToggle={toggle}
                    // The morning rail is part of the week view, so its blocks
                    // defer to the day's toggle like the ones on the axis. The
                    // toggle already covers them — its slugs come from every
                    // item on the day, rail included.
                    showAction={false}
                    // A full-width column that grows to its content, so the
                    // brunch is named here the way its organisers name it.
                    fullTitle
                  />
                ))
              ) : (
                <SummaryBlock
                  key={run.key}
                  venueName={run.venueName}
                  venueTier={run.venueTier}
                  count={run.items.length}
                  timeLabel={run.timeLabel}
                  circuits={run.circuits}
                  onOpen={() => setVenue(run.venueSlug)}
                />
              ),
            )}
          </>
        );
      }
      list.push({ label: "Before noon", byColumn });
    }

    // Last, so the column reads down in time: all week, then the morning, then
    // the afternoon's dense tracks, then the axis itself.
    //
    // A 1–6 PM run drawn above the noon line is the trade this makes, and it
    // is the grammar the other two rails already set: a band means "this does
    // not sit on the clock". The label says `Talks` rather than a time for the
    // same reason.
    if (Object.keys(railRuns).length > 0) {
      const byColumn: Record<string, React.ReactNode> = {};
      for (const day of days) {
        const runs = railRuns[day.iso];
        if (!runs || runs.length === 0) continue;
        byColumn[day.iso] = (
          <div className="flex flex-col gap-1">
            {runs.map((run) => (
              <SummaryBlock
                key={run.key}
                venueName={run.venueName}
                venueTier={run.venueTier}
                count={run.items.length}
                timeLabel={run.timeLabel}
                circuits={run.circuits}
                // Neither `fill` nor `dense`: the rail has no height budget
                // and the bar has the whole day column, which is the point of
                // moving it here. `compact` because that same absence of a
                // budget is what let this rail grow to 128px and push the
                // week off a 13" screen — see the note on the prop.
                compact
                onOpen={() => setVenue(run.venueSlug)}
              />
            ))}
          </div>
        );
      }
      list.push({ label: "Talks", byColumn });
    }

    return list;
  }, [
    days,
    railRuns,
    shownItems,
    shownSpans,
    circuitOrder,
    venue,
    picked,
    toggle,
    setVenue,
  ]);

  const columns = React.useMemo(
    () =>
      days.map((day) => ({
        key: day.iso,
        label: day.weekday,
        // "Mon Sep 28", matching the agenda's day headings. This was cut to
        // the bare number when the head became one row, on the assumption the
        // month would not fit beside "Add day" — measured, it costs 23px, and
        // every width from xl up has at least 33 to spare. Below xl the
        // sublabel drops entirely, which is where the constraint was real.
        sublabel: day.label,
        // Every head is a way into that day at full resolution — the other
        // half of the answer to a dense week.
        href: `/schedule/day/${day.iso}`,
        // And the day's whole selection, at the same altitude the mobile
        // stack picks at. `shownItems` rather than the full week, so the
        // toggle is scoped to what the filters are showing — see DayToggle.
        action: (
          <DayToggle
            slugs={shownItems
              .filter((i) => i.dayIso === day.iso && i.exportable)
              .map((i) => i.slug)}
            picked={picked}
            onToggle={toggle}
          />
        ),
      })),
    [days, shownItems, picked, toggle],
  );

  // The selection outlives the filter now, so the bar reports the whole thing
  // and says how much of it this view isn't showing.
  const hidden = picked.filter(
    (slug) => !shownItems.some((i) => i.slug === slug),
  ).length;

  const agenda = (
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
              // `+1` so the banner above it leads. See globals.css.
              style={{ "--i": dayIndex + 1 } as React.CSSProperties}
              className={cn(
                "cal-cell flex flex-col gap-3",
                // A rule between days instead of the container's hairline gap,
                // which only existed to separate panels. `max-sm:` so none of
                // it survives into the card layout, where `p-5` would fight
                // the padding overrides.
                "border-t border-white/10 pt-6 first:border-t-0 first:pt-0",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest">
                  <span className="text-white">{day.weekday}</span>{" "}
                  <span className="text-white/45">{day.label}</span>
                </p>
                {/* The day's whole selection, in one control beside its
                    heading — see DayToggle. */}
                <DayToggle
                  slugs={dayItems
                    .filter((i) => i.exportable)
                    .map((i) => i.slug)}
                  picked={picked}
                  onToggle={toggle}
                />
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
                        picked={picked.includes(item.slug)}
                        onToggle={toggle}
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
   * From the grid, "open a day to read it hour by hour" would be describing
   * what the reader is already looking at. What a day actually adds there is
   * the *rooms*: its columns are venues rather than days, so TPR gets one of
   * its own and nothing shares a lane. That is the line worth spending.
   *
   * From the agenda there are no hours on screen at all, so the original
   * phrasing is still the honest one.
   *
   * Filtered, it names the filters instead. That is more use than a count of
   * what was hidden, and it keeps a scoped "Add day" honest — see DayToggle.
   */
  const captionFor = (which: WeekView) =>
    filtering
      ? [circuit, venues.find((v) => v.value === venue)?.label]
          .filter(Boolean)
          .join(" · ")
      : which === "week"
        ? "Open a day to see it room by room."
        : "Open any day to read it hour by hour.";

  const renderView = (which: WeekView) =>
    which === "week" ? (
        <>
          {/* Grid view keeps the full width, so its controls run across the
              top the way they always did. */}
          <div
            data-controls=""
            className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4"
          >
            <p className="text-sm text-white/55">{captionFor(which)}</p>
            <ViewToggle view={which} onChange={switchView} />
          </div>

          {/* Tighter than the agenda's control block, and one row of selects
              rather than two of chips — see Filters' "compact". Between them
              the caption, the filters and these margins were 203px of the
              267px standing between the section top and the first hour. */}
          <div data-controls="" className="mt-4 flex flex-col gap-3">
            <DayRail active="week" className="lg:hidden" />
            <Filters
              layout="compact"
              circuits={circuits}
              venues={venues}
              circuit={circuit}
              venue={venue}
              onCircuit={setCircuit}
              onVenue={setVenue}
            />
          </div>

          {/* Below lg the axis is replaced wholesale by the agenda. A
              proportional five-day grid at 375px gives each day 60px before
              lanes divide it, which is not a small version of this — it's an
              unreadable one. Which is also why ViewToggle is desktop-only:
              there is no phone rendering of this view to offer. */}
          <AxisGrid
            className="mt-5 hidden lg:block"
            columns={columns}
            axis={axis}
            hourPx={hourPx}
            // No `roomyHourPx`. `roomy` is min-width 1024 *and* min-height
            // 900, and a MacBook Air is exactly 900 tall — so it fired at
            // precisely the viewport where the grid stopped fitting and made
            // it 168px taller. That variant exists for the activation bands,
            // which want to fill a screen; a grid wants to fit one. Same
            // query, opposite goal.
            placements={placements}
            rails={rails}
            emptyLabel={filtering ? "Nothing matching" : "Still landing"}
          />

          <div className="lg:hidden">{agenda}</div>
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
        <div className="lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-20">
          <div data-controls="" className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Every room
            </p>
            {/* Names this view rather than the week — the hero already carried
                "Five days, one current." and a sticky column repeating it
                would put the page's headline on screen for the whole scroll.
                "Day by day" is what distinguishes the agenda from the grid,
                which is the only thing this header has to say. */}
            <h2 className="mt-3 font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white">
              Day by day.
            </h2>
            <p className="mt-3 text-sm text-white/55">{captionFor(which)}</p>

            <div className="mt-6 flex flex-col gap-3">
              <DayRail active="week" className="lg:hidden" />
              {/* Stacked selects, not chips: ten chips will not fit a 20rem
                  column, and the column has to stay shorter than the viewport
                  or the pin has nowhere to go. */}
              <Filters
                layout="stacked"
                circuits={circuits}
                venues={venues}
                circuit={circuit}
                venue={venue}
                onCircuit={setCircuit}
                onVenue={setVenue}
              />
              <ViewToggle
                view={which}
                onChange={switchView}
                className="self-start"
              />
            </div>
          </div>

          <div className="max-lg:mt-8">{agenda}</div>
        </div>
    );

  return (
    <>
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
