"use client";

import * as React from "react";
import { HeroShell } from "@/components/site/hero-shell";
import { cn } from "@/lib/utils";
import {
  TRACK_NAMES,
  CIRCUIT_COLORS,
  DEFAULT_CIRCUIT_COLOR,
  type TrackName,
} from "@/lib/tracks";

// Cursor sweeps the five circuit colors across the bolt — "five circuits, one
// current" — and the bolt itself is the doorway into /bolt-runner, the hidden
// page. It used to open the 15-years archive; that's still reachable from the
// footer, which is now its only route in.
const SWEEP = TRACK_NAMES.map((n) => CIRCUIT_COLORS[n]);

export function Hero() {
  // Hovering (or tapping) a circuit feeds its colour to the bolt. The canvas
  // sweep and this can't fire at once — one cursor, two targets — so they
  // hand off cleanly.
  const [active, setActive] = React.useState<TrackName | null>(null);
  const color = active ? CIRCUIT_COLORS[active] : DEFAULT_CIRCUIT_COLOR;

  return (
    <HeroShell
      // Year 11 leads. It is the strongest credibility fact the week has and it
      // appeared nowhere a visitor could see it — only inside the .ics PRODID.
      eyebrow="Year 11 · Sept 28 – Oct 2, 2026"
      headline={
        <>
          The current{" "}
          <span className="whitespace-nowrap">
            runs through <span className="text-magenta">SA.</span>
          </span>
        </>
      }
      // Concrete nouns before the metaphor closes. "Five days, five circuits,
      // one current" is a cadence, not a description — a first-time reader had
      // no way to tell talks from pitch stages from parties. Every noun here is
      // backed by something already programmed: State of Innovation (keynote),
      // Mission and Latin Tech Pitch (pitch stages), PySanAntonio II
      // (workshops), the Bash and the Brunch (nights after). No count yet —
      // nine activations are confirmed against a week that isn't fully
      // programmed, and /sessions is the surface that says so.
      blurb="San Antonio Startup + Tech Week. Keynotes, pitch stages, workshops, and the nights after — five days, five circuits, one current."
      cta={{
        href: "/register",
        label: "Get on the list.",
        note: "Free registration.",
      }}
      bolt={{
        color,
        sweep: SWEEP,
        href: "/bolt-runner",
        label: "Run the current — a hidden page",
      }}
    >
      {/* Five circuits — who it's for, and what tints the bolt */}
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-6 lg:justify-start">
        {TRACK_NAMES.map((name) => {
          const on = active === name;
          return (
            <li key={name}>
              <button
                type="button"
                aria-pressed={on}
                onMouseEnter={() => setActive(name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(name)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((a) => (a === name ? null : name))}
                className="group flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-transform",
                    on && "scale-150",
                  )}
                  style={{ backgroundColor: CIRCUIT_COLORS[name] }}
                />
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    on
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </HeroShell>
  );
}
