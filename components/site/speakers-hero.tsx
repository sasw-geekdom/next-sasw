"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";
import { CIRCUIT_COLORS } from "@/lib/tracks";

// The lineup hero. Same shell as components/site/hero.tsx and the sessions
// hero — full viewport minus the navbar, bolt first on mobile and second on
// desktop, copy centred until lg. Only the charge changes, so the three read
// as one system at different points on the grid.
//
// Two circuits swept across the bolt rather than blended into one, the same
// mechanism the homepage uses for all five. Blending these two produced
// #da64ab, which sat close enough to brand magenta that the page didn't
// announce itself as somewhere new — the whole point of giving it a charge of
// its own. Kept apart, the purple and the coral both stay legible.
const SPEAKERS_SWEEP = [
  CIRCUIT_COLORS["Small Business & Solopreneur"],
  CIRCUIT_COLORS["Capital"],
];

// Resting on the purple, not the midpoint: at rest is how most people see the
// bolt, and it's the end furthest from magenta.
const SPEAKERS_REST = CIRCUIT_COLORS["Small Business & Solopreneur"];

// The flow mixes up from this floor toward whichever end the cursor is over,
// so the floor sits between them — a violet that neither end fights.
const BASE: [number, number, number] = [0.06, 0.01, 0.08];

export function SpeakersHero({ hasLineup }: { hasLineup: boolean }) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">
          The lineup · Sept 28 – Oct 2
        </p>

        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
          Every name{" "}
          <span className="whitespace-nowrap">
            on the <span className="text-magenta">grid.</span>
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-pretty text-lg text-muted-foreground lg:mx-0">
          {hasLineup
            ? "The founders, builders, and operators carrying the current across five circuits and five downtown rooms."
            : "Five circuits, five rooms, five days. The names go up as they're confirmed."}
        </p>

        {/* Plug in rather than register: someone reading the lineup is more
            likely weighing whether to be on it than buying a ticket. The
            homepage and /sessions keep "Get on the list." — each hero carries
            the action its page actually implies. */}
        <div className="mt-8 flex justify-center lg:justify-start">
          <ButtonLink href="/plug-in" size="lg">
            Plug in.
          </ButtonLink>
        </div>
      </div>

      {/* Not a link — unlike the homepage bolt, this one leads nowhere, and
          wrapping it in an anchor would be a dead click and a lie to a screen
          reader. */}
      <div className="order-1 lg:order-2">
        <div className="mx-auto w-80 sm:w-96 lg:w-full">
          <ShaderCanvas
            color={SPEAKERS_REST}
            sweep={SPEAKERS_SWEEP}
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
