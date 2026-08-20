"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// The chrome both calendar views share: a gutter of hour labels, a row of
// column heads, any number of rails above the axis, and the positioned blocks
// inside each column.
//
// What a column *means* is the only thing that separates the two views, and
// it is the whole answer to the scale problem. The week view's columns are the
// five days, which puts every venue running at once into one 240px column and
// splits it into lanes. The day view's columns are the venues, so TPR gets a
// full column to itself, a lane can never collide, and a thirty-minute speaker
// slot has three hundred pixels of width instead of eighty.
//
// Width is the binding constraint on this page — vertical scroll is free, and
// `hourPx` can be turned up as far as a day needs. Horizontal space cannot be
// bought, which is why the answer to a denser week is fewer columns rather
// than a taller grid.

export interface AxisColumn {
  key: string;
  /** "MON", "TPR". */
  label: string;
  /** "Sep 28", "12 sessions". */
  sublabel?: string;
  /** Makes the head a link — the week view sends each day to its own view. */
  href?: string;
  /**
   * A control at the end of the head row — the week's "Add day".
   *
   * Beside the label, pushed to the far edge, which is what the shortened
   * "MON 28" buys: the two together fit a 184px column at lg where "MON SEP
   * 28" plus a pill did not. Still two separate targets, so neither swallows
   * the other.
   */
  action?: React.ReactNode;
}

/** One block, with the geometry the axis needs to place it. */
export interface AxisPlacement {
  key: string;
  startMin: number;
  endMin: number;
  /** Column index within its cluster, and the cluster's width. */
  lane: number;
  lanes: number;
  node: React.ReactNode;
}

/**
 * A row above the axis, for anything the hour grid can't hold.
 *
 * Two kinds. `span` is one piece of content laid across the whole column area,
 * which is what the week's all-day bars need — Give-a-LOT runs Monday to
 * Wednesday and belongs to three columns at once. `byColumn` is the ordinary
 * case: content that belongs to one column, like the morning sessions that
 * come off the axis so it doesn't have to start at 7:30 AM.
 */
export interface AxisRail {
  label: string;
  span?: React.ReactNode;
  byColumn?: Record<string, React.ReactNode>;
}

