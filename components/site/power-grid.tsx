"use client";

import * as React from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { ProbeChip, useProbeChip } from "@/components/site/probe-chip";
import type { LogoEntityRow } from "@/lib/admin/cms-types";
import { cn } from "@/lib/utils";

// "Powering the current." — the sponsor + partner wall, fed by the admin CMS.
// Renders nothing until the CMS has entries, so it ships safely ahead of the
// sponsor lineup. Logos are optically area-balanced: wide wordmarks render at
// the base height while squarer/taller marks scale up, so every logo carries
// the same visual weight regardless of its file's aspect ratio.

const REF_ASPECT = 1.6; // a typical horizontal wordmark

function LogoCell({ row, size }: { row: LogoEntityRow; size: "lg" | "sm" }) {
  const [balance, setBalance] = React.useState(1);
  const { chipRef, probeProps } = useProbeChip();

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    setBalance(Math.min(1.5, Math.max(1, Math.sqrt(REF_ASPECT / aspect))));
  }

  // Optical balance × the admin's per-logo override (1 = untouched).
  const effective = balance * (row.scale ?? 1);

  return (
    <a
      href={row.link}
      target="_blank"
      rel="noreferrer"
      {...probeProps}
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
          style={
            effective !== 1 ? { transform: `scale(${effective})` } : undefined
          }
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
      <ProbeChip chipRef={chipRef}>{row.name}</ProbeChip>
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

        {/* The door — the section's end-cap CTA into Get Involved. Promoted
            from a text link to a filled button so the sponsor ask lands. */}
        <div className="mt-20 border-t border-white/10 pt-14 text-center lg:mt-28 lg:pt-16">
          <h3 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
            Put your brand on the grid.
          </h3>
          <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
            Reach founders, builders, and the capital behind them — five
            circuits, one current.
          </p>
          <div className="mt-7 flex justify-center">
            <ButtonLink href="/get-involved" size="lg">
              Power the week
            </ButtonLink>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-white/40">
            Sponsorships are open · Sept 28 – Oct 2
          </p>
        </div>
      </div>
    </section>
  );
}
