"use client";

import * as React from "react";
import { BoltShader } from "@/components/site/bolt-shader";
import { TRACKS } from "@/lib/tracks";
import { cn } from "@/lib/utils";

// Hero-only circuit colors — brand-anchored (magenta) spectrum, chosen for the
// shader. Not brand data; purely how each circuit "reads" as current here.
const CIRCUIT_COLORS: Record<string, string> = {
  Founder: "#ff32a0",
  "Tech & Builders": "#4d7cff",
  "AI & Applied Innovation": "#19c8c8",
  "Small Business & Solopreneur": "#b45cff",
  Capital: "#ff6b57",
};
const DEFAULT_COLOR = "#ff32a0";

export function Hero() {
  const [active, setActive] = React.useState<string | null>(null);
  const activeTrack = TRACKS.find((t) => t.name === active) ?? null;
  const color = active ? CIRCUIT_COLORS[active] : DEFAULT_COLOR;

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      {/* Left — dates, headline, circuits */}
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
          San Antonio Startup + Tech Week. Founders, builders, and the community
          that backs them.
        </p>

        {/* Five circuits — woven into the message, feeding the current */}
        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Five circuits · one current
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:flex-col lg:items-start lg:gap-2">
            {TRACKS.map((t) => {
              const on = active === t.name;
              return (
                <li key={t.name}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(t.name)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(t.name)}
                    onBlur={() => setActive(null)}
                    onClick={() =>
                      setActive((a) => (a === t.name ? null : t.name))
                    }
                    className="group flex items-center gap-2.5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full transition-colors"
                      style={{
                        backgroundColor: on
                          ? CIRCUIT_COLORS[t.name]
                          : "var(--border)",
                      }}
                    />
                    <span
                      className={cn(
                        "text-base font-medium transition-colors",
                        on
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {t.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mx-auto mt-3 min-h-10 max-w-sm text-sm text-muted-foreground lg:mx-0">
            {activeTrack?.description ?? "Hover a circuit to feel the current."}
          </p>
        </div>
      </div>

      {/* Right — the current, large */}
      <div className="order-1 lg:order-2">
        <div className="mx-auto w-80 sm:w-96 lg:w-full">
          <BoltShader color={color} />
        </div>
      </div>
    </section>
  );
}
