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
      // Concrete nouns, then who they are for. Every noun in the first half is
      // backed by something already programmed: State of Innovation (keynote),
      // Mission and Latin Tech Pitch (pitch stages), PySanAntonio II
      // (workshops), the Bash and the Brunch (nights after). No count yet —
      // the week isn't fully programmed, and /schedule is the surface that
      // says so.
      //
      // The second half is the organisers' own range line, verbatim, and it
      // closes the gap the first half left: a reader could tell talks from
      // pitch stages and still not know whether the week was pitched above
      // them. "Capital" as a circuit name does not answer that; "pre-seed to
      // Series A" does.
      //
      // It sat under the circuit chips first, which read as a stranded
      // caption — small, grey, between the chips and the button, in the one
      // place a reader skips. In the blurb it is in the paragraph they
      // actually read, and the hero goes from what happens to who it is for
      // without a second block to land in.
      //
      // One sentence, not two lists. Dropped in whole it read as two
      // catchphrases pasted together: four nouns stopping on a period, then
      // three ranges stopping on three more, with nothing joining them. The
      // "for everyone from" is the join — it turns the ranges from a second
      // slogan into the thing the first half is being offered to, which is
      // what they were always saying and never grammatically doing.
      //
      // "Five days" came off the front. The eyebrow directly above this reads
      // "Year 11 · Sept 28 – Oct 2, 2026", so the count was being stated twice
      // within thirty pixels, and the sentence needed the room more.
      //
      // What it cost: "— five days, five circuits, one current", which used to
      // close this line. The cadence is not lost, only moved off this
      // paragraph — "one current" is the h1 directly above, the five circuits
      // are the list directly below, the five days are the eyebrow, and the
      // full line still runs in the footer, the metadata and the OG cards.
      blurb="San Antonio Startup + Tech Week — keynotes, pitch stages, workshops and the nights after, for everyone from pre-seed to Series A, solopreneur to scale-up, local to regional."
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
