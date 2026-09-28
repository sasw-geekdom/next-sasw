"use client";

import { cn } from "@/lib/utils";
import type { LiveState } from "@/lib/live-clock";

/**
 * The live marker a session carries this week: "Now" while it runs, "Soon"
 * in the forty-five minutes before. Nothing otherwise — finished sessions
 * fade instead (see `pastClass`), and every other day draws as it always has.
 */
export function LiveChip({ state, className }: { state: LiveState; className?: string }) {
  if (state !== "now" && state !== "soon") return null;
  return state === "now" ? (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm bg-magenta px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white",
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
      Now
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-magenta px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-magenta",
        className,
      )}
    >
      Soon
    </span>
  );
}

/** Finished today: still there to find, but stepped back. */
export const pastClass = "opacity-45 saturate-50 transition-opacity hover:opacity-100 focus-within:opacity-100";
