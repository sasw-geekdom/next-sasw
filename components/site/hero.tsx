import Link from "next/link";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";
import { TRACK_NAMES, CIRCUIT_COLORS, DEFAULT_CIRCUIT_COLOR } from "@/lib/tracks";

// Cursor sweeps the five circuit colors across the bolt — "five circuits, one
// current" — and the bolt itself is the doorway into the 15-years archive.
const SWEEP = TRACK_NAMES.map((n) => CIRCUIT_COLORS[n]);

export function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      {/* Left — dates, headline, CTA */}
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">
          Sept 28 – Oct 2, 2026
        </p>

        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
          The current{" "}
          <span className="whitespace-nowrap">
            runs through <span className="text-magenta">SA.</span>
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-pretty text-lg text-muted-foreground lg:mx-0">
          San Antonio Startup + Tech Week. Founders, builders, and the capital
          behind them — five days, one current.
        </p>

        <div className="mt-8 flex justify-center lg:justify-start">
          <ButtonLink href="/plug-in" size="lg">
            Plug in.
          </ButtonLink>
        </div>
      </div>

      {/* Right — the current; the bolt is the doorway into 15 years */}
      <div className="order-1 lg:order-2">
        <Link
          href="/15-years"
          aria-label="15 years of Geekdom — enter the archive"
          className="group mx-auto block w-80 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:w-96 lg:w-full"
        >
          <ShaderCanvas
            color={DEFAULT_CIRCUIT_COLOR}
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
