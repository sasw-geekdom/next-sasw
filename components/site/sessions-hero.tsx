"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";
import { mixCircuits } from "@/lib/tracks";

// The schedule hero. Same construction as the homepage — copy left, the bolt
// carrying the current on the right — but running a different charge, so the
// pages read as the same system at different points on the grid.
//
// Halfway between Tech & Builders and AI & Applied Innovation: #33a2e4.
const SESSIONS_CURRENT = mixCircuits(
  "Tech & Builders",
  "AI & Applied Innovation",
);

// The flow mixes up from this floor toward the colour above, so the floor sits
// in the same family — a near-black magenta floor under a cyan current reads
// as two lights fighting.
const BASE: [number, number, number] = [0.01, 0.05, 0.08];

export function SessionsHero() {
  return (
    // Deliberately the same shell as components/site/hero.tsx: full viewport
    // minus the navbar, bolt first on mobile and second on desktop, copy
    // centred until lg and left-aligned after. The only structural difference
    // is that the homepage's circuit list has no equivalent here, and the bolt
    // isn't a doorway — it leads nowhere on this page, so it isn't a link.
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">
          The schedule · Sept 28 – Oct 2
        </p>

        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
          Coming online,{" "}
          <span className="whitespace-nowrap">
            room by <span className="text-magenta">room.</span>
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-pretty text-lg text-muted-foreground lg:mx-0">
          The full schedule lands closer to the week. These activations are
          confirmed.
        </p>

        <div className="mt-8 flex justify-center lg:justify-start">
          <ButtonLink href="/register" size="lg">
            Get on the list.
          </ButtonLink>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <div className="mx-auto w-80 sm:w-96 lg:w-full">
          <ShaderCanvas
            color={SESSIONS_CURRENT}
            base={BASE}
            maskClassName="bolt-mask"
            fallbackSrc="/brand/sastw-bolt.svg"
            className="aspect-square w-full"
          />
        </div>
      </div>
    </section>
  );
}
