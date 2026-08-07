import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

// The boundary for `notFound()` thrown anywhere under /speakers.
//
// Scoped here rather than left to the root 404 on purpose. Someone landing on
// a dead speaker URL followed a shared link to a *specific person* — the Bolt
// Runner is a good surprise for a mistyped address and a non-sequitur for
// that. They want to know the name isn't up and get to the ones that are.
//
// Sitting inside the (site) group is what earns the navbar and footer: a
// not-found file renders wrapped by the layouts above it, and (site)/layout
// is above this one. The root 404 sits outside that group, which is why the
// game renders bare — that's still what handles every other unmatched URL.

export const metadata: Metadata = {
  title: "Speaker not found",
  robots: { index: false },
};

export default function SpeakerNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            404 · not on the grid
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
            Not on the lineup.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-white/60">
            This link may be older than the lineup, or that speaker has come off
            it. Everyone else is still on the grid.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <ButtonLink href="/speakers" size="lg">
              See the lineup
            </ButtonLink>

            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:outline-none focus-visible:text-white/70"
            >
              Plug back in
              <ArrowUpRight
                className={cn(
                  ARROW_MOTION,
                  "h-3.5 w-3.5 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-magenta group-focus-visible:-translate-y-px group-focus-visible:translate-x-px group-focus-visible:text-magenta",
                )}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
