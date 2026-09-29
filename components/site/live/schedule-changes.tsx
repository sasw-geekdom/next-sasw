"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { clockText, useChicagoNow } from "@/lib/live-clock";
import type { ScheduleChange } from "@/lib/schedule";

/**
 * Late changes, above the schedule: every session the organisers have flagged
 * in the CMS — standalone or inside an activation, whose talks never get a
 * block of their own on the grid.
 *
 * On a day page, `iso` is that day. On the week page it is left out and the
 * notice follows the clock: today's changes during the week, nothing
 * otherwise.
 */
export function ScheduleChanges({
  changes,
  iso,
  className,
}: {
  changes: ScheduleChange[];
  iso?: string;
  className?: string;
}) {
  const now = useChicagoNow();
  const day = iso ?? (now.ms ? now.iso : "");
  const shown = changes.filter((c) => c.dayIso === day);
  if (!shown.length) return null;
  return (
    <div className={cn("rounded-lg border border-magenta/60 px-5 py-4", className)}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-magenta">
        Schedule changes{iso ? "" : " today"}
      </p>
      <ul className="mt-2">
        {shown.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-white/10 py-2.5 text-sm first:border-t-0"
          >
            <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/50">
              {clockText(c.startMin)}
            </span>
            <span className="min-w-0 flex-1">
              <Link href={c.href} className={cn("font-semibold text-white hover:underline", c.cancelled && "line-through")}>
                {c.title}
              </Link>
              <span className="text-white/75">
                {" "}
                · {c.cancelled ? "Canceled" : ""}
                {c.cancelled && c.note ? " — " : ""}
                {c.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
