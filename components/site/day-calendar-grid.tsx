"use client";

import * as React from "react";
import type { CalendarItem, CalendarSpan, DayVenue } from "@/lib/schedule";
import {
  AxisGrid,
  type AxisPlacement,
  type AxisRail,
} from "@/components/site/calendar/axis-grid";
import {
  Block,
  SpanBar,
  StackBlock,
  StackSpanBar,
  hasSpareRows,
  placeLanes,
} from "@/components/site/calendar/blocks";
import { DayRail } from "@/components/site/calendar/day-rail";
import {
  ExportBar,
  Filters,
  useUrlFilter,
  usePicked,
  type Option,
} from "@/components/site/calendar/controls";

// One day, with the venues as columns.
//
// This is where the detail lives. The week view fits five days across the page
// and therefore gives every simultaneous venue an eighty-pixel lane; here a
// day has the full width and TPR gets a column to itself. Three venues on a
// max-w-7xl is roughly 400px each — wider than a *day* column in the week
// view — and lanes almost never collide, because a room can only overlap
// itself if it is running two rooms inside one room.
//
// The venue filter is still here and still useful (one column, full width),
// but it is no longer load-bearing: the layout already did what filtering used
// to have to do.

/**
 * Pixels per hour, chosen from what the day actually contains.
 *
 * A day of five-hour takeovers wants to draw compact — at the fine scale it
 * would run to two thousand pixels of mostly one block. A day carrying a
 * thirty-minute speaker track wants the opposite: at the week's 72px an
 * half-hour slot is 36px, which holds no line of type at all. So the scale
 * follows the shortest thing on the day, and the axis is as tall as it needs
 * to be rather than as tall as a constant says.
 */
function scaleFor(items: CalendarItem[]): number {
  if (items.length === 0) return 80;
  const shortest = Math.min(...items.map((i) => i.endMin - i.startMin));
  if (shortest <= 30) return 132;
  if (shortest <= 60) return 104;
  return 80;
}

