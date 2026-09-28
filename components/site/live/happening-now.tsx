"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { clockText, liveState, useChicagoNow } from "@/lib/live-clock";
import type { CalendarItem } from "@/lib/schedule";
import type { VenueGetThere } from "@/lib/locations";

/**
 * "Happening now" and "Up next", for today only.
 *
 * Renders nothing until the browser knows the time, nothing on any day but
 * today, and nothing once today's programme is over — so outside the event
 * the schedule looks exactly as it did. The list is whatever the cached page
 * holds; only which part of it is "now" is worked out here, live.
 */
export function HappeningNow({
  items,
  venues,
  className,
  /** Link to today's day page — for the week view, not the day page itself. */
  linkDay = false,
}: {
  items: CalendarItem[];
  venues: Record<string, VenueGetThere>;
  className?: string;
  linkDay?: boolean;
}) {
  const now = useChicagoNow();
  if (!now.ms) return null;
  const today = items.filter((i) => i.dayIso === now.iso).sort((a, b) => a.startMin - b.startMin);
  if (!today.length) return null;

  const live = today.filter((i) => liveState(i, now) === "now");
  const next = today.filter((i) => i.startMin > now.min).slice(0, 4);
  if (!live.length && !next.length) {
    return (
      <div id="happening-now" className={cn("scroll-mt-20 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4", className)}>
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
          <span className="text-magenta">{"//"}</span> That&rsquo;s a wrap for today
        </p>
        <p className="mt-1 text-sm text-white/70">Everything below has finished — it stays here so you can find what you saw.</p>
      </div>
    );
  }

  const where = (i: CalendarItem) => {
    const v = venues[i.venueSlug];
    return { label: [v?.name ?? i.venueName, v?.floor].filter(Boolean).join(", "), directions: v?.directions };
  };

  const Row = ({ i, when }: { i: CalendarItem; when: string }) => {
    const w = where(i);
    const title = i.longTitle || i.title;
    return (
      <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-white/10 py-3 first:border-t-0">
        <span className="w-28 shrink-0 whitespace-nowrap font-mono text-[11px] uppercase tracking-widest text-magenta">{when}</span>
        <span className="min-w-0 flex-1">
          {i.href ? (
            <Link href={i.href} className="font-semibold text-white hover:underline">
              {title}
            </Link>
          ) : (
            <span className="font-semibold text-white">{title}</span>
          )}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-white/60">
            <span>{w.label}</span>
            {w.directions && (
              <a
                href={w.directions}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                <MapPin className="size-3" aria-hidden="true" />
                Directions
              </a>
            )}
          </span>
        </span>
      </li>
    );
  };

  return (
    <div id="happening-now" className={cn("grid scroll-mt-20 gap-4 rounded-lg border border-magenta/40 bg-magenta/[0.06] px-5 py-4 md:grid-cols-2 md:gap-8", className)}>
      <section aria-label="Happening now">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white">
          <span className="size-2 animate-pulse rounded-full bg-magenta" aria-hidden="true" />
          Happening now
          <span className="text-white/50">· {clockText(now.min)}</span>
        </p>
        {live.length ? (
          <ul className="mt-2">
            {live.map((i) => (
              <Row key={i.slug} i={i} when={`until ${clockText(i.endMin)}`} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-white/70">
            Nothing on this minute — first up is {next[0]?.longTitle || next[0]?.title} at {clockText(next[0].startMin)}.
          </p>
        )}
      </section>
      {next.length > 0 && (
        <section aria-label="Up next">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/70">Up next</p>
          <ul className="mt-2">
            {next.map((i) => (
              <Row key={i.slug} i={i} when={clockText(i.startMin)} />
            ))}
          </ul>
          {linkDay && (
            <Link
              href={`/schedule/day/${now.iso}`}
              className="mt-1 inline-block font-mono text-[11px] uppercase tracking-widest text-magenta hover:underline"
            >
              See all of today
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
