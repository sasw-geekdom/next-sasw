"use client";

import * as React from "react";
import { matchesQuery } from "@/lib/calendar-search";
import type { CalendarItem, CalendarSpan, DayVenue } from "@/lib/schedule";
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
  useUrlFilter,
  usePicked,
  type Option,
} from "@/components/site/calendar/controls";
export function DayCalendarGrid({
  activeDay,
  venues,
  items,
  spans,
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
  // Same key the week uses, so a search survives clicking through to a day.
  const [query, setQuery] = useUrlFilter("q");
  const { picked, toggle, clear } = usePicked();
  const filtering = circuit !== null || venue !== null || query !== null;

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

  // Columns are the venues on this day. A venue filtered out loses its column
  // entirely rather than standing empty — an empty column is a room that has
  // nothing on, and that is a different statement from one the reader hid.
  const columns = React.useMemo(
    () =>
      venues
        .filter((v) => venue === null || v.slug === venue)
        .map((v) => {
          // Only what the column draws. Spans used to count here, because
          // they used to sit *in* the column — a room whose one entry was a
          // multi-day drive would otherwise have reported "0 sessions" above
          // the bar showing it. They ride above all the columns now, so
          // counting them put "1 session" over a column reading "Nothing
          // here", which is a straight contradiction.
          const count = shownItems.filter((i) => i.venueSlug === v.slug).length;
          return {
            key: v.slug,
            label: v.short,
            sublabel: count === 1 ? "1 session" : `${count} sessions`,
            href: `/schedule/${v.slug}`,
          };
        }),
    [venues, venue, shownItems],
  );

  // The same split the week makes: a 7:30 AM brunch belongs on a rail, not on
  // an axis five hours of which would then be empty.
  const hidden = picked.filter(
    (slug) => !shownItems.some((i) => i.slug === slug),
  ).length;

  return (
    <>
      {/* Grouped exactly as the week groups them — the rail chooses the view,
          the chips narrow it. Moved off the headline row for the same reason:
          on a phone it landed under the display type with nothing to tie it
          to, and it belongs with the other controls. */}
      {/* Pinned under the navbar below lg — the same reason the week's is.
          A Tuesday runs past three screens on a phone and the control that
          moves to another day was at the top of the first one. */}
      <div className="sticky top-16 z-30 -mx-6 mt-6 bg-black px-6 pb-2.5 lg:hidden">
        <DayRail active={activeDay} />
      </div>

      {/* One bar, the shape the week view uses: what is being shown on the
          left, which day on the right.
          
          These were three separate things at three different left edges — a
          search box, then a "Circuit" row of five chips, then a "Venue" row of
          four, with their legends hanging in the margin at a fourth. 155px of
          controls in four alignments above a grid whose whole design is that
          it fits one screen. The chips said the vocabulary out loud, which is
          worth something; it is not worth a third of the viewport on the page
          that has the least of it to spare, and the week view settled the same
          trade the same way. */}
      <div className="mt-4 flex flex-col items-start gap-3 lg:mt-8">
        {/* Which day, then what within it — the order the rail's own note
            argues for and the order the phone gets. Its own line rather than
            the right end of the filters' row: at 1440 the two together are
            1,264px against 1,232 of measure, so `justify-between` dropped the
            rail to a second line anyway and would put it back on the right on
            a wider screen. A control that changes position with the window is
            worse than one that always starts where everything else does. */}
        <DayRail active={activeDay} className="hidden lg:block" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 max-lg:w-full">
          <Filters
            layout="compact"
            circuits={circuits}
            venues={venues.map((v) => ({ value: v.slug, label: v.name }))}
            circuit={circuit}
            venue={venue}
            query={query}
            onCircuit={setCircuit}
            onVenue={setVenue}
            onQuery={setQuery}
          />
        </div>
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
          {/* The same board the week view draws, with rooms for columns.
              
              The hour axis is gone from here too, and with it the "All day"
              and "Before noon" rails and the hour gutter — all three existed
              to hold what the axis could not place, so removing it removes
              them. What is lost is simultaneity: an axis shows two takeovers
              overlapping, and a column of cards can only state their times.
              This was the last surface drawing one.
              
              What is gained is that a day reads the way the week does, and
              that a room with fourteen sessions scrolls inside its column
              instead of running the page to three screens. */}
          <ColumnBoard
            className="mt-10 hidden lg:block"
            /* No `sublabel` — the board counts the column itself, and the
               room's own count is exactly what that sublabel was. Passing it
               would print the number twice. The stack below lg still uses it,
               because nothing counts for it there. */
            columns={columns.map((c) => ({
              key: c.key,
              label: c.label,
              href: c.href,
            }))}
            groupBy={(i) => i.venueSlug}
            items={shownItems}
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
                  {/* Matching the column heads above — the room in the
                      display face, its count in mono. */}
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white">
                      {col.label}
                    </span>
                    {/* Counted here rather than taken from `col.sublabel`.
                        That count excludes the all-week bars, which is right
                        for the desktop board — there they ride above every
                        column rather than inside one. In this stack they are
                        inside the room, so the borrowed number put "0
                        sessions" directly above a Give-a-LOT card. */}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                      {inColumn.length + colSpans.length === 1
                        ? "1 session"
                        : `${inColumn.length + colSpans.length} sessions`}
                    </span>
                  </p>
                  {colSpans.map((span) => (
                    <StackSpanBar key={span.slug} span={span} />
                  ))}
                  {inColumn.map((item) => (
                    <StackBlock
                      key={item.slug}
                      item={item}
                      flat
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