/** "1 PM", "9 AM" — the gutter only ever labels whole hours. */
function hourLabel(hour24: number): string {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h} ${hour24 < 12 ? "AM" : "PM"}`;
}

export function AxisGrid({
  columns,
  axis,
  hourPx,
  roomyHourPx,
  placements,
  rails = [],
  emptyLabel,
  className,
}: {
  columns: AxisColumn[];
  axis: { startMin: number; endMin: number };
  /**
   * Pixels per hour. The week view runs coarse, because its blocks are whole
   * afternoons; the day view runs roughly double, because a thirty-minute slot
   * at the week's scale is 36px and can't hold a line of type.
   */
  hourPx: number;
  /**
   * The scale on a display with height to spare, if it should differ.
   *
   * `roomy` is the site's existing variant for exactly this — min-width 1024
   * *and* min-height 900 — and its own comment explains the key: height is the
   * constraint, so a 2560x1080 ultrawide is treated like the laptop it
   * resembles. The four activation bands already use it to go full-height.
   *
   * Copy-fitting still runs at `hourPx`, the base. A block that turns out
   * taller than the maths assumed simply carries a little more air under its
   * text, which is the right way for this to be wrong; computing lines at the
   * larger scale would overflow every block on the displays that don't get it.
   */
  roomyHourPx?: number;
  placements: Record<string, AxisPlacement[]>;
  rails?: AxisRail[];
  /** What an empty column says. Varies with whether a filter is on. */
  emptyLabel: string;
  className?: string;
}) {
  // Whole hours across the axis, for the gutter labels and the rules behind
  // the blocks. The end hour is a boundary, not a row, so it isn't drawn.
  const hours = React.useMemo(() => {
    const list: number[] = [];
    for (let m = axis.startMin; m < axis.endMin; m += 60) list.push(m / 60);
    return list;
  }, [axis]);

  // Inline rather than a Tailwind class: the column count is data now — five
  // days in one view, however many venues are running in the other.
  const template = {
    gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(0, 1fr))`,
  };

  return (
    <div
      className={cn(
        className,
        // `--hour` is set by these two classes, not by the inline style, and
        // that is the whole trick. An inline custom property beats every class
        // rule including one inside a media query, so setting `--hour` in
        // `style` made the roomy override unreachable — it compiled, it was on
        // the element, and it could never win. The inline style now carries
        // only the two candidate values; the classes choose between them.
        "[--hour:var(--hour-base)] roomy:[--hour:var(--hour-roomy)]",
      )}
      style={
        {
          "--hour-base": `${hourPx}px`,
          "--hour-roomy": `${roomyHourPx ?? hourPx}px`,
        } as React.CSSProperties
      }
    >
      <div className="grid" style={template}>
        {/* Column heads, styled as the day rail's segments: one bordered bar
            divided by hairlines, mono labels, a lit ground. The rail itself is
            gone from the week view because these are the same five
            destinations — so the look moves down to where the days actually
            live rather than being repeated above them.

            One row, not two. The label and the day's control share it, pushed
            apart, which is why the label runs "MON 28" — the rail's own format
            — instead of "MON SEP 28". At lg a column is 184px and the longer
            form plus a pill reading "Add 2 more" does not fit; the month never
            carried its weight anyway, with the eyebrow directly above saying
            Sept 28 – Oct 2. */}
        <div className="border-b border-white/15 bg-white/[0.04]" />
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex items-center justify-between gap-2 border-b border-l border-white/15 bg-white/[0.04] px-3 py-2"
          >
            {col.href ? (
              <Link
                href={col.href}
                className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
              >
                <span className="text-white transition-colors group-hover:text-magenta">
                  {col.label}
                </span>
                {col.sublabel && (
                  // Dropped below xl *only where an action shares the row* —
                  // the week's day heads carry "Add day", and at lg a 184px
                  // column cannot hold both. The day view's heads have no
                  // control and three wide columns, so hiding their session
                  // count there was paying a cost the constraint never
                  // imposed.
                  <span
                    className={cn(
                      "text-white/45",
                      col.action ? "hidden xl:inline" : "inline",
                    )}
                  >
                    {col.sublabel}
                  </span>
                )}
                {/* The head was a link that only announced itself on hover,
                    which was survivable while the rail carried the same five
                    destinations and is not now that it doesn't.

                    `ArrowUpRight` with the up-and-right hop, which is the
                    house treatment for "this goes somewhere" — room-flow,
                    model-band and speaker-lineup all use exactly this. A plain
                    right arrow that only slid sideways was a fourth variant of
                    a thing the site had already settled. */}
                <ArrowUpRight
                  className="size-3.5 shrink-0 text-white/30 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <p className="truncate font-mono text-[11px] uppercase tracking-widest">
                <span className="text-white">{col.label}</span>
                {col.sublabel && (
                  <span
                    className={cn(
                      "text-white/45",
                      col.action ? "hidden xl:inline" : "inline",
                    )}
                  >
                    {" "}
                    {col.sublabel}
                  </span>
                )}
              </p>
            )}
            {col.action}
          </div>
        ))}

        {rails.map((rail) => (
          <React.Fragment key={rail.label}>
            <div className="border-b border-white/10 py-1.5 pr-3 text-right">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                {rail.label}
              </span>
            </div>
            {rail.span ? (
              <div
                // `py-1.5`, not `py-2`. The rail's own padding is one of the
                // few places left to give the grid height back, and its bars
                // already carry their own border and background — the extra
                // 4px was framing a frame.
                className="grid border-b border-white/10 py-1.5"
                style={{
                  gridColumn: `span ${columns.length}`,
                  gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                }}
              >
                {rail.span}
              </div>
            ) : (
              columns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col gap-1.5 border-b border-l border-white/10 p-1.5"
                >
                  {rail.byColumn?.[col.key]}
                </div>
              ))
            )}
          </React.Fragment>
        ))}

        {/* The hour gutter */}
        <div className="relative">
          {hours.map((h, i) => (
            <div key={h} className="h-[var(--hour)]">
              {/* Lifted half a line so the label sits on its rule rather than
                  under it. The first would clip against the rail above. */}
              <span
                className={cn(
                  "block pr-3 text-right font-mono text-[10px] uppercase tracking-widest text-white/35",
                  i > 0 && "-translate-y-1/2",
                )}
              >
                {hourLabel(h)}
              </span>
            </div>
          ))}
          {/* The closing hour.
          
              The loop labels the top of each row and stops before `endMin`,
              because the end is a boundary rather than a row — so a 1–8 PM
              axis printed 1 through 7 and left its own last line unnamed.
              That is fine while nothing reaches it and wrong the moment
              something does: Startup Bash ends at 8, and its bottom edge was
              sitting on an hour the gutter never mentioned.

              Absolute, so it adds no height, and centred on the boundary the
              same way `-translate-y-1/2` centres the others on theirs. */}
          <span className="absolute inset-x-0 bottom-0 translate-y-1/2 pr-3 text-right font-mono text-[10px] uppercase tracking-widest text-white/35">
            {hourLabel(axis.endMin / 60)}
          </span>
        </div>

        {columns.map((col, colIndex) => {
          const placed = placements[col.key] ?? [];
          return (
            // `border-b` closes the axis. Rows carry a top border, so the
            // final hour had a label and no rule to belong to.
            <div
              key={col.key}
              className="relative border-b border-l border-white/10"
            >
              {/* The rules, as a layer behind the blocks. Drawing them as real
                  boxes is what gives the column its height, so the grid can't
                  disagree with the axis it was built from. */}
              {hours.map((h, i) => (
                <div
                  key={h}
                  className={cn(
                    "h-[var(--hour)]",
                    i > 0 && "border-t border-white/10",
                  )}
                />
              ))}

              {placed.map((p) => (
                <div
                  key={p.key}
                  // `bg-black` so the hour rules stop at the block rather than
                  // running through it: every block fill is a tint, and a rule
                  // behind a 12% wash reads straight through it.
                  //
                  // `cal-cell` and `--i` are the view transition's handles —
                  // the wrapper decides in or out, the index staggers left to
                  // right across the week. See globals.css.
                  className="cal-cell absolute bg-black p-[3px]"
                  style={
                    {
                      "--i": colIndex,
                      top: `calc(${p.startMin - axis.startMin} / 60 * var(--hour))`,
                      height: `calc(${p.endMin - p.startMin} / 60 * var(--hour))`,
                      left: `${(p.lane / p.lanes) * 100}%`,
                      width: `${(1 / p.lanes) * 100}%`,
                    } as React.CSSProperties
                  }
                >
                  {p.node}
                </div>
              ))}

              {placed.length === 0 && !hasRailContent(rails, col.key) && (
                <p className="absolute inset-x-0 top-6 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
                  {emptyLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Whether any rail is carrying something for this column. */
function hasRailContent(rails: AxisRail[], key: string): boolean {
  return rails.some((rail) => {
    const node = rail.byColumn?.[key];
    return Array.isArray(node) ? node.length > 0 : !!node;
  });
}