export function DayCalendarGrid({
  activeDay,
  venues,
  items,
  spans,
  axis,
  circuits,
}: {
  /** This day's ISO date, for the rail's active segment. */
  activeDay: string;
  venues: DayVenue[];
  items: CalendarItem[];
  spans: CalendarSpan[];
  axis: { startMin: number; endMin: number };
  circuits: Option[];
}) {
  const [circuit, setCircuit] = useUrlFilter("circuit");
  const [venue, setVenue] = useUrlFilter("venue");
  const { picked, toggle, clear } = usePicked();
  const filtering = circuit !== null || venue !== null;

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

  // Columns are the venues on this day. A venue filtered out loses its column
  // entirely rather than standing empty — an empty column is a room that has
  // nothing on, and that is a different statement from one the reader hid.
  const columns = React.useMemo(
    () =>
      venues
        .filter((v) => venue === null || v.slug === venue)
        .map((v) => {
          // Spans count too. A room whose only entry that day is a multi-day
          // drive was reporting "0 sessions" directly above the bar showing
          // the thing it was denying.
          const count =
            shownItems.filter((i) => i.venueSlug === v.slug).length +
            shownSpans.filter((s) => s.venueSlug === v.slug).length;
          return {
            key: v.slug,
            label: v.short,
            sublabel: count === 1 ? "1 session" : `${count} sessions`,
            href: `/schedule/${v.slug}`,
          };
        }),
    [venues, venue, shownItems, shownSpans],
  );

  const hourPx = React.useMemo(() => scaleFor(shownItems), [shownItems]);

  const placements = React.useMemo(() => {
    const out: Record<string, AxisPlacement[]> = {};
    for (const col of columns) {
      const inColumn = shownItems
        .filter((i) => i.venueSlug === col.key)
        .sort((a, b) => a.startMin - b.startMin);
      out[col.key] = placeLanes(inColumn).map((item) => ({
        key: item.slug,
        startMin: item.startMin,
        endMin: item.endMin,
        lane: item.lane,
        lanes: item.lanes,
        node: (
          <Block
            item={item}
            picked={picked.includes(item.slug)}
            onToggle={toggle}
            showVenue={false}
            dense={item.lanes >= 2}
            lanes={item.lanes}
            spare={hasSpareRows(item.startMin, item.endMin, hourPx)}
            fill
          />
        ),
      }));
    }
    return out;
  }, [columns, shownItems, picked, toggle, hourPx]);

  const rails = React.useMemo(() => {
    if (shownSpans.length === 0) return [];
    const byColumn: Record<string, React.ReactNode> = {};
    for (const span of shownSpans) {
      byColumn[span.venueSlug] = <SpanBar key={span.slug} span={span} />;
    }
    // Per column here, not spanning: on one day a multi-day drive belongs to
    // the room running it, and the week's "which days" question is already
    // answered by being on this page.
    return [{ label: "All day", byColumn }] satisfies AxisRail[];
  }, [shownSpans]);

  const hidden = picked.filter(
    (slug) => !shownItems.some((i) => i.slug === slug),
  ).length;

  return (
    <>
      {/* Grouped exactly as the week groups them — the rail chooses the view,
          the chips narrow it. Moved off the headline row for the same reason:
          on a phone it landed under the display type with nothing to tie it
          to, and it belongs with the other controls. */}
      <div className="mt-6 flex flex-col gap-3 lg:mt-8">
        <DayRail active={activeDay} className="lg:hidden" />
        <Filters
          circuits={circuits}
          venues={venues.map((v) => ({ value: v.slug, label: v.name }))}
          circuit={circuit}
          venue={venue}
          onCircuit={setCircuit}
          onVenue={setVenue}
        />
      </div>

      {columns.length === 0 || shownItems.length === 0 ? (
        // No hour axis where nothing is on the hour. Drawing one anyway gave
        // Tuesday five empty rows of rules under a column head — a grid that
        // looks broken rather than a day that is still filling. Anything on
        // the all-day rail still shows, because that is the thing the day
        // does have.
        <div className="mt-10 flex flex-col gap-3">
          {shownSpans.map((span) => (
            <SpanBar key={span.slug} span={span} />
          ))}
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/35">
            {filtering ? "Nothing matching" : "Still landing"}
          </p>
        </div>
      ) : (
        <>
          <AxisGrid
            className="mt-10 hidden lg:block"
            columns={columns}
            axis={axis}
            hourPx={hourPx}
            // A quarter more on a roomy display. Proportional to the day's own
            // scale rather than a constant, so a day of thirty-minute slots
            // (which already runs fine) grows by the same ratio as a day of
            // takeovers (which runs coarse).
            roomyHourPx={Math.round(hourPx * 1.25)}
            placements={placements}
            rails={rails}
            emptyLabel={filtering ? "Nothing matching" : "Nothing here"}
          />

          {/* Below lg, one venue after another rather than side by side.
              Columns need width and a phone has none to give. */}
          <div className="mt-10 flex flex-col gap-8 lg:hidden">
            {columns.map((col) => {
              const inColumn = shownItems
                .filter((i) => i.venueSlug === col.key)
                .sort((a, b) => a.startMin - b.startMin);
              const colSpans = shownSpans.filter(
                (s) => s.venueSlug === col.key,
              );
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest">
                    <span className="text-white">{col.label}</span>{" "}
                    <span className="text-white/45">{col.sublabel}</span>
                  </p>
                  {colSpans.map((span) => (
                    <StackSpanBar key={span.slug} span={span} />
                  ))}
                  {inColumn.map((item) => (
                    <StackBlock
                      key={item.slug}
                      item={item}
                      picked={picked.includes(item.slug)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ExportBar picked={picked} onClear={clear} hidden={hidden} />
    </>
  );
}
