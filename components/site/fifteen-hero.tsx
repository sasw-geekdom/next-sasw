"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";

/** Hero for /15-years — the Geekdom wordmark, lit up with the "current." */
export function FifteenHero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          The throwback
        </p>

        {/* Accessible heading; the visual below is decorative. */}
        <h1 className="sr-only">15 Years of Geekdom</h1>

        <p
          aria-hidden="true"
          className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] sm:text-7xl"
        >
          15 Years of
        </p>

        {/* The star: Geekdom wordmark filled with the flowing shader. */}
        <div aria-hidden="true" className="mt-6 w-full max-w-3xl sm:mt-8">
          <ShaderCanvas
            color="#ff32a0"
            maskClassName="geekdom-mask"
            fallbackSrc="/brand/og-geekdom.svg"
            className="aspect-708/192 w-full"
          />
        </div>

        <p className="mx-auto mt-10 max-w-xl text-pretty text-white/60">
          Eleven years of San Antonio Startup + Tech Week. The people, the
          pitches, the late nights, and the community that plugged in. Scroll
          back through it.
        </p>
      </div>
    </section>
  );
}
