"use client";

import * as React from "react";
import Link from "next/link";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";
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
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      {/*
        `contents` on phones, a real block from lg up. That one switch is what
        lets the bolt sit between the headline and the rest on a phone while
        desktop keeps the exact two-column layout it always had.

        Dissolving this wrapper promotes masthead and detail to grid items, so
        `order` can interleave them with the bolt. From lg it becomes a normal
        block again and is a single grid item — which matters, because the
        obvious alternative (three grid items, bolt spanning two rows) does
        not work: the bolt is 592px against 458px of text, and a row span
        hands that 134px difference to the gap between the two text blocks.
      */}
      <div className="contents lg:block lg:text-left">
        {/* Masthead — dates and headline. First thing on a phone. */}
        <div className="order-1 text-center lg:text-left">
          {/* Dates only. "Free" is the page's most valuable word, but it says
              it once — down by the CTA, where someone is actually deciding
              whether to click. Repeating it up here spent the word twice in
              one viewport and made it read as a sales pitch, not a fact. */}
          <p className="font-mono text-sm uppercase tracking-widest text-magenta">
            Sept 28 – Oct 2, 2026
          </p>

          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
            The current{" "}
            <span className="whitespace-nowrap">
              runs through <span className="text-magenta">SA.</span>
            </span>
          </h1>
        </div>

        {/* The detail — what it is, who it's for, and the way in. `order-3`
            puts it after the bolt on a phone; from lg the wrapper is a block
            again and this simply follows the masthead as it always did.
            `lg:mt-5` carries the spacing the blurb's own top margin used to
            provide, which had to move here so the phone's grid gap isn't
            doubled up. */}
        <div className="order-3 text-center lg:mt-5 lg:text-left">
          {/* Concrete nouns before the metaphor closes. "Five days, five
            circuits, one current" is a cadence, not a description — a
            first-time reader had no way to tell talks from pitch stages from
            parties. Every noun here is backed by something already
            programmed: State of Innovation (keynote), Mission and Latin Tech
            Pitch (pitch stages), PySanAntonio II (workshops), the Bash and
            the Brunch (nights after). No count yet — nine activations are
            confirmed against a week that isn't fully programmed, and /sessions
            is the surface that says so. */}
          <p className="mx-auto max-w-lg text-pretty text-lg text-muted-foreground lg:mx-0">
            San Antonio Startup + Tech Week. Keynotes, pitch stages, workshops,
            and the nights after — five days, five circuits, one current.
          </p>

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

          <div className="mt-6 flex flex-col items-center gap-2.5 sm:mt-8 sm:gap-3 lg:items-start">
            <ButtonLink href="/register" size="lg">
              Get on the list.
            </ButtonLink>
            {/* What the button actually does. "Get on the list." is on-voice
                but opaque about whether it's a waitlist, a newsletter or the
                real thing — naming it as registration, and free, is the whole
                job of this line. */}
            <p className="text-sm text-muted-foreground">Free registration.</p>
          </div>
        </div>
      </div>

      {/* The current — the bolt is the doorway into the hidden page. `order-2`
          drops it between the masthead and the detail on a phone, so it's the
          thing you scroll into rather than past. A sibling of the wrapper, not
          a child, because from lg it has to be the second column. */}
      <div className="order-2">
        <Link
          href="/bolt-runner"
          aria-label="Run the current — a hidden page"
          className="group mx-auto block w-64 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:w-96 lg:w-full"
        >
          <ShaderCanvas
            color={color}
            sweep={SWEEP}
            maskClassName="bolt-mask"
            fallbackSrc="/brand/sastw-bolt.svg"
            className="aspect-square w-full"
          />
        </Link>
      </div>
    </section>
  );
}
