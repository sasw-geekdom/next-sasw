"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { LogoEntityRow } from "@/lib/admin/cms-types";
import { cn } from "@/lib/utils";

// "Powering the current." — the sponsor + partner wall, fed by the admin CMS.
// Renders nothing until the CMS has entries, so it ships safely ahead of the
// sponsor lineup. Logos are optically area-balanced: wide wordmarks render at
// the base height while squarer/taller marks scale up, so every logo carries
// the same visual weight regardless of its file's aspect ratio.

const REF_ASPECT = 1.6; // a typical horizontal wordmark

// The probe chip's resting spot (keyboard focus, first paint): centered
// under the logo. Mouse movement overrides it to track the cursor.
const CHIP_HOME = {
  left: "50%",
  top: "calc(100% + 6px)",
  transform: "translateX(-50%)",
} as const;

function LogoCell({ row, size }: { row: LogoEntityRow; size: "lg" | "sm" }) {
  const [balance, setBalance] = React.useState(1);
  const chipRef = React.useRef<HTMLSpanElement>(null);

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    setBalance(Math.min(1.5, Math.max(1, Math.sqrt(REF_ASPECT / aspect))));
  }

  // The chip follows the cursor like a probe readout — positioned directly
  // on the DOM so tracking stays smooth without re-rendering per mousemove.
  function onMove(e: React.MouseEvent) {
    const chip = chipRef.current;
    if (!chip) return;
    const r = e.currentTarget.getBoundingClientRect();
    chip.style.left = `${e.clientX - r.left + 14}px`;
    chip.style.top = `${e.clientY - r.top + 18}px`;
    chip.style.transform = "none";
  }

  function onLeave() {
    const chip = chipRef.current;
    if (!chip) return;
    chip.style.left = CHIP_HOME.left;
    chip.style.top = CHIP_HOME.top;
    chip.style.transform = CHIP_HOME.transform;
  }

  return (
    <a
      href={row.link}
      target="_blank"
      rel="noreferrer"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex items-center justify-center"
    >
      <span
        className={cn(
          // Rest slightly dimmed; hover/focus feeds the node full current.
          "relative block w-full opacity-80 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
          size === "lg" ? "h-16 sm:h-20" : "h-10 sm:h-12",
        )}
      >
        <span
          className="absolute inset-0"
          style={balance > 1 ? { transform: `scale(${balance})` } : undefined}
        >
          <Image
            src={row.imageUrl}
            alt={row.name}
            fill
            sizes={size === "lg" ? "320px" : "200px"}
            className="object-contain"
            onLoad={onLoad}
          />
        </span>
      </span>

      {/* Cursor-following name chip — the multimeter probe readout. */}
      <span
        ref={chipRef}
        aria-hidden="true"
        style={CHIP_HOME}
        className="pointer-events-none absolute z-20 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <span className="flex items-center gap-2 rounded-sm border border-white/15 bg-black/90 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/80 shadow-lg shadow-black/50">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-magenta" />
          {row.name}
        </span>
      </span>
    </a>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
    </div>
  );
}

export function PowerGrid({
  sponsors,
  partners,
}: {
  sponsors: LogoEntityRow[];
  partners: LogoEntityRow[];
}) {
  if (sponsors.length === 0 && partners.length === 0) return null;

  return (
    <section className="bg-black">
      <div className="mx-auto w-full max-w-7xl border-t border-white/10 px-6 py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            The power source
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
            Powering the current.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-white/60">
            The sponsors and partners keeping the grid live, Sept 28 – Oct 2.
          </p>
        </div>

        {sponsors.length > 0 && (
          <div className="mt-14 lg:mt-16">
            <GroupLabel>Sponsors</GroupLabel>
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {sponsors.map((s) => (
                <LogoCell key={s.id} row={s} size="lg" />
              ))}
            </div>
          </div>
        )}

        {partners.length > 0 && (
          <div className="mt-12">
            <GroupLabel>Partners</GroupLabel>
            <div className="grid grid-cols-3 gap-x-8 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
              {partners.map((p) => (
                <LogoCell key={p.id} row={p} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* The door — sponsorship inquiries run through Get Involved. */}
        <div className="mt-16 lg:mt-20">
          <Link
            href="/get-involved"
            className="group inline-flex items-baseline gap-2 font-display text-xl font-bold uppercase tracking-tight text-white transition-colors hover:text-magenta sm:text-2xl"
          >
            Power the week
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/40">
            Sponsorships are open — get involved.
          </p>
        </div>
      </div>
    </section>
  );
}
