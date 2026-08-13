"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { LinkedInMark } from "@/components/site/linkedin-mark";
import { cn } from "@/lib/utils";
import type { CardSpeaker } from "@/components/site/speaker-card";

// The homepage lineup at lg and up: an index of names beside one large
// portrait that follows whichever name is active.
//
// Replaces a six-across row of 189px cards. Six portraits crammed into one row
// made every face too small to recognise, which is the only thing a lineup
// section is for — and it sat between two logo walls reading as a third grid.
// A name index in display type doesn't, and it scales: six speakers or forty,
// nothing shrinks.
//
// Below lg this renders nothing. The mobile grid stays as it was, which also
// means the cycle below never has to work without hover.

/** Per name. Six names is 24s a lap — quick enough to notice, slow enough to read. */
const DWELL_MS = 4000;

export function SpeakerRoster({ speakers }: { speakers: CardSpeaker[] }) {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  // Set once a touch lands. A tap is a decision, so the cycle stops for good
  // rather than yanking the portrait away four seconds later.
  const [stopped, setStopped] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);

  // `useReducedMotion` from motion/react is a hook on a media query; this is
  // the same query read directly, because this component doesn't otherwise
  // pull motion/react in and an auto-advancing portrait is exactly the kind of
  // thing that query exists to switch off.
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Only cycle while the section is actually on screen, so a visitor sees it
  // from the first name rather than arriving mid-lap — and so the timer isn't
  // running on a page nobody has scrolled to.
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing =
    inView && !paused && !stopped && !reduceMotion && speakers.length > 1;

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % speakers.length),
      DWELL_MS,
    );
    return () => window.clearInterval(id);
    // `active` is deliberately absent: including it would restart the interval
    // on every tick and on every hover, so the first name after a hover would
    // get a full dwell and the rest wouldn't.
  }, [playing, speakers.length]);

  if (speakers.length === 0) return null;

  // Hover and focus are the same intent — "show me this one" — so both take
  // over, and releasing resumes from the name you were on rather than from
  // wherever the timer had got to. Resuming from the old index makes the
  // portrait jump backwards, which reads as a bug.
  const take = (i: number) => {
    setActive(i);
    setPaused(true);
  };
  const release = () => setPaused(false);

  return (
    <div
      ref={root}
      className="mt-14 hidden lg:mt-16 lg:grid lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-8 xl:grid-cols-[1fr_minmax(0,24rem)] xl:gap-12"
      onPointerDown={(e) => {
        if (e.pointerType === "touch") setStopped(true);
      }}
    >
      <ol className="border-b border-white/10">
        {speakers.map((s, i) => {
          const current = i === active;
          const caption = [s.title, s.company].filter(Boolean).join(", ");
          return (
            <li key={s.id} className="border-t border-white/10">
              <div
                className="group relative flex items-center justify-between gap-6 py-6"
                onMouseEnter={() => take(i)}
                onMouseLeave={release}
              >
                <Link
                  href={`/speakers/${s.slug}`}
                  onFocus={() => take(i)}
                  onBlur={release}
                  className="min-w-0 focus-visible:outline-none"
                >
                  {/* The whole row is the target, not just the glyphs. */}
                  <span className="absolute inset-0 z-0" aria-hidden="true" />
                  <span
                    className={cn(
                      "block font-mono text-sm uppercase tracking-widest transition-colors duration-300 motion-reduce:transition-none",
                      current ? "text-white" : "text-white/35",
                    )}
                  >
                    {s.name}
                  </span>
                  {caption && (
                    <span
                      className={cn(
                        "mt-1.5 block font-mono text-sm uppercase tracking-widest transition-colors duration-300 motion-reduce:transition-none",
                        current ? "text-white/70" : "text-white/25",
                      )}
                    >
                      {caption}
                    </span>
                  )}
                </Link>

                {/* Only on the active row — six marks down the side would be a
                    column of icons competing with the names. */}
                {s.linkedin && (
                  <a
                    href={s.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${s.name} on LinkedIn`}
                    onFocus={() => take(i)}
                    onBlur={release}
                    className={cn(
                      "relative z-10 shrink-0 p-1.5 text-white transition-[opacity,color] duration-300 motion-reduce:transition-none hover:text-magenta focus-visible:opacity-100 focus-visible:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta",
                      current ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <LinkedInMark className="h-5 w-5" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Every portrait rendered and stacked, cross-faded by opacity. Swapping
          one `src` would re-request on each change and flash on a cold cache;
          this loads all six once and the swap costs nothing after that. */}
      <div className="relative overflow-hidden rounded-lg ring-1 ring-white/10">
        {speakers.map((s, i) =>
          s.imageUrl ? (
            <Image
              key={s.id}
              src={s.imageUrl}
              // Decorative: the active name is rendered as text beside it.
              alt=""
              fill
              // No `priority`. It emits a preload link, and a preload ignores
              // the `hidden lg:grid` wrapper — a 390px phone then downloaded
              // the first portrait for a pane it never renders. Measured both
              // ways. This section is far below the fold anyway, so there was
              // nothing to win.
              sizes="(min-width: 1280px) 24rem, 20rem"
              className={cn(
                // Same treatment as the cards — one 4:5-ish crop, top-biased
                // because faces sit high in a headshot, and grayscale, which
                // is what makes a set of mismatched source photos read as one
                // lineup.
                "object-cover object-[center_20%] grayscale transition-opacity duration-200 motion-reduce:transition-none",
                i === active ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
