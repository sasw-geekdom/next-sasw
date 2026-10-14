"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";

/**
 * The recap filmstrip's frame, with the one control it needs: pause and play.
 *
 * A button rather than pause-on-hover. The cards don't link anywhere, so
 * stopping under the cursor gave a visitor nothing to do and made the hero
 * look stalled whenever a pointer happened to rest on it; a button works for
 * keyboard and touch as well, which hover never did, and covers the guideline
 * that motion next to other content can be paused. Hidden for anyone who has
 * asked for reduced motion: the strip already holds still for them.
 */
export function RecapStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  const [paused, setPaused] = React.useState(false);
  return (
    <div className={`recap-strip relative ${className ?? ""}`} data-paused={paused || undefined}>
      {children}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Play the photos" : "Pause the photos"}
        className="absolute bottom-1.5 right-6 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 backdrop-blur transition-colors hover:border-magenta hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta motion-reduce:hidden lg:bottom-2.5"
      >
        {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
