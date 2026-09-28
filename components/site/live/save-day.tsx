"use client";

import { Download, Printer } from "lucide-react";

/**
 * Save the day you're looking at: as an image for a phone (it opens in a new
 * tab — long-press to Save to Photos on iPhone, Download image on Android),
 * or as a printable page for a desk. Follows the room filter, so a visitor
 * narrowed to one room saves that room's day.
 */
export function SaveDay({ iso, venue }: { iso: string; venue: string | null }) {
  const q = venue ? `?venue=${encodeURIComponent(venue)}` : "";
  const label = venue ? "this room's day" : "this day";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-widest">
      <a
        href={`/schedule/day/${iso}/image${q}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-white hover:border-magenta hover:text-magenta"
        title={`Save ${label} as an image`}
      >
        <Download className="size-3.5" aria-hidden="true" />
        Save as image
      </a>
      <a
        href={`/schedule/day/${iso}/print${q}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-white hover:border-magenta hover:text-magenta"
        title={`Print ${label}, or save it as a PDF`}
      >
        <Printer className="size-3.5" aria-hidden="true" />
        Print / PDF
      </a>
    </div>
  );
}
