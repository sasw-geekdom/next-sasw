"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { chicagoParts, clockText, SOON_MIN, useChicagoNow } from "@/lib/live-clock";

/**
 * The line at the top of a talk page that says where the talk stands right
 * now: cancelled, changed, happening now (and where), starting soon, or
 * ended. Worked out in the browser against the clock; nothing at all when the
 * talk is on another day and nothing's changed.
 */
export function TalkStatus({
  startsAt,
  endsAt,
  where,
  directions,
  changeNote,
  cancelled,
}: {
  startsAt: number;
  endsAt: number;
  where: string | null;
  directions?: string;
  changeNote: string | null;
  cancelled: boolean;
}) {
  const now = useChicagoNow();
  const start = chicagoParts(startsAt);
  const end = chicagoParts(endsAt);

  let tone: "live" | "note" | "done" | null = null;
  let text: React.ReactNode = null;

  if (cancelled) {
    tone = "note";
    text = <>Cancelled{changeNote ? ` — ${changeNote}` : ""}</>;
  } else if (now.ms && now.ms >= startsAt && now.ms < endsAt) {
    tone = "live";
    text = <>Happening now{where ? ` in ${where}` : ""} · until {clockText(end.min)}</>;
  } else if (now.ms && now.ms < startsAt && startsAt - now.ms <= SOON_MIN * 60_000) {
    tone = "live";
    text = <>Starts at {clockText(start.min)}{where ? ` in ${where}` : ""}</>;
  } else if (now.ms && now.ms >= endsAt && now.iso === end.iso) {
    tone = "done";
    text = <>Ended at {clockText(end.min)}</>;
  }

  const note = !cancelled && changeNote ? changeNote : null;
  if (!tone && !note) return null;

  return (
    <div className="mt-5 flex flex-col gap-2">
      {tone && (
        <p
          className={cn(
            "inline-flex w-fit flex-wrap items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-widest",
            tone === "live" && "bg-magenta text-white",
            tone === "note" && "border border-magenta text-magenta",
            tone === "done" && "border border-white/20 text-white/70",
          )}
        >
          {tone === "live" && <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />}
          {text}
          {tone === "live" && directions && (
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline decoration-white/50 underline-offset-2"
            >
              <MapPin className="size-3" aria-hidden="true" />
              Directions
            </a>
          )}
        </p>
      )}
      {note && (
        <p className="w-fit rounded-md border border-magenta/60 px-3 py-1.5 text-sm text-white">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-magenta">Changed</span> · {note}
        </p>
      )}
    </div>
  );
}
